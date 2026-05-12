import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
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

import { CFEnvironment,
  CFSession } from 'cashfree-pg-api-contract';

export default function PaymentScreen({ navigation, route }) {
  const { plan, mealChoice, price } = route.params;
  const [loading, setLoading] = useState(false);
  const customer = useAuthStore((s) => s.customer);
console.log( plan, mealChoice, price)
  const handlePayment = async () => {
    setLoading(true);
    try {
      // Start date = tomorrow to avoid same-day cutoff issues
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const selectedStartDate = tomorrow.toISOString().split('T')[0];

      // 1. Create order on backend (sends auth token via api interceptor)
      const { data } = await api.post('/payment/create-order', {

        orderAmount: price,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        customerEmail: customer?.email
          ? customer.email
          : "manikanththarine31@gmail.com",
        planType: plan.id,
        mealType: mealChoice,
        subscriptionPlan: {
          selectedStartDate,
          mealStartDates: {
            lunch: mealChoice !== 'dinner' ? selectedStartDate : null,
            dinner: mealChoice !== 'lunch' ? selectedStartDate : null,
          },
        },
      });

      console.log(data)

      const payment_session_id = data.payment_session_id;

      const session = new CFSession(
        data.order_id,
        payment_session_id,
        "SANDBOX" // Change to "PRODUCTION" for live
      );
      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor('#000000')
        .setNavigationBarTextColor('#FFFFFF')
        .setButtonBackgroundColor('#000000')
        .setButtonTextColor('#FFFFFF')
        .build();

      const dropPayment = new CFDropCheckoutPayment(
        session,
        null,
        theme
      );

      CFPaymentGatewayService.doPayment(dropPayment);


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
      // if (error.description) {
      //   // Razorpay SDK error (cancelled or failed)
      //   Alert.alert('Payment Failed', error.description || 'Payment was cancelled');
      // } else {
      console.error(error);
      Alert.alert(
        'Error',
        error?.message || 'Could not complete payment'
      );      // }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {

    CFPaymentGatewayService.setCallback({
      onVerify(orderID) {

        console.log('VERIFY:', orderID);

        navigation.replace('Success');
      },

      onError(error, orderID) {

        console.log('ERROR:', error, orderID);

        Alert.alert(
          'Payment Failed',
          error?.message || 'Something went wrong'
        );
      },
    });

    return () => {
      CFPaymentGatewayService.removeCallback();
    };

  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Order Summary</Text>

        <Card style={styles.summaryCard}>
          <Row label="Plan" value={plan?.name} />
          <Row label="Duration" value={`${plan.days} days`} />
          <Row label="Meal Choice" value={mealChoice.charAt(0).toUpperCase() + mealChoice.slice(1)} />
          <Row label="Area" value={customer?.area} />
          <Row label="Address" value={customer?.address} />
          <View style={styles.divider} />
          <Row label="Total" value={`₹${price}`} highlight />
        </Card>

        <Text style={styles.note}>Payment secured by cash free</Text>

        <Button
          title={`Pay ₹${price}`}
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
