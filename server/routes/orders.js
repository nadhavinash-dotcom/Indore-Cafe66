const express = require('express');
const { getDB } = require('../config/database');
const { getISTDateString } = require('../services/timeService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/orders/today
router.get('/today', verifyToken('customer'), (req, res) => {
  const db = getDB();
  const today = getISTDateString();
  const orders = db.prepare(`
    SELECT o.*, dp.name as partner_name, dp.phone as partner_phone
    FROM orders o
    LEFT JOIN delivery_partners dp ON o.partner_id = dp.id
    WHERE o.customer_id = ? AND o.delivery_date = ?
    ORDER BY o.meal_type
  `).all(req.user.id, today);
  res.json({ orders, date: today });
});

// GET /api/orders/history
router.get('/history', verifyToken('customer'), (req, res) => {
  const db = getDB();
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const orders = db.prepare(`
    SELECT o.*, dp.name as partner_name
    FROM orders o
    LEFT JOIN delivery_partners dp ON o.partner_id = dp.id
    WHERE o.customer_id = ?
    ORDER BY o.delivery_date DESC, o.meal_type
    LIMIT ? OFFSET ?
  `).all(req.user.id, Number(limit), Number(offset));
  const total = db.prepare('SELECT COUNT(*) as c FROM orders WHERE customer_id = ?').get(req.user.id).c;
  res.json({ orders, total, page: Number(page) });
});

// GET /api/orders/:id
router.get('/:id', verifyToken('customer'), (req, res) => {
  const db = getDB();
  const order = db.prepare(`
    SELECT o.*, dp.name as partner_name, dp.phone as partner_phone
    FROM orders o
    LEFT JOIN delivery_partners dp ON o.partner_id = dp.id
    WHERE o.id = ? AND o.customer_id = ?
  `).get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ order });
});

// Admin: GET /api/admin/orders
router.get('/', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const { date, status, partnerId, area, page = 1, limit = 50 } = req.query;
  let sql = `
    SELECT o.*, c.name as customer_name, c.phone, c.area, c.address_line1, c.meal_preference,
           dp.name as partner_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    LEFT JOIN delivery_partners dp ON o.partner_id = dp.id
    WHERE 1=1
  `;
  const params = [];
  if (date) { sql += ' AND o.delivery_date = ?'; params.push(date); }
  if (status) { sql += ' AND o.status = ?'; params.push(status); }
  if (partnerId) { sql += ' AND o.partner_id = ?'; params.push(partnerId); }
  if (area) { sql += ' AND c.area = ?'; params.push(area); }
  sql += ' ORDER BY o.delivery_date DESC, o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const orders = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  res.json({ orders, total });
});

// Admin: PUT /api/admin/orders/:id/status
router.put('/:id/status', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const { status, partnerId } = req.body;
  const validStatuses = ['pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'INVALID_STATUS' });

  const timestampField = {
    confirmed: 'status_confirmed_at',
    picked_up: 'status_picked_up_at',
    in_transit: 'status_in_transit_at',
    delivered: 'status_delivered_at',
  }[status];

  let sql = `UPDATE orders SET status = ?`;
  const params = [status];
  if (timestampField) { sql += `, ${timestampField} = datetime('now')`; }
  if (partnerId) { sql += `, partner_id = ?`; params.push(partnerId); }
  sql += ` WHERE id = ?`;
  params.push(req.params.id);

  db.prepare(sql).run(...params);
  res.json({ success: true });
});

// Admin: PUT /api/admin/orders/:id/reassign
router.put('/:id/reassign', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const { partnerId } = req.body;
  db.prepare('UPDATE orders SET partner_id = ? WHERE id = ?').run(partnerId, req.params.id);
  res.json({ success: true });
});

module.exports = router;
