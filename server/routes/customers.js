const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/customer/profile
router.get('/profile', verifyToken('customer'), (req, res) => {
  const db = getDB();
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.user.id);
  if (!customer) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json({ customer });
});

// PUT /api/customer/profile
router.put('/profile', verifyToken('customer'),
  body('name').optional().notEmpty(),
  body('area').optional(),
  (req, res) => {
    const db = getDB();
    const fields = ['name', 'address_line1', 'address_line2', 'area', 'landmark', 'pincode', 'meal_preference', 'special_instructions'];
    const updates = [];
    const values = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    }
    if (!updates.length) return res.status(400).json({ error: 'NO_FIELDS' });
    values.push(req.user.id);
    db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.user.id);
    res.json({ success: true, customer });
  }
);

// Admin: GET /api/admin/customers
router.get('/', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const { search, area, plan_type, page = 1, limit = 50 } = req.query;
  let sql = `
    SELECT c.*,
      (SELECT s.status FROM subscriptions s WHERE s.customer_id = c.id ORDER BY s.created_at DESC LIMIT 1) as sub_status,
      (SELECT s.plan_type FROM subscriptions s WHERE s.customer_id = c.id ORDER BY s.created_at DESC LIMIT 1) as plan_type,
      (SELECT s.end_date FROM subscriptions s WHERE s.customer_id = c.id ORDER BY s.created_at DESC LIMIT 1) as sub_end_date
    FROM customers c WHERE 1=1
  `;
  const params = [];
  if (search) { sql += ` AND (c.name LIKE ? OR c.phone LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  if (area) { sql += ` AND c.area = ?`; params.push(area); }
  sql += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const customers = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
  res.json({ customers, total });
});

// Admin: GET /api/admin/customers/:id
router.get('/:id', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'NOT_FOUND' });
  const subscriptions = db.prepare('SELECT * FROM subscriptions WHERE customer_id = ? ORDER BY created_at DESC').all(req.params.id);
  const orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY delivery_date DESC LIMIT 30').all(req.params.id);
  const tickets = db.prepare('SELECT * FROM support_tickets WHERE customer_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ customer, subscriptions, orders, tickets });
});

module.exports = router;
