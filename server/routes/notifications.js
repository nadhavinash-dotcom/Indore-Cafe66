const express = require('express');
const { getDB } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// PUT /api/customer/push-token
router.put('/customer/push-token', verifyToken('customer'), (req, res) => {
  const db = getDB();
  const { pushToken } = req.body;
  if (!pushToken) return res.status(400).json({ error: 'Push token required' });
  db.prepare('UPDATE customers SET push_token = ? WHERE id = ?').run(pushToken, req.user.id);
  res.json({ success: true });
});

// PUT /api/partner/push-token
router.put('/partner/push-token', verifyToken('partner'), (req, res) => {
  const db = getDB();
  const { pushToken } = req.body;
  if (!pushToken) return res.status(400).json({ error: 'Push token required' });
  db.prepare('UPDATE delivery_partners SET push_token = ? WHERE id = ?').run(pushToken, req.user.id);
  res.json({ success: true });
});

// GET /api/admin/notifications (notification log)
router.get('/admin/notifications', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const logs = db.prepare(`
    SELECT * FROM notification_log ORDER BY created_at DESC LIMIT 100
  `).all();
  res.json({ logs });
});

module.exports = router;
