const express = require('express');
const { getDB } = require('../config/database');
const { getISTDateString, isCutoffPassed } = require('../services/timeService');
const { generateKitchenListForDate, getKitchenList, getTodayKitchenSummary } = require('../services/kitchenService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/kitchen/today
router.get('/today', verifyToken('admin'), (req, res) => {
  const today = getISTDateString();
  const summary = getTodayKitchenSummary();

  res.json({
    date: today,
    lunchCutoffPassed: isCutoffPassed('lunch'),
    dinnerCutoffPassed: isCutoffPassed('dinner'),
    lunch: summary.lunch,
    dinner: summary.dinner,
  });
});

// GET /api/admin/kitchen/:date/:meal
router.get('/:date/:meal', verifyToken('admin'), (req, res) => {
  const { date, meal } = req.params;
  if (!['lunch', 'dinner'].includes(meal)) return res.status(400).json({ error: 'INVALID_MEAL' });

  const list = getKitchenList(date, meal);
  if (!list) return res.json({ exists: false, date, meal });

  res.json({ exists: true, ...list });
});

// POST /api/admin/kitchen/refresh
router.post('/refresh', verifyToken('admin'), (req, res) => {
  const { date, meal } = req.body;
  const targetDate = date || getISTDateString();
  const meals = meal ? [meal] : ['lunch', 'dinner'];

  const results = {};
  for (const m of meals) {
    results[m] = generateKitchenListForDate(targetDate, m, true);
  }

  res.json({ success: true, date: targetDate, results });
});

module.exports = router;
