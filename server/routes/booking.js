const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/database');
const { getMealAvailability, isCutoffPassed, getISTDateString, getTomorrowISTDateString } = require('../services/timeService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/booking/availability
router.get('/availability', (req, res) => {
  const availability = getMealAvailability();
  res.json(availability);
});

// POST /api/orders/book
router.post('/book', verifyToken('customer'),
  body('mealType').isIn(['lunch', 'dinner']),
  body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid data' });

    const { mealType, date, specialNote } = req.body;
    const customerId = req.user.id;
    const today = getISTDateString();
    const tomorrow = getTomorrowISTDateString();
    const targetDate = date || today;

    // If booking for today, check cutoff
    if (targetDate === today && isCutoffPassed(mealType)) {
      return res.status(400).json({
        error: 'CUTOFF_PASSED',
        message: `${mealType === 'lunch' ? 'Lunch' : 'Dinner'} booking band ho gayi hai. Kal try karo.`,
      });
    }

    const db = getDB();

    // Check active subscription
    const sub = db.prepare(`
      SELECT * FROM subscriptions
      WHERE customer_id = ? AND status = 'active' AND end_date >= ?
    `).get(customerId, targetDate);

    if (!sub) {
      return res.status(400).json({ error: 'NO_SUBSCRIPTION', message: 'Koi active subscription nahi hai.' });
    }

    // Check subscription covers this meal type
    if (sub.meal_type !== 'both' && sub.meal_type !== mealType) {
      return res.status(400).json({ error: 'MEAL_NOT_IN_PLAN', message: `Aapke plan mein ${mealType} nahi hai.` });
    }

    // Check if paused
    if (sub.pause_start && sub.pause_end && targetDate >= sub.pause_start && targetDate <= sub.pause_end) {
      return res.status(400).json({ error: 'SUBSCRIPTION_PAUSED', message: `Subscription ${sub.pause_start} se ${sub.pause_end} tak paused hai.` });
    }

    // Check if order already exists
    const existing = db.prepare(
      'SELECT id FROM orders WHERE customer_id = ? AND meal_type = ? AND delivery_date = ?'
    ).get(customerId, mealType, targetDate);

    if (existing) {
      return res.status(400).json({ error: 'ORDER_EXISTS', message: 'Is meal ka order pehle se hai.' });
    }

    const result = db.prepare(`
      INSERT INTO orders (subscription_id, customer_id, meal_type, delivery_date, status, special_note)
      VALUES (?, ?, ?, ?, 'confirmed', ?)
    `).run(sub.id, customerId, mealType, targetDate, specialNote || null);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, order });
  }
);

module.exports = router;
