import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

import {
  CFPaymentGatewayService,
  CFThemeBuilder,
  CFDropCheckoutPayment,
} from 'react-native-cashfree-pg-sdk';

import { CFSession } from 'cashfree-pg-api-contract';

export default function PaymentScreen({ navigation, route }) {
  const { plan, mealChoice, price } = route.params;

  const [loading, setLoading] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponError, setCouponError] = useState('');

  const customer = useAuthStore((s) => s.customer);

  // =========================
  // LOAD COUPONS
  // =========================
  useEffect(() => {
    let mounted = true;

    async function loadCoupons() {
      try {
        const res = await api.get('/admin/settings');

        const rawCoupons = res.data?.settings?.coupons;

        if (!rawCoupons) {
          if (mounted) setAvailableCoupons([]);
          return;
        }

        const parsedCoupons = Array.isArray(rawCoupons)
          ? rawCoupons
          : JSON.parse(rawCoupons);

        if (mounted) {
          setAvailableCoupons(
            Array.isArray(parsedCoupons) ? parsedCoupons : []
          );
        }
      } catch (err) {
        console.log('Failed to load coupons', err);

        if (mounted) {
          setAvailableCoupons([]);
        }
      }
    }

    loadCoupons();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================
  // MATCHED COUPON
  // =========================
  const matchedCoupon = useMemo(() => {
    const normalizedCode = appliedCouponCode
      .trim()
      .toLowerCase();

    if (!normalizedCode) return null;

    return (
      availableCoupons.find(
        (coupon) =>
          coupon.code?.toLowerCase() === normalizedCode
      ) || null
    );
  }, [appliedCouponCode, availableCoupons]);

  // =========================
  // DISCOUNT
  // =========================
  const discountAmount = useMemo(() => {
    if (!matchedCoupon) return 0;

    if (matchedCoupon.type === 'percent') {
      return Math.min(
        Number(price),
        Math.round(
          (Number(price) *
            Number(matchedCoupon.value || 0)) /
            100
        )
      );
    }

    if (matchedCoupon.type === 'flat') {
      return Math.min(
        Number(price),
        Number(matchedCoupon.value || 0)
      );
    }

    return 0;
  }, [matchedCoupon, price]);

  // =========================
  // FINAL PAYABLE
  // =========================
  const payableTotal = Math.max(
    0,
    Number(price) - discountAmount
  );

  // =========================
  // APPLY COUPON
  // =========================
  const applyCoupon = () => {
    const normalizedCode = couponCode
      .trim()
      .toLowerCase();

    if (!normalizedCode) {
      setAppliedCouponCode('');
      setCouponError('Please enter coupon code');
      return;
    }

    const coupon = availableCoupons.find(
      (item) =>
        item.code?.toLowerCase() === normalizedCode
    );

    if (!coupon) {
      setAppliedCouponCode('');
      setCouponError('Invalid coupon code');
      return;
    }

    setAppliedCouponCode(coupon.code);
    setCouponCode(coupon.code);
    setCouponError('');

    Alert.alert('Success', 'Coupon Applied');
  };

  // =========================
  // HANDLE PAYMENT
  // =========================
  const handlePayment = async () => {
    setLoading(true);

    try {
      // Tomorrow date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const selectedStartDate = tomorrow
        .toISOString()
        .split('T')[0];

      // CREATE ORDER
      const { data } = await api.post(
        '/payment/create-order',
        {
          orderAmount: payableTotal,

          couponCode: matchedCoupon
            ? matchedCoupon.code
            : '',

          customerName: customer?.name,

          customerPhone: customer?.phone,

          customerEmail: customer?.email
            ? customer.email
            : 'manikanththarine31@gmail.com',

          planType: plan.id,

          mealType: mealChoice,

          subscriptionPlan: {
            selectedStartDate,

            discountAmount,

            finalAmount: payableTotal,

            couponCode: matchedCoupon
              ? matchedCoupon.code
              : '',

            mealStartDates: {
              lunch:
                mealChoice !== 'dinner'
                  ? selectedStartDate
                  : null,

              dinner:
                mealChoice !== 'lunch'
                  ? selectedStartDate
                  : null,
            },
          },
        }
      );

      console.log('ORDER RESPONSE =>', data);

      const payment_session_id =
        data.payment_session_id;

      const session = new CFSession(
        data.order_id,
        payment_session_id,
        'SANDBOX'
      );

      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor('#000000')
        .setNavigationBarTextColor('#FFFFFF')
        .setButtonBackgroundColor('#000000')
        .setButtonTextColor('#FFFFFF')
        .build();

      const dropPayment =
        new CFDropCheckoutPayment(
          session,
          null,
          theme
        );

      CFPaymentGatewayService.doPayment(
        dropPayment
      );



      // // Mock mode: skip Razorpay UI, call verify directly
      // if (orderData.isMock) {
      //   const { data: verifyData } = await api.post('/payment/verify', {
      //     razorpay_order_id: orderData.razorpayOrderId,
      //     razorpay_payment_id: `mock_pay_${Date.now()}`,
      //     razorpay_signature: '',
      //   });
      //   if (verifyData.success) {
      //     Alert.alert('Success', 'Subscription Confirmed!', [
      //       { text: 'OK', onPress: () => navigation.navigate('Dashboard') },
      //     ]);
      //   }
      //   return;
      // }

      // // 2. Open Razorpay Checkout
      // const options = {
      //   description: `Subscription for ${plan.name}`,
      //   image: 'https://i.imgur.com/3g7nmJC.png',
      //   currency: orderData.currency,
      //   key: orderData.keyId,
      //   amount: orderData.amount,
      //   name: 'Cafe Indore',
      //   order_id: orderData.razorpayOrderId,
      //   prefill: {
      //     email: customer?.email || '',
      //     contact: customer?.phone || '',
      //     name: customer?.name || '',
      //   },
      //   theme: { color: COLORS.emerald },
      // };

      // const payData = await RazorpayCheckout.open(options);

      // // 3. Verify payment on backend (sends auth token via api interceptor)
      // const { data: verifyData } = await api.post('/payment/verify', {
      //   razorpay_order_id: payData.razorpay_order_id,
      //   razorpay_payment_id: payData.razorpay_payment_id,
      //   razorpay_signature: payData.razorpay_signature,
      // });

      // if (verifyData.success) {
      //   Alert.alert('Success', 'Subscription Confirmed!', [
      //     { text: 'OK', onPress: () => navigation.navigate('Dashboard') },
      //   ]);
      // }

    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        error?.message ||
          'Could not complete payment'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CASHFREE CALLBACKS
  // =========================
  useEffect(() => {
    CFPaymentGatewayService.setCallback({
      onVerify(orderID) {
        console.log('VERIFY:', orderID);

        navigation.replace('Success');
      },

      onError(error, orderID) {
        console.log(
          'ERROR:',
          error,
          orderID
        );

        Alert.alert(
          'Payment Failed',
          error?.message ||
            'Something went wrong'
        );
      },
    });

    return () => {
      CFPaymentGatewayService.removeCallback();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.title}>
          Order Summary
        </Text>

        {/* SUMMARY */}
        <Card style={styles.summaryCard}>
          <Row
            label="Plan"
            value={plan?.name}
          />

          <Row
            label="Duration"
            value={`${plan.days} days`}
          />

          <Row
            label="Meal Choice"
            value={
              mealChoice.charAt(0).toUpperCase() +
              mealChoice.slice(1)
            }
          />

          <Row
            label="Area"
            value={customer?.area}
          />

          <Row
            label="Address"
            value={customer?.address}
          />

          <View style={styles.divider} />

          <Row
            label="Plan Total"
            value={`₹${price}`}
          />

          {matchedCoupon && (
            <Row
              label="Discount"
              value={`- ₹${discountAmount}`}
            />
          )}

          <Row
            label="Final Total"
            value={`₹${payableTotal}`}
            highlight
          />
        </Card>

        {/* COUPON */}
        <Card style={styles.summaryCard}>
          <Text style={styles.couponTitle}>
            Coupon Code
          </Text>

          <TextInput
            value={couponCode}
            onChangeText={(text) => {
              setCouponCode(
                text.toUpperCase()
              );

              setAppliedCouponCode('');
              setCouponError('');
            }}
            placeholder="Enter coupon code"
            placeholderTextColor="#888"
            style={styles.input}
          />

          {!!couponError && (
            <Text style={styles.errorText}>
              {couponError}
            </Text>
          )}

          <Button
            title="Apply Coupon"
            onPress={applyCoupon}
            style={{ marginTop: 12 }}
          />

          {matchedCoupon && (
            <Text style={styles.successText}>
              Applied {matchedCoupon.code} (
              {matchedCoupon.type ===
              'percent'
                ? `${matchedCoupon.value}% OFF`
                : `₹${matchedCoupon.value} OFF`}
              )
            </Text>
          )}
        </Card>

        <Text style={styles.note}>
          Payment secured by Cashfree
        </Text>

        {/* PAY BUTTON */}
        <Button
          title={`Pay ₹${payableTotal}`}
          onPress={handlePayment}
          loading={loading}
          style={styles.payBtn}
        />

        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="ghost"
          style={styles.backBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================
// ROW COMPONENT
// =========================
function Row({
  label,
  value,
  highlight,
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.rowValue,
          highlight &&
            styles.rowValueHighlight,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// =========================
// STYLES
// =========================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
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

  summaryCard: {
    marginBottom: 24,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  rowLabel: {
    color: COLORS.whiteMuted,
    fontSize: 14,
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

  divider: {
    height: 1,
    backgroundColor: COLORS.blackBorder,
    marginVertical: 8,
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

  backBtn: {},

  couponTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.blackBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.white,
    backgroundColor: '#111',
  },

  errorText: {
    color: 'red',
    marginTop: 8,
  },

  successText: {
    color: COLORS.gold,
    marginTop: 12,
    fontWeight: '600',
  },
});