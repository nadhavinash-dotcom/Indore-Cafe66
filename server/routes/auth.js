const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../config/database');
const { sendOtp, verifyOtp } = require('../services/otpService');
const { signToken } = require('../middleware/auth');
const { otpLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/auth/send-otp
router.post('/send-otp', otpLimiter,
  body('phone').isLength({ min: 10, max: 10 }).isNumeric(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'INVALID_PHONE', message: '10 digit phone number daalein' });

    const { phone } = req.body;
    const result = sendOtp(phone);
    if (!result.success) return res.status(429).json(result);

    return res.json({ success: true, message: 'OTP bheja gaya', ...(result.otp ? { otp: result.otp } : {}) });
  }
);

// POST /api/auth/verify-otp
router.post('/verify-otp',
  body('phone').isLength({ min: 10, max: 10 }).isNumeric(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Phone aur OTP sahi format mein daalein' });

    const { phone, otp } = req.body;
    const result = verifyOtp(phone, otp);
    if (!result.success) return res.status(400).json(result);

    const db = getDB();

    // Check if delivery partner
    const partner = db.prepare('SELECT * FROM delivery_partners WHERE phone = ? AND status = ?').get(phone, 'active');
    if (partner) {
      const token = signToken({ id: partner.id, phone, role: 'partner', name: partner.name });
      return res.json({ success: true, role: 'partner', token, user: { id: partner.id, name: partner.name, phone, isOnDuty: !!partner.is_on_duty } });
    }

    // Find or create customer
    let customer = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
    if (!customer) {
      const result2 = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run(`User ${phone.slice(-4)}`, phone);
      customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result2.lastInsertRowid);
    }

    const token = signToken({ id: customer.id, phone, role: 'customer', name: customer.name });
    return res.json({ success: true, role: 'customer', token, user: { id: customer.id, name: customer.name, phone, hasAddress: !!(customer.address_line1) } });
  }
);

// POST /api/admin/login
router.post('/admin/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email aur password required' });

    const { email, password } = req.body;
    const db = getDB();
    const admin = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);
    if (!admin) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Email ya password galat hai' });

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Email ya password galat hai' });

    const token = signToken({ id: admin.id, email, role: 'admin', name: admin.name });
    return res.json({ success: true, token, user: { id: admin.id, name: admin.name, email } });
  }
);

module.exports = router;
