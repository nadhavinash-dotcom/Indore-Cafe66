import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

export default function PaymentScreen({ navigation, route }) {
  const { plan, mealPref, area, addressLine, landmark } = route.params;
  const [loading, setLoading] = useState(false);
  const customer = useAuthStore((s) => s.customer);

  async function handlePayment() {
    setLoading(true);
    try {
      const { data: orderData } = await api.post('/payment/create-order', {
        planId: plan.id,
        amount: plan.price,
      });

      // In dev/mock mode the server returns success immediately
      if (orderData.mock) {
        await confirmSubscription(orderData.razorpayOrderId, 'mock_payment', 'mock_signature');
        return;
      }

      // Real Razorpay: open web browser or SDK
      Alert.alert('Payment', 'Razorpay integration requires native SDK in production build.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  }

  async function confirmSubscription(razorpayOrderId, paymentId, signature) {
    const { data } = await api.post('/payment/verify', {
      razorpayOrderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      planId: plan.id,
      mealPreference: mealPref,
      area,
      addressLine1: addressLine,
      landmark: landmark || '',
    });
    if (data.success) {
      navigation.replace('PaymentSuccess', { subscription: data.subscription });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Order Summary</Text>

        <Card style={styles.summaryCard}>
          <Row label="Plan" value={plan.name} />
          <Row label="Duration" value={`${plan.days} days`} />
          <Row label="Meal Preference" value={mealPref.charAt(0).toUpperCase() + mealPref.slice(1)} />
          <Row label="Area" value={area} />
          <Row label="Address" value={addressLine} />
          <View style={styles.divider} />
          <Row label="Total" value={`₹${plan.price}`} highlight />
        </Card>

        <Text style={styles.note}>Payment secured by Razorpay</Text>

        <Button
          title={`Pay ₹${plan.price}`}
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

function Row({ label, value, highlight }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  scroll: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginBottom: 24 },
  summaryCard: { marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rowLabel: { color: COLORS.whiteMuted, fontSize: 14 },
  rowValue: { color: COLORS.white, fontSize: 14, fontWeight: '500', maxWidth: '55%', textAlign: 'right' },
  rowValueHighlight: { color: COLORS.gold, fontSize: 18, fontWeight: '800' },
  divider: { height: 1, backgroundColor: COLORS.blackBorder, marginVertical: 8 },
  note: { color: COLORS.whiteMuted, fontSize: 12, textAlign: 'center', marginBottom: 24 },
  payBtn: { marginBottom: 12 },
  backBtn: {},
});
