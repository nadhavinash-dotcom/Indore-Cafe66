const express = require('express');
const { getDB } = require('../config/database');
const { getISTDateString } = require('../services/timeService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/dashboard/stats
router.get('/dashboard/stats', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const today = getISTDateString();

  const activeSubscribers = db.prepare(`SELECT COUNT(*) as c FROM subscriptions WHERE status = 'active' AND plan_type = 'monthly'`).get().c;
  const trialSubscribers = db.prepare(`SELECT COUNT(*) as c FROM subscriptions WHERE status = 'active' AND plan_type = 'trial'`).get().c;
  const todayOrders = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE delivery_date = ? AND status != 'cancelled'`).get(today).c;
  const todayDelivered = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE delivery_date = ? AND status = 'delivered'`).get(today).c;
  const revenueToday = db.prepare(`SELECT COALESCE(SUM(amount_paid), 0) as r FROM subscriptions WHERE DATE(created_at) = ?`).get(today).r;
  const revenueMonth = db.prepare(`SELECT COALESCE(SUM(amount_paid), 0) as r FROM subscriptions WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`).get().r;
  const openTickets = db.prepare(`SELECT COUNT(*) as c FROM support_tickets WHERE status = 'open'`).get().c;
  const partnersOnDuty = db.prepare(`SELECT COUNT(*) as c FROM delivery_partners WHERE is_on_duty = 1`).get().c;

  res.json({
    activeSubscribers, trialSubscribers, todayOrders, todayDelivered,
    revenueToday, revenueMonth, openTickets, partnersOnDuty,
  });
});

// GET /api/admin/revenue/summary
router.get('/revenue/summary', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const { period = 'week' } = req.query;

  let sql;
  if (period === 'day') {
    sql = `SELECT DATE(created_at) as date, SUM(amount_paid) as revenue, COUNT(*) as count
           FROM subscriptions WHERE DATE(created_at) >= DATE('now', '-30 days')
           GROUP BY DATE(created_at) ORDER BY date`;
  } else if (period === 'week') {
    sql = `SELECT strftime('%Y-%W', created_at) as week, SUM(amount_paid) as revenue, COUNT(*) as count
           FROM subscriptions WHERE DATE(created_at) >= DATE('now', '-90 days')
           GROUP BY week ORDER BY week`;
  } else {
    sql = `SELECT strftime('%Y-%m', created_at) as month, SUM(amount_paid) as revenue, COUNT(*) as count
           FROM subscriptions GROUP BY month ORDER BY month`;
  }

  const data = db.prepare(sql).all();
  const transactions = db.prepare(`
    SELECT s.*, c.name as customer_name, c.phone FROM subscriptions s
    JOIN customers c ON s.customer_id = c.id
    ORDER BY s.created_at DESC LIMIT 100
  `).all();

  res.json({ data, transactions });
});

// GET /api/admin/settings
router.get('/settings', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const settings = db.prepare('SELECT * FROM settings').all();
  const obj = {};
  settings.forEach(s => { obj[s.key] = s.value; });
  res.json({ settings: obj });
});

// PUT /api/admin/settings
router.put('/settings', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const stmt = db.prepare(`UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?`);
  for (const [key, value] of Object.entries(req.body)) {
    stmt.run(String(value), key);
  }
  res.json({ success: true });
});

module.exports = router;
