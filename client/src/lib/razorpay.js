export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpay({ orderData, customer, onSuccess, onError }) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    onError?.('Unable to load Razorpay. Please check your internet connection.');
    return;
  }

  // Mock mode — skip real Razorpay
  if (orderData.isMock) {
    onSuccess?.({
      razorpay_payment_id: `pay_mock_${Date.now()}`,
      razorpay_order_id: orderData.razorpayOrderId,
      razorpay_signature: 'mock_signature',
    });
    return;
  }

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: orderData.amount,
    currency: 'INR',
    order_id: orderData.razorpayOrderId,
    name: 'Cafe Indoor',
    description: 'Meal Subscription',
    theme: { color: '#C9922A' },
    modal: { backdropclose: false },
    prefill: {
      name: customer?.name || '',
      contact: customer?.phone ? `+91${customer.phone}` : '',
    },
    handler: (response) => onSuccess?.(response),
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', (response) => onError?.(response.error?.description || 'Payment failed'));
  rzp.open();
}
