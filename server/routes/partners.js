const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/database');
const { getISTDateString } = require('../services/timeService');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/partner/orders/today
router.get('/orders/today', verifyToken('partner'), (req, res) => {
  const db = getDB();
  const today = getISTDateString();
  const orders = db.prepare(`
    SELECT o.*, c.name as customer_name, c.phone, c.address_line1, c.address_line2,
           c.area, c.landmark, c.pincode, c.meal_preference, c.special_instructions
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE o.partner_id = ? AND o.delivery_date = ? AND o.status != 'cancelled'
    ORDER BY c.area, c.name
  `).all(req.user.id, today);
  res.json({ orders, date: today });
});

// PUT /api/partner/orders/:id/status
router.put('/orders/:id/status', verifyToken('partner'), (req, res) => {
  const db = getDB();
  const { status } = req.body;
  const validTransitions = { confirmed: 'picked_up', picked_up: 'in_transit', in_transit: 'delivered' };

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND partner_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'NOT_FOUND' });

  const nextStatus = validTransitions[order.status];
  if (!nextStatus || nextStatus !== status) {
    return res.status(400).json({ error: 'INVALID_TRANSITION', message: `Cannot move from ${order.status} to ${status}` });
  }

  const tsField = { picked_up: 'status_picked_up_at', in_transit: 'status_in_transit_at', delivered: 'status_delivered_at' }[status];
  db.prepare(`UPDATE orders SET status = ?, ${tsField} = datetime('now') WHERE id = ?`).run(status, req.params.id);

  res.json({ success: true, status });
});

// PUT /api/partner/duty
router.put('/duty', verifyToken('partner'), (req, res) => {
  const db = getDB();
  const { isOnDuty } = req.body;
  db.prepare('UPDATE delivery_partners SET is_on_duty = ? WHERE id = ?').run(isOnDuty ? 1 : 0, req.user.id);
  res.json({ success: true, isOnDuty: !!isOnDuty });
});

// GET /api/partner/profile
router.get('/profile', verifyToken('partner'), (req, res) => {
  const db = getDB();
  const partner = db.prepare('SELECT * FROM delivery_partners WHERE id = ?').get(req.user.id);
  res.json({ partner });
});

// Admin: GET /api/admin/partners
router.get('/', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const today = getISTDateString();
  const partners = db.prepare(`
    SELECT dp.*,
      (SELECT COUNT(*) FROM orders o WHERE o.partner_id = dp.id AND o.delivery_date = ? AND o.status != 'cancelled') as today_total,
      (SELECT COUNT(*) FROM orders o WHERE o.partner_id = dp.id AND o.delivery_date = ? AND o.status = 'delivered') as today_delivered
    FROM delivery_partners dp ORDER BY dp.name
  `).all(today, today);
  res.json({ partners });
});

// Admin: POST /api/admin/partners
router.post('/', verifyToken('admin'),
  body('name').notEmpty(),
  body('phone').isLength({ min: 10, max: 10 }).isNumeric(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR' });

    const db = getDB();
    const { name, phone, vehicleType, areas } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO delivery_partners (name, phone, vehicle_type, area_coverage)
        VALUES (?, ?, ?, ?)
      `).run(name, phone, vehicleType || 'bike', JSON.stringify(areas || []));
      const partner = db.prepare('SELECT * FROM delivery_partners WHERE id = ?').get(result.lastInsertRowid);
      res.json({ success: true, partner });
    } catch (e) {
      if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'PHONE_EXISTS', message: 'Phone number already registered' });
      throw e;
    }
  }
);

// Admin: PUT /api/admin/partners/:id
router.put('/:id', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const { status, isOnDuty, vehicleType, areas } = req.body;
  const updates = [];
  const values = [];
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (isOnDuty !== undefined) { updates.push('is_on_duty = ?'); values.push(isOnDuty ? 1 : 0); }
  if (vehicleType) { updates.push('vehicle_type = ?'); values.push(vehicleType); }
  if (areas) { updates.push('area_coverage = ?'); values.push(JSON.stringify(areas)); }
  if (!updates.length) return res.status(400).json({ error: 'NO_FIELDS' });
  values.push(req.params.id);
  db.prepare(`UPDATE delivery_partners SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json({ success: true });
});

module.exports = router;
