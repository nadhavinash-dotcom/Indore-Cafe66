const express = require('express');
const { body, validationResult } = require('express-validator');
const { getISTDateString, addDays } = require('../services/timeService');
const { createOrder, verifySignature } = require('../services/razorpayService');
const { verifyToken } = require('../middleware/auth');
const { PLAN_PRICES, PLAN_DURATIONS } = require('../config/constants');
const { Setting, Subscription } = require('../models');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeDoc } = require('../utils/mongo');

const router = express.Router();

router.post('/create-order', verifyToken('customer'),
  body('planType').isIn(['monthly', 'trial']),
  body('mealType').isIn(['lunch', 'dinner', 'both']),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR' });

    const { planType, mealType, couponCode } = req.body;
    const priceKey = `${planType}_${mealType === 'both' ? 'both' : 'single'}`;
    let amount = PLAN_PRICES[priceKey] || PLAN_PRICES[`${planType}_both`];

    if (couponCode) {
      const settingsRow = await Setting.findOne({ key: 'coupons' });
      const coupons = JSON.parse(settingsRow?.value || '[]');
      const coupon = coupons.find((item) => item.code === couponCode.toUpperCase());
      if (coupon) {
        if (coupon.type === 'percent') amount = Math.floor(amount * (1 - coupon.value / 100));
        else if (coupon.type === 'flat') amount = Math.max(0, amount - coupon.value);
      }
    }

    const receipt = `ci_${req.user.id}_${Date.now()}`;
    const order = await createOrder({ amount, receipt, notes: { customerId: req.user.id, planType, mealType } });

    res.json({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      isMock: !!order.mock,
    });
  })
);

router.post('/verify', verifyToken('customer'),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_order_id').notEmpty(),
  body('planType').isIn(['monthly', 'trial']),
  body('mealType').isIn(['lunch', 'dinner', 'both']),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR' });

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planType, mealType, amount } = req.body;
    const valid = verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature: razorpay_signature || '' });
    if (!valid) return res.status(400).json({ error: 'INVALID_SIGNATURE', message: 'Payment verification failed' });

    const today = getISTDateString();
    const endDate = addDays(today, PLAN_DURATIONS[planType]);

    await Subscription.updateMany(
      { customer_id: req.user.id, status: 'active' },
      { $set: { status: 'cancelled' } }
    );

    const sub = await Subscription.create({
      customer_id: req.user.id,
      plan_type: planType,
      meal_type: mealType,
      start_date: today,
      end_date: endDate,
      status: 'active',
      amount_paid: (amount || 0) / 100,
      payment_id: razorpay_payment_id,
      razorpay_order_id,
    });

    res.json({ success: true, subscription: serializeDoc(sub) });
  })
);

module.exports = router;
