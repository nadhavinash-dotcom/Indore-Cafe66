const https = require('https');
const { getDB } = require('../config/database');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function isValidExpoPushToken(token) {
  return token && (
    token.startsWith('ExponentPushToken[') ||
    token.startsWith('ExpoPushToken[')
  );
}

async function sendPushNotification({ token, title, body, data = {} }) {
  if (!isValidExpoPushToken(token)) return { status: 'skipped', reason: 'invalid_token' };

  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'cafe-indoori',
  };

  return new Promise((resolve) => {
    const payload = JSON.stringify([message]);
    const options = {
      hostname: 'exp.host',
      path: '/--/api/v2/push/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Accept-Encoding': 'gzip, deflate',
        Accept: 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: 'sent', response: data }));
    });
    req.on('error', (err) => resolve({ status: 'error', error: err.message }));
    req.write(payload);
    req.end();
  });
}

async function notifyCustomer(customerId, { title, body, data = {} }) {
  const db = getDB();
  const customer = db.prepare('SELECT push_token FROM customers WHERE id = ?').get(customerId);
  if (!customer?.push_token) return;

  const result = await sendPushNotification({ token: customer.push_token, title, body, data });

  // Log notification
  try {
    db.prepare(`
      INSERT INTO notification_log (recipient_type, recipient_id, title, body, data, status)
      VALUES ('customer', ?, ?, ?, ?, ?)
    `).run(customerId, title, body, JSON.stringify(data), result.status);
  } catch (_) {}

  return result;
}

async function notifyPartner(partnerId, { title, body, data = {} }) {
  const db = getDB();
  const partner = db.prepare('SELECT push_token FROM delivery_partners WHERE id = ?').get(partnerId);
  if (!partner?.push_token) return;

  const result = await sendPushNotification({ token: partner.push_token, title, body, data });

  try {
    db.prepare(`
      INSERT INTO notification_log (recipient_type, recipient_id, title, body, data, status)
      VALUES ('partner', ?, ?, ?, ?, ?)
    `).run(partnerId, title, body, JSON.stringify(data), result.status);
  } catch (_) {}

  return result;
}

// Notification templates
const NOTIFICATIONS = {
  orderConfirmed: (customerName) => ({
    title: '✅ Order Confirmed!',
    body: `${customerName}, aapka tiffin confirm ho gaya. Delivery time pe hogi.`,
  }),
  orderPickedUp: (customerName) => ({
    title: '📦 Tiffin Utha Liya',
    body: `${customerName}, delivery partner ne aapka tiffin pick up kar liya.`,
  }),
  orderInTransit: (customerName) => ({
    title: '🛵 Tiffin Aa Raha Hai!',
    body: `${customerName}, aapka tiffin raaste mein hai. Thodi der mein pahunch jayega.`,
  }),
  orderDelivered: (customerName) => ({
    title: '🎉 Tiffin Deliver Ho Gaya!',
    body: `${customerName}, aapka tiffin deliver ho gaya. Khao aur maza karo!`,
  }),
  newOrderAssigned: (partnerName, area) => ({
    title: '🍱 Naya Order Mila',
    body: `${partnerName}, ${area} area mein naya delivery order assign hua hai.`,
  }),
  cutoffReminder: (mealType, minutesLeft) => ({
    title: `⏰ ${mealType === 'lunch' ? 'Lunch' : 'Dinner'} Booking Band Hone Wali Hai`,
    body: `Sirf ${minutesLeft} minute bache hain! Jaldi order karo.`,
  }),
};

async function onOrderStatusChange(order, newStatus) {
  try {
    const db = getDB();
    const customer = db.prepare('SELECT id, name, push_token FROM customers WHERE id = ?').get(order.customer_id);
    if (!customer) return;

    const notif = {
      confirmed: NOTIFICATIONS.orderConfirmed(customer.name),
      picked_up: NOTIFICATIONS.orderPickedUp(customer.name),
      in_transit: NOTIFICATIONS.orderInTransit(customer.name),
      delivered: NOTIFICATIONS.orderDelivered(customer.name),
    }[newStatus];

    if (notif) {
      await notifyCustomer(customer.id, { ...notif, data: { orderId: order.id, screen: 'OrderDetail' } });
    }

    // Notify partner for new assigned order
    if (newStatus === 'confirmed' && order.partner_id) {
      const partnerOrder = db.prepare(`
        SELECT o.*, c.area FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.id = ?
      `).get(order.id);
      if (partnerOrder) {
        await notifyPartner(order.partner_id, {
          ...NOTIFICATIONS.newOrderAssigned('Partner', partnerOrder.area),
          data: { orderId: order.id, screen: 'OrderDetail' },
        });
      }
    }
  } catch (err) {
    console.error('[Notifications] Error sending notification:', err.message);
  }
}

async function sendCutoffReminder(mealType) {
  try {
    const db = getDB();
    const { getISTDateString } = require('./timeService');
    const today = getISTDateString();

    // Get all active customers who haven't booked yet
    const customers = db.prepare(`
      SELECT DISTINCT c.id, c.name, c.push_token
      FROM subscriptions s
      JOIN customers c ON s.customer_id = c.id
      WHERE s.status = 'active'
        AND c.push_token IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM orders o
          WHERE o.customer_id = c.id
            AND o.meal_type = ?
            AND o.delivery_date = ?
            AND o.status != 'cancelled'
        )
    `).all(mealType, today);

    for (const customer of customers) {
      await notifyCustomer(customer.id, {
        ...NOTIFICATIONS.cutoffReminder(mealType, 30),
        data: { screen: 'BookMeal', mealType },
      });
    }

    console.log(`[Notifications] Sent cutoff reminders to ${customers.length} customers`);
  } catch (err) {
    console.error('[Notifications] Cutoff reminder error:', err.message);
  }
}

module.exports = {
  notifyCustomer,
  notifyPartner,
  onOrderStatusChange,
  sendCutoffReminder,
  NOTIFICATIONS,
};
