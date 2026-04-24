const https = require('https');
const { Customer, DeliveryPartner, NotificationLog, Order, Subscription } = require('../models');

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
  const customer = await Customer.findById(customerId).select('push_token');
  if (!customer?.push_token) return null;

  const result = await sendPushNotification({ token: customer.push_token, title, body, data });

  try {
    await NotificationLog.create({
      recipient_type: 'customer',
      recipient_id: customerId,
      title,
      body,
      data,
      status: result.status,
    });
  } catch (_) {}

  return result;
}

async function notifyPartner(partnerId, { title, body, data = {} }) {
  const partner = await DeliveryPartner.findById(partnerId).select('push_token');
  if (!partner?.push_token) return null;

  const result = await sendPushNotification({ token: partner.push_token, title, body, data });

  try {
    await NotificationLog.create({
      recipient_type: 'partner',
      recipient_id: partnerId,
      title,
      body,
      data,
      status: result.status,
    });
  } catch (_) {}

  return result;
}

const NOTIFICATIONS = {
  orderConfirmed: (customerName) => ({
    title: 'Order Confirmed',
    body: `${customerName}, aapka tiffin confirm ho gaya. Delivery time pe hogi.`,
  }),
  orderPickedUp: (customerName) => ({
    title: 'Tiffin Utha Liya',
    body: `${customerName}, delivery partner ne aapka tiffin pick up kar liya.`,
  }),
  orderInTransit: (customerName) => ({
    title: 'Tiffin Aa Raha Hai',
    body: `${customerName}, aapka tiffin raaste mein hai. Thodi der mein pahunch jayega.`,
  }),
  orderDelivered: (customerName) => ({
    title: 'Tiffin Deliver Ho Gaya',
    body: `${customerName}, aapka tiffin deliver ho gaya. Khao aur maza karo!`,
  }),
  newOrderAssigned: (partnerName, area) => ({
    title: 'Naya Order Mila',
    body: `${partnerName}, ${area} area mein naya delivery order assign hua hai.`,
  }),
  cutoffReminder: (mealType, minutesLeft) => ({
    title: `${mealType === 'lunch' ? 'Lunch' : 'Dinner'} Booking Band Hone Wali Hai`,
    body: `Sirf ${minutesLeft} minute bache hain! Jaldi order karo.`,
  }),
};

async function onOrderStatusChange(order, newStatus) {
  try {
    const customer = await Customer.findById(order.customer_id).select('name');
    if (!customer) return;

    const notif = {
      confirmed: NOTIFICATIONS.orderConfirmed(customer.name),
      picked_up: NOTIFICATIONS.orderPickedUp(customer.name),
      in_transit: NOTIFICATIONS.orderInTransit(customer.name),
      delivered: NOTIFICATIONS.orderDelivered(customer.name),
    }[newStatus];

    if (notif) {
      await notifyCustomer(customer.id, { ...notif, data: { orderId: String(order._id || order.id), screen: 'OrderDetail' } });
    }

    if (newStatus === 'confirmed' && order.partner_id) {
      const partnerOrder = await Order.findById(order._id || order.id).populate('customer_id', 'area');
      if (partnerOrder) {
        await notifyPartner(order.partner_id, {
          ...NOTIFICATIONS.newOrderAssigned('Partner', partnerOrder.customer_id?.area || 'Other'),
          data: { orderId: String(order._id || order.id), screen: 'OrderDetail' },
        });
      }
    }
  } catch (err) {
    console.error('[Notifications] Error sending notification:', err.message);
  }
}

async function sendCutoffReminder(mealType) {
  try {
    const { getISTDateString } = require('./timeService');
    const today = getISTDateString();

    const subscriptions = await Subscription.find({ status: 'active' }).populate('customer_id', 'id name push_token');
    const customers = [];

    for (const subscription of subscriptions) {
      if (!subscription.customer_id?.push_token) continue;

      const hasOrder = await Order.exists({
        customer_id: subscription.customer_id._id,
        meal_type: mealType,
        delivery_date: today,
        status: { $ne: 'cancelled' },
      });

      if (!hasOrder) customers.push(subscription.customer_id);
    }

    const uniqueCustomers = [...new Map(customers.map((customer) => [customer.id, customer])).values()];

    for (const customer of uniqueCustomers) {
      await notifyCustomer(customer.id, {
        ...NOTIFICATIONS.cutoffReminder(mealType, 30),
        data: { screen: 'BookMeal', mealType },
      });
    }

    console.log(`[Notifications] Sent cutoff reminders to ${uniqueCustomers.length} customers`);
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
  EXPO_PUSH_URL,
};
