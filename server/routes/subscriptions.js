const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/database');
const { getISTDateString, addDays } = require('../services/timeService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/customer/subscription
router.get('/', verifyToken('customer'), (req, res) => {
  const db = getDB();
  const today = getISTDateString();
  const sub = db.prepare(`
    SELECT * FROM subscriptions
    WHERE customer_id = ? AND status IN ('active', 'paused')
    ORDER BY created_at DESC LIMIT 1
  `).get(req.user.id);
  res.json({ subscription: sub || null });
});

// POST /api/customer/subscription/pause
router.post('/pause', verifyToken('customer'),
  body('startDate').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('endDate').matches(/^\d{4}-\d{2}-\d{2}$/),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR' });

    const db = getDB();
    const today = getISTDateString();
    const sub = db.prepare(`
      SELECT * FROM subscriptions WHERE customer_id = ? AND status = 'active'
    `).get(req.user.id);
    if (!sub) return res.status(400).json({ error: 'NO_ACTIVE_SUB', message: 'Koi active subscription nahi hai.' });

    const { startDate, endDate } = req.body;
    db.prepare(`
      UPDATE subscriptions SET status = 'paused', pause_start = ?, pause_end = ? WHERE id = ?
    `).run(startDate, endDate, sub.id);
    res.json({ success: true, message: `Subscription ${startDate} se ${endDate} tak pause ho jayegi.` });
  }
);

// POST /api/customer/subscription/cancel
router.post('/cancel', verifyToken('customer'), (req, res) => {
  const db = getDB();
  const sub = db.prepare(`
    SELECT * FROM subscriptions WHERE customer_id = ? AND status IN ('active', 'paused')
  `).get(req.user.id);
  if (!sub) return res.status(400).json({ error: 'NO_SUB' });
  db.prepare(`UPDATE subscriptions SET status = 'cancelled' WHERE id = ?`).run(sub.id);
  res.json({ success: true, message: 'Subscription cancel ho gayi.' });
});

// Admin: GET all subscriptions
router.get('/all', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const { status, plan_type, page = 1, limit = 50 } = req.query;
  let sql = `
    SELECT s.*, c.name as customer_name, c.phone, c.area
    FROM subscriptions s JOIN customers c ON s.customer_id = c.id WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND s.status = ?'; params.push(status); }
  if (plan_type) { sql += ' AND s.plan_type = ?'; params.push(plan_type); }
  sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  const subs = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM subscriptions').get().c;
  res.json({ subscriptions: subs, total });
});

module.exports = router;
