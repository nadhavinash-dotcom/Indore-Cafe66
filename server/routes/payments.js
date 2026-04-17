const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/database');
const { getISTDateString, addDays } = require('../services/timeService');
const { createOrder, verifySignature } = require('../services/razorpayService');
const { verifyToken } = require('../middleware/auth');
const { PLAN_PRICES, PLAN_DURATIONS } = require('../config/constants');

const router = express.Router();

// POST /api/payment/create-order
router.post('/create-order', verifyToken('customer'),
  body('planType').isIn(['monthly', 'trial']),
  body('mealType').isIn(['lunch', 'dinner', 'both']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR' });

    const { planType, mealType, couponCode } = req.body;
    const db = getDB();

    const priceKey = `${planType}_${mealType === 'both' ? 'both' : 'single'}`;
    let amount = PLAN_PRICES[priceKey] || PLAN_PRICES[`${planType}_both`];

    // Apply coupon
    if (couponCode) {
      const settingsRow = db.prepare(`SELECT value FROM settings WHERE key = 'coupons'`).get();
      const coupons = JSON.parse(settingsRow?.value || '[]');
      const coupon = coupons.find(c => c.code === couponCode.toUpperCase());
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
  }
);

// POST /api/payment/verify
router.post('/verify', verifyToken('customer'),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_order_id').notEmpty(),
  body('planType').isIn(['monthly', 'trial']),
  body('mealType').isIn(['lunch', 'dinner', 'both']),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR' });

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, planType, mealType, amount } = req.body;

    const valid = verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature: razorpay_signature || '' });
    if (!valid) return res.status(400).json({ error: 'INVALID_SIGNATURE', message: 'Payment verification failed' });

    const db = getDB();
    const today = getISTDateString();
    const endDate = addDays(today, PLAN_DURATIONS[planType]);

    // Cancel any existing active subscription
    db.prepare(`UPDATE subscriptions SET status = 'cancelled' WHERE customer_id = ? AND status = 'active'`).run(req.user.id);

    const result = db.prepare(`
      INSERT INTO subscriptions (customer_id, plan_type, meal_type, start_date, end_date, status, amount_paid, payment_id, razorpay_order_id)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `).run(req.user.id, planType, mealType, today, endDate, (amount || 0) / 100, razorpay_payment_id, razorpay_order_id);

    const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, subscription: sub });
  }
);

module.exports = router;
