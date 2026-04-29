const crypto = require('crypto');

let razorpayInstance = null;

function getRazorpay() {
  if (process.env.RAZORPAY_MOCK === 'true') return null;
  if (!razorpayInstance) {
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

async function createOrder({ amount, receipt, notes = {} }) {
  if (process.env.RAZORPAY_MOCK === 'true') {
    const mockOrderId = `order_mock_${Date.now()}`;
    return {
      id: mockOrderId,
      amount,
      currency: 'INR',
      receipt,
      status: 'created',
      mock: true,
    };
  }

  const rzp = getRazorpay();
  return rzp.orders.create({ amount, currency: 'INR', receipt, notes });
}

function verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (process.env.RAZORPAY_MOCK === 'true') return true;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === razorpay_signature;
}

module.exports = { createOrder, verifySignature };
