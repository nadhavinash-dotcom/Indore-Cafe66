// MUST be first line before any imports
process.env.TZ = 'Asia/Kolkata';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const { initCronJobs } = require('./cron/index');

// Routes
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');
const ordersRoutes = require('./routes/orders');
const kitchenRoutes = require('./routes/kitchen');
const customersRoutes = require('./routes/customers');
const subscriptionsRoutes = require('./routes/subscriptions');
const partnersRoutes = require('./routes/partners');
const supportRoutes = require('./routes/support');
const paymentsRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());

// Auth
app.use('/api/auth', authRoutes);

// Booking availability + book
app.use('/api/booking', bookingRoutes);
// Also handle /api/orders/book via booking router
app.post('/api/orders/book', (req, res, next) => {
  req.url = '/book';
  bookingRoutes(req, res, next);
});

// Orders (admin + customer)
app.use('/api/orders', ordersRoutes);

// Kitchen (admin)
app.use('/api/admin/kitchen', kitchenRoutes);

// Customer profile
app.use('/api/customer/subscription', subscriptionsRoutes);
app.use('/api/customer', customersRoutes);

// Subscriptions (admin)
app.use('/api/subscriptions', subscriptionsRoutes);

// Partners (partner portal + admin)
app.use('/api/partner', partnersRoutes);
app.use('/api/admin/partners', partnersRoutes);

// Support
app.use('/api/support', supportRoutes);

// Payments
app.use('/api/payment', paymentsRoutes);

// Admin (stats, revenue, settings)
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const { getISTDateString, getISTTimeString } = require('./services/timeService');
  res.json({ status: 'ok', time: getISTTimeString(), date: getISTDateString(), tz: process.env.TZ });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Cafe Indoori API running on port ${PORT} (IST: ${new Date().toLocaleTimeString('en-IN')})`);
  initCronJobs();
});

module.exports = app;
