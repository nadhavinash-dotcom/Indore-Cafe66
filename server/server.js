// MUST be first line before any imports
process.env.TZ = 'Asia/Kolkata';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const { initCronJobs } = require('./cron/index');
const { connectDB } = require('./config/database');

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
const notificationsRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/booking', bookingRoutes);
app.post('/api/orders/book', (req, res, next) => {
  req.url = '/book';
  bookingRoutes(req, res, next);
});
app.use('/api/orders', ordersRoutes);
app.use('/api/admin/kitchen', kitchenRoutes);
app.use('/api/customer/subscription', subscriptionsRoutes);
app.use('/api/customer', customersRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/partner', partnersRoutes);
app.use('/api/admin/partners', partnersRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/payment', paymentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', notificationsRoutes);

app.get('/api/health', (req, res) => {
  const { getISTDateString, getISTTimeString } = require('./services/timeService');
  res.json({ status: 'ok', time: getISTTimeString(), date: getISTDateString(), tz: process.env.TZ });
});

app.use(errorHandler);

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Cafe Indoori API running on port ${PORT} (IST: ${new Date().toLocaleTimeString('en-IN')})`);
    initCronJobs();
  });
}

startServer().catch((error) => {
  console.error('[Server] Failed to start:', error.message);
  process.exit(1);
});

module.exports = app;
