import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RazorpayCheckout from 'react-native-razorpay';

import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

export default function PaymentScreen({ navigation, route }) {
  const { plan, mealChoice, price } = route.params;
  const customer = useAuthStore((s) => s.customer);

  // ─────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);

  const [availableCoupons, setAvailableCoupons] = useState([]);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  // ─────────────────────────────────────────────
  // Load checkout config (keyId + coupons)
  // ─────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function loadConfig() {
      try {
        const res = await api.get('/payment/checkout-config');
        const { keyId, coupons } = res.data;

        if (!mounted) return;

        if (keyId) +(keyId);

        setAvailableCoupons(
          Array.isArray(coupons) ? coupons : []
        );
      } catch (err) {
        console.error('Failed to load checkout config:', err);
        if (mounted) setAvailableCoupons([]);
      } finally {
        if (mounted) setConfigLoading(false);
      }
    }

    loadConfig();

    return () => {
      mounted = false;
    };
  }, []);

  // ─────────────────────────────────────────────
  // Matched coupon (from appliedCouponCode)
  // ─────────────────────────────────────────────
  const matchedCoupon = useMemo(() => {
    const normalized = (appliedCouponCode || '').trim().toLowerCase();
    if (!normalized) return null;

    return (
      availableCoupons.find(
        (c) => (c?.code || '').toString().toLowerCase() === normalized
      ) || null
    );
  }, [appliedCouponCode, availableCoupons]);

  // ─────────────────────────────────────────────
  // Discount amount
  // ─────────────────────────────────────────────
  const discountAmount = useMemo(() => {
    if (!matchedCoupon) return 0;

    const basePrice = Number(price);
    const value = Number(matchedCoupon?.value || 0);

    if (matchedCoupon.type === 'percent') {
      return Math.min(basePrice, Math.round((basePrice * value) / 100));
    }

    if (matchedCoupon.type === 'flat') {
      return Math.min(basePrice, value);
    }

    return 0;
  }, [matchedCoupon, price]);

  // ─────────────────────────────────────────────
  // Final payable amount (in ₹)
  // ─────────────────────────────────────────────
  const payableTotal = Math.max(0, Number(price) - discountAmount);

  // ─────────────────────────────────────────────
  // Apply coupon
  // ─────────────────────────────────────────────
  const applyCoupon = () => {
    const normalized = (couponCode || '').trim().toLowerCase();

    if (!normalized) {
      setAppliedCouponCode('');
      setCouponError('Please enter a coupon code');
      return;
    }

    const coupon = availableCoupons.find(
      (item) => (item?.code || '').toString().toLowerCase() === normalized
    );

    if (!coupon) {
      setAppliedCouponCode('');
      setCouponError('Invalid coupon code');
      return;
    }

    setAppliedCouponCode(String(coupon.code));
    setCouponCode(String(coupon.code));
    setCouponError('');
    Alert.alert('Success', 'Coupon applied successfully!');
  };

  const removeCoupon = () => {
    setAppliedCouponCode('');
    setCouponCode('');
    setCouponError('');
  };

  // ─────────────────────────────────────────────
  // Step 1 — Create order on backend
  // ─────────────────────────────────────────────
  const createOrder = async (selectedStartDate) => {
    const response = await api.post('/payment/create-order', {
      orderAmount: payableTotal,          // ₹ — backend multiplies ×100
      planType: plan?.id,
      mealType: mealChoice,
      couponCode: matchedCoupon?.code || '',
      subscriptionPlan: {
        selectedStartDate,
        mealStartDates: {
          lunch: mealChoice !== 'dinner' ? selectedStartDate : null,
          dinner: mealChoice !== 'lunch' ? selectedStartDate : null,
        },
      },
    });

    return response.data; // { order_id, amount (paise), currency, keyId }
  };

  // ─────────────────────────────────────────────
  // Step 2 — Verify payment on backend
  // ─────────────────────────────────────────────
  const verifyPayment = async (paymentData) => {
    const response = await api.post('/payment/verify-payment', {
      razorpay_order_id: paymentData.razorpay_order_id,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_signature: paymentData.razorpay_signature,
    });

    return response.data; // { success, subscription }
  };

  // ─────────────────────────────────────────────
  // Main payment handler
  // ─────────────────────────────────────────────
  const handlePayment = async () => {
    if (loading) return;

    setLoading(true);

    try {
      // Use tomorrow as the start date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const selectedStartDate = tomorrow.toISOString().split('T')[0];

      // 1. Create order
      const orderData = await createOrder(selectedStartDate);

      if (!orderData?.order_id) {
        Alert.alert('Error', 'Failed to create order. Please try again.');
        return;
      }

      // 2. Open Razorpay checkout
      const options = {
        description: `${plan?.name} — ${mealChoice} subscription`,
        currency: orderData.currency || 'INR',
        key: orderData.keyId,
        amount: orderData.amount,          // already in paise from backend
        name: 'Cafe Indore',
        order_id: orderData.order_id,
        prefill: {
          contact: customer?.phone ? String(customer.phone) : '',
          name: customer?.name || '',
        },
        theme: { color: COLORS.gold || '#3399cc' },
      };

      const paymentData = await RazorpayCheckout.open(options);

      // 3. Verify with backend
      const result = await verifyPayment(paymentData);

      if (result?.success) {
        Alert.alert('🎉 Success', 'Your subscription is confirmed!', [
          {
            text: 'Go to Dashboard',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ]);
      } else {
        Alert.alert('Failed', 'Payment verification failed. Please contact support.');
      }

    } catch (error) {
      // Razorpay SDK throws on cancel/failure
      if (error?.code === 0) {
        // User dismissed the payment sheet — no alert needed
        return;
      }

      const message =
        error?.response?.data?.message ||
        error?.description ||
        error?.message ||
        'Something went wrong. Please try again.';

      Alert.alert('Payment Error', message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Loading config state
  // ─────────────────────────────────────────────
  if (configLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.gold || '#fff'} />
          <Text style={styles.loadingText}>Loading payment details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.title}>Order Summary</Text>

        {/* ── Summary Card ── */}
        <Card style={styles.card}>
          <Row label="Plan" value={plan?.name} />
          <Row label="Duration" value={`${plan?.days} days`} />
          <Row
            label="Meal Choice"
            value={mealChoice.charAt(0).toUpperCase() + mealChoice.slice(1)}
          />
          <Row label="Area" value={customer?.area} />
          <Row label="Address" value={customer?.address} />

          <View style={styles.divider} />

          <Row label="Plan Total" value={`₹${price}`} />

          {matchedCoupon && (
            <Row label="Discount" value={`- ₹${discountAmount}`} valueStyle={styles.discountText} />
          )}

          <Row label="Final Total" value={`₹${payableTotal}`} highlight />
        </Card>

        {/* ── Coupon Card ── */}
        <Card style={styles.card}>
          <Text style={styles.couponTitle}>Have a Coupon?</Text>

          <View style={styles.couponRow}>
            <TextInput
              value={couponCode}
              onChangeText={(text) => {
                setCouponCode(text.toUpperCase());
                setAppliedCouponCode('');
                setCouponError('');
              }}
              placeholder="Enter coupon code"
              placeholderTextColor="#888"
              style={[styles.input, { flex: 1, marginRight: 10 }]}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={applyCoupon}
            />
            <Button
              title="Apply"
              onPress={applyCoupon}
              style={styles.applyBtn}
            />
          </View>

          {!!couponError && (
            <Text style={styles.errorText}>{couponError}</Text>
          )}

          {matchedCoupon && (
            <View style={styles.couponSuccess}>
              <Text style={styles.successText}>
                ✅ {matchedCoupon.code} —{' '}
                {matchedCoupon.type === 'percent'
                  ? `${matchedCoupon.value}% OFF`
                  : `₹${matchedCoupon.value} OFF`}
              </Text>
              <Text style={styles.removeText} onPress={removeCoupon}>
                Remove
              </Text>
            </View>
          )}
        </Card>

        <Text style={styles.note}>🔒 Payment secured by Razorpay</Text>

        {/* ── Pay Button ── */}
        <Button
          title={loading ? 'Processing…' : `Pay ₹${payableTotal}`}
          onPress={handlePayment}
          loading={loading}
          disabled={loading}
          style={styles.payBtn}
        />

        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="ghost"
          disabled={loading}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Row component
// ─────────────────────────────────────────────
function Row({ label, value, highlight, valueStyle }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          highlight && styles.rowValueHighlight,
          valueStyle,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },

  loadingText: {
    color: COLORS.whiteMuted,
    fontSize: 14,
    marginTop: 12,
  },

  scroll: {
    padding: 24,
    paddingBottom: 40,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 24,
  },

  card: {
    marginBottom: 24,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  rowLabel: {
    color: COLORS.whiteMuted,
    fontSize: 14,
    flex: 1,
  },

  rowValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '55%',
    textAlign: 'right',
  },

  rowValueHighlight: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: '800',
  },

  discountText: {
    color: '#4ade80', // green
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.blackBorder,
    marginVertical: 10,
  },

  couponTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.blackBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.white,
    backgroundColor: '#111',
    fontSize: 14,
  },

  applyBtn: {
    paddingHorizontal: 16,
  },

  couponSuccess: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  successText: {
    color: COLORS.gold,
    fontWeight: '600',
    fontSize: 13,
  },

  removeText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '600',
  },

  errorText: {
    color: '#f87171',
    marginTop: 8,
    fontSize: 13,
  },

  note: {
    color: COLORS.whiteMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },

  payBtn: {
    marginBottom: 12,
  },
});