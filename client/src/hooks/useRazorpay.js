import { useState } from 'react';
import api from '../lib/api';
import { openRazorpay } from '../lib/razorpay';

export default function useRazorpay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function initiatePayment({ planType, mealType, couponCode, customer, subscriptionPlan, onSuccess }) {
    setLoading(true);
    setError('');
    try {
      const orderRes = await api.post('/payment/create-order', {
        planType,
        mealType,
        couponCode,
        subscriptionPlan,
        orderAmount: subscriptionPlan?.finalAmount,
        customerName: customer?.name || '',
        customerPhone: customer?.phone || '',
        customerEmail: customer?.email || '',
      });
      const orderData = orderRes.data;

      await openRazorpay({
        orderData,
        customer,
        onSuccess: async (paymentResponse) => {
          try {
            const verifyRes = await api.post('/payment/verify', {
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_signature: paymentResponse.razorpay_signature || '',
              planType,
              mealType,
              amount: orderData.amount,
              subscriptionPlan,
            });
            onSuccess?.(verifyRes.data);
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed.');
          } finally {
            setLoading(false);
          }
        },
        onError: (msg) => {
          setError(msg || 'Payment failed.');
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start payment.');
      setLoading(false);
    }
  }

  return { loading, error, initiatePayment };
}
