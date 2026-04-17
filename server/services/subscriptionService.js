const { getDB } = require('../config/database');
const { getISTDateString, getTomorrowISTDateString } = require('./timeService');

function generateDailyOrders() {
  const db = getDB();
  const tomorrow = getTomorrowISTDateString();

  const activeSubscriptions = db.prepare(`
    SELECT s.id, s.customer_id, s.meal_type, s.pause_start, s.pause_end
    FROM subscriptions s
    WHERE s.status = 'active'
      AND s.end_date >= ?
  `).all(tomorrow);

  let created = 0;
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO orders (subscription_id, customer_id, meal_type, delivery_date, status)
    VALUES (@subscription_id, @customer_id, @meal_type, @delivery_date, 'pending')
  `);

  // Also create unique constraint check
  const checkStmt = db.prepare(`
    SELECT id FROM orders WHERE customer_id = ? AND meal_type = ? AND delivery_date = ?
  `);

  for (const sub of activeSubscriptions) {
    // Check if paused for tomorrow
    if (sub.pause_start && sub.pause_end) {
      if (tomorrow >= sub.pause_start && tomorrow <= sub.pause_end) continue;
    }

    const mealsToCreate = sub.meal_type === 'both' ? ['lunch', 'dinner'] : [sub.meal_type];

    for (const mealType of mealsToCreate) {
      const exists = checkStmt.get(sub.customer_id, mealType, tomorrow);
      if (!exists) {
        stmt.run({
          subscription_id: sub.id,
          customer_id: sub.customer_id,
          meal_type: mealType,
          delivery_date: tomorrow,
        });
        created++;
      }
    }
  }

  console.log(`[Cron] Generated ${created} orders for ${tomorrow}`);
  return created;
}

function checkSubscriptionExpiry() {
  const db = getDB();
  const today = getISTDateString();

  const result = db.prepare(`
    UPDATE subscriptions SET status = 'expired'
    WHERE status = 'active' AND end_date < ?
  `).run(today);

  console.log(`[Cron] Marked ${result.changes} subscriptions as expired`);
  return result.changes;
}

module.exports = { generateDailyOrders, checkSubscriptionExpiry };
