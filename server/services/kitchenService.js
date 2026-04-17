const { getDB } = require('../config/database');
const { getISTDateString, getISTTimeString } = require('./timeService');

function generateKitchenListForDate(dateStr, mealType, isManual = false) {
  const db = getDB();

  const orders = db.prepare(`
    SELECT
      o.id as order_id,
      o.status,
      o.special_note,
      o.partner_id,
      c.name as customer_name,
      c.phone,
      c.address_line1,
      c.address_line2,
      c.area,
      c.landmark,
      c.pincode,
      c.meal_preference,
      c.special_instructions,
      dp.name as partner_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    LEFT JOIN delivery_partners dp ON o.partner_id = dp.id
    WHERE o.delivery_date = ?
      AND o.meal_type = ?
      AND o.status != 'cancelled'
    ORDER BY c.area, c.name
  `).all(dateStr, mealType);

  const summary = { veg: 0, nonveg: 0, jain: 0, special: 0, total: orders.length };
  const byArea = {};
  const orderList = [];

  orders.forEach((order, idx) => {
    const pref = order.meal_preference || 'veg';
    if (pref === 'veg') summary.veg++;
    else if (pref === 'nonveg') summary.nonveg++;
    else if (pref === 'jain') summary.jain++;
    else summary.special++;

    const area = order.area || 'Other';
    if (!byArea[area]) byArea[area] = { veg: 0, nonveg: 0, jain: 0, special: 0, total: 0 };
    byArea[area][pref === 'nonveg' ? 'nonveg' : pref === 'jain' ? 'jain' : pref === 'special' ? 'special' : 'veg']++;
    byArea[area].total++;

    orderList.push({
      sr: idx + 1,
      orderId: order.order_id,
      customerName: order.customer_name,
      phone: order.phone,
      address: [order.address_line1, order.address_line2, order.landmark].filter(Boolean).join(', '),
      area,
      pincode: order.pincode,
      mealPreference: pref,
      notes: order.special_note || order.special_instructions || '',
      partnerName: order.partner_name || '',
      partnerId: order.partner_id,
      status: order.status,
    });
  });

  const mealData = JSON.stringify({ summary, byArea, orders: orderList });

  db.prepare(`
    INSERT INTO kitchen_prep_lists
      (prep_date, meal_type, total_count, veg_count, nonveg_count, jain_count, special_count, meal_data, generated_at, is_manual_refresh)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    ON CONFLICT(prep_date, meal_type) DO UPDATE SET
      total_count = excluded.total_count,
      veg_count = excluded.veg_count,
      nonveg_count = excluded.nonveg_count,
      jain_count = excluded.jain_count,
      special_count = excluded.special_count,
      meal_data = excluded.meal_data,
      generated_at = excluded.generated_at,
      is_manual_refresh = excluded.is_manual_refresh
  `).run(dateStr, mealType, summary.total, summary.veg, summary.nonveg, summary.jain, summary.special, mealData, isManual ? 1 : 0);

  console.log(`[Kitchen] Generated ${mealType} list for ${dateStr}: ${summary.total} tiffins`);
  return { summary, byArea, orders: orderList, generatedAt: getISTTimeString() };
}

function getKitchenList(dateStr, mealType) {
  const db = getDB();
  const row = db.prepare(
    'SELECT * FROM kitchen_prep_lists WHERE prep_date = ? AND meal_type = ?'
  ).get(dateStr, mealType);

  if (!row) return null;

  return {
    ...row,
    meal_data: JSON.parse(row.meal_data || '{}'),
  };
}

function getTodayKitchenSummary() {
  const today = getISTDateString();
  const lunch = getKitchenList(today, 'lunch');
  const dinner = getKitchenList(today, 'dinner');
  return { lunch, dinner, date: today };
}

module.exports = { generateKitchenListForDate, getKitchenList, getTodayKitchenSummary };
