const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/support/tickets
router.post('/tickets', verifyToken('customer'),
  body('subject').notEmpty().isLength({ max: 200 }),
  body('category').isIn(['delivery_issue', 'meal_quality', 'payment', 'subscription', 'other']),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR' });

    const db = getDB();
    const { subject, category, description, orderId } = req.body;
    const result = db.prepare(`
      INSERT INTO support_tickets (customer_id, order_id, category, subject, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, orderId || null, category, subject, description || '');

    db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, content)
      VALUES (?, 'customer', ?, ?)
    `).run(result.lastInsertRowid, req.user.name || 'Customer', description || subject);

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, ticket });
  }
);

// GET /api/support/tickets (customer's own)
router.get('/tickets', verifyToken('customer'), (req, res) => {
  const db = getDB();
  const tickets = db.prepare(
    'SELECT * FROM support_tickets WHERE customer_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json({ tickets });
});

// GET /api/support/tickets/:id
router.get('/tickets/:id', verifyToken('customer'), (req, res) => {
  const db = getDB();
  const ticket = db.prepare(
    'SELECT * FROM support_tickets WHERE id = ? AND customer_id = ?'
  ).get(req.params.id, req.user.id);
  if (!ticket) return res.status(404).json({ error: 'NOT_FOUND' });
  const messages = db.prepare(
    'SELECT * FROM ticket_messages WHERE ticket_id = ? AND is_internal = 0 ORDER BY created_at ASC'
  ).all(req.params.id);
  res.json({ ticket, messages });
});

// POST /api/support/tickets/:id/messages
router.post('/tickets/:id/messages', verifyToken('customer'),
  body('content').notEmpty(),
  (req, res) => {
    const db = getDB();
    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ? AND customer_id = ?').get(req.params.id, req.user.id);
    if (!ticket) return res.status(404).json({ error: 'NOT_FOUND' });

    db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, content)
      VALUES (?, 'customer', ?, ?)
    `).run(req.params.id, req.user.name || 'Customer', req.body.content);

    db.prepare(`UPDATE support_tickets SET updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  }
);

// Admin: GET all tickets
router.get('/admin/tickets', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const { status, priority, page = 1, limit = 50 } = req.query;
  let sql = `
    SELECT t.*, c.name as customer_name, c.phone
    FROM support_tickets t JOIN customers c ON t.customer_id = c.id WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND t.status = ?'; params.push(status); }
  if (priority) { sql += ' AND t.priority = ?'; params.push(priority); }
  sql += ' ORDER BY t.priority DESC, t.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));
  const tickets = db.prepare(sql).all(...params);
  const total = db.prepare('SELECT COUNT(*) as c FROM support_tickets').get().c;
  res.json({ tickets, total });
});

// Admin: GET ticket detail
router.get('/admin/tickets/:id', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const ticket = db.prepare(`
    SELECT t.*, c.name as customer_name, c.phone
    FROM support_tickets t JOIN customers c ON t.customer_id = c.id WHERE t.id = ?
  `).get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'NOT_FOUND' });
  const messages = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json({ ticket, messages });
});

// Admin: PUT ticket status
router.put('/admin/tickets/:id/status', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const { status } = req.body;
  db.prepare(`UPDATE support_tickets SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, req.params.id);
  res.json({ success: true });
});

// Admin: POST reply to ticket
router.post('/admin/tickets/:id/reply', verifyToken('admin'), (req, res) => {
  const db = getDB();
  const { content, isInternal } = req.body;
  db.prepare(`
    INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, content, is_internal)
    VALUES (?, 'agent', ?, ?, ?)
  `).run(req.params.id, req.user.name || 'Admin', content, isInternal ? 1 : 0);
  db.prepare(`UPDATE support_tickets SET updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
