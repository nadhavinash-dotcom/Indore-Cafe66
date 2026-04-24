const express = require('express');
const { body, validationResult } = require('express-validator');
const { getMealAvailability, isCutoffPassed, getISTDateString } = require('../services/timeService');
const { verifyToken } = require('../middleware/auth');
const { Order, Subscription } = require('../models');
const { asyncHandler } = require('../utils/asyncHandler');
const { serializeDoc } = require('../utils/mongo');

const router = express.Router();

router.get('/availability', (req, res) => {
  const availability = getMealAvailability();
  res.json(availability);
});

router.post('/book', verifyToken('customer'),
  body('mealType').isIn(['lunch', 'dinner']),
  body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid data' });

    const { mealType, date, specialNote } = req.body;
    const customerId = req.user.id;
    const today = getISTDateString();
    const targetDate = date || today;

    if (targetDate === today && isCutoffPassed(mealType)) {
      return res.status(400).json({
        error: 'CUTOFF_PASSED',
        message: `${mealType === 'lunch' ? 'Lunch' : 'Dinner'} booking band ho gayi hai. Kal try karo.`,
      });
    }

    const sub = await Subscription.findOne({
      customer_id: customerId,
      status: 'active',
      end_date: { $gte: targetDate },
    }).sort({ created_at: -1 });

    if (!sub) {
      return res.status(400).json({ error: 'NO_SUBSCRIPTION', message: 'Koi active subscription nahi hai.' });
    }

    if (sub.meal_type !== 'both' && sub.meal_type !== mealType) {
      return res.status(400).json({ error: 'MEAL_NOT_IN_PLAN', message: `Aapke plan mein ${mealType} nahi hai.` });
    }

    if (sub.pause_start && sub.pause_end && targetDate >= sub.pause_start && targetDate <= sub.pause_end) {
      return res.status(400).json({ error: 'SUBSCRIPTION_PAUSED', message: `Subscription ${sub.pause_start} se ${sub.pause_end} tak paused hai.` });
    }

    const existing = await Order.findOne({ customer_id: customerId, meal_type: mealType, delivery_date: targetDate });
    if (existing) {
      return res.status(400).json({ error: 'ORDER_EXISTS', message: 'Is meal ka order pehle se hai.' });
    }

    const order = await Order.create({
      subscription_id: sub._id,
      customer_id: customerId,
      meal_type: mealType,
      delivery_date: targetDate,
      status: 'confirmed',
      special_note: specialNote || null,
    });

    res.json({ success: true, order: serializeDoc(order) });
  })
);

module.exports = router;
