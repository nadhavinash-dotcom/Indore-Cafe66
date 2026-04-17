process.env.TZ = 'Asia/Kolkata';
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { getDB } = require('../config/database');
const { getISTDateString, addDays } = require('../services/timeService');

const db = getDB();
const today = getISTDateString();

function seed() {
  // Run migrations first
  require('./migrate');

  seedAdmin();
  seedPartners();
  seedCustomers();
  seedSubscriptions();
  seedOrders();
  seedKitchenLists();
  seedSupportTickets();

  console.log('\nSeed complete!');
}

function seedAdmin() {
  const existing = db.prepare('SELECT id FROM admin_users WHERE email = ?').get('admin@cafeindoori.com');
  if (existing) return console.log('Admin already exists, skipping.');
  const hash = bcrypt.hashSync('Admin@123', 10);
  db.prepare('INSERT OR IGNORE INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)').run(
    'admin@cafeindoori.com', hash, 'Cafe Admin'
  );
  console.log('✓ Admin seeded');
}

function seedPartners() {
  const partners = [
    { name: 'Rahul Verma', phone: '9800000001', vehicle_type: 'bike', area_coverage: JSON.stringify(['Vijay Nagar', 'Scheme 54']), is_on_duty: 1 },
    { name: 'Suresh Kumar', phone: '9800000002', vehicle_type: 'bike', area_coverage: JSON.stringify(['Palasia', 'AB Road']), is_on_duty: 1 },
    { name: 'Amit Singh', phone: '9800000003', vehicle_type: 'bike', area_coverage: JSON.stringify(['Bengali Square', 'Nipania']), is_on_duty: 0 },
    { name: 'Deepak Patel', phone: '9800000004', vehicle_type: 'cycle', area_coverage: JSON.stringify(['Rau', 'Other']), is_on_duty: 1 },
    { name: 'Vikram Sharma', phone: '9800000005', vehicle_type: 'bike', area_coverage: JSON.stringify(['Vijay Nagar', 'Palasia']), is_on_duty: 0 },
  ];
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO delivery_partners (name, phone, vehicle_type, area_coverage, is_on_duty)
    VALUES (@name, @phone, @vehicle_type, @area_coverage, @is_on_duty)
  `);
  partners.forEach(p => stmt.run(p));
  console.log('✓ Partners seeded');
}

function seedCustomers() {
  const areas = ['Vijay Nagar', 'Palasia', 'Scheme 54', 'AB Road', 'Bengali Square', 'Rau', 'Nipania', 'Other'];
  const prefs = ['veg', 'veg', 'veg', 'nonveg', 'nonveg', 'jain'];
  const names = [
    'Priya Sharma', 'Rahul Gupta', 'Anita Patel', 'Vikash Jain', 'Sunita Verma',
    'Manoj Tiwari', 'Kavita Soni', 'Amit Dubey', 'Ritu Agarwal', 'Sanjay Yadav',
    'Neha Malviya', 'Rohit Chouhan', 'Pooja Saxena', 'Deepak Bhatt', 'Meena Rawat',
    'Aakash Trivedi', 'Shweta Pandey', 'Vishal Nair', 'Anjali Mishra', 'Kiran Joshi',
    'Sachin Rathore', 'Divya Chauhan', 'Nikhil Parmar', 'Rekha Dixit', 'Tarun Lodhi',
    'Suman Kaur', 'Harish Srivastava', 'Pallavi Mehta', 'Gaurav Thakur', 'Lata Pathak'
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO customers (name, phone, address_line1, area, pincode, meal_preference)
    VALUES (@name, @phone, @address_line1, @area, @pincode, @meal_preference)
  `);

  names.forEach((name, i) => {
    const phone = `98001${String(i + 1).padStart(5, '0')}`;
    stmt.run({
      name,
      phone,
      address_line1: `${i + 1} Main Street`,
      area: areas[i % areas.length],
      pincode: '452001',
      meal_preference: prefs[i % prefs.length],
    });
  });
  console.log('✓ Customers seeded');
}

function seedSubscriptions() {
  const customers = db.prepare('SELECT id FROM customers ORDER BY id').all();
  if (!customers.length) return;

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO subscriptions
    (customer_id, plan_type, meal_type, start_date, end_date, status, amount_paid, payment_id)
    VALUES (@customer_id, @plan_type, @meal_type, @start_date, @end_date, @status, @amount_paid, @payment_id)
  `);

  const mealTypes = ['both', 'lunch', 'dinner'];

  // 15 active monthly
  for (let i = 0; i < 15; i++) {
    stmt.run({
      customer_id: customers[i].id,
      plan_type: 'monthly',
      meal_type: mealTypes[i % 3],
      start_date: addDays(today, -10),
      end_date: addDays(today, 20),
      status: 'active',
      amount_paid: 4800,
      payment_id: `pay_mock_${i + 1}`,
    });
  }

  // 5 active trial
  for (let i = 15; i < 20; i++) {
    stmt.run({
      customer_id: customers[i].id,
      plan_type: 'trial',
      meal_type: 'both',
      start_date: addDays(today, -2),
      end_date: addDays(today, 5),
      status: 'active',
      amount_paid: 1400,
      payment_id: `pay_mock_trial_${i - 14}`,
    });
  }

  // 3 paused
  for (let i = 20; i < 23; i++) {
    stmt.run({
      customer_id: customers[i].id,
      plan_type: 'monthly',
      meal_type: 'both',
      start_date: addDays(today, -15),
      end_date: addDays(today, 15),
      status: 'paused',
      amount_paid: 4800,
      payment_id: `pay_mock_paused_${i - 19}`,
    });
  }

  // 2 expired
  for (let i = 23; i < 25; i++) {
    stmt.run({
      customer_id: customers[i].id,
      plan_type: 'trial',
      meal_type: 'both',
      start_date: addDays(today, -10),
      end_date: addDays(today, -3),
      status: 'expired',
      amount_paid: 1400,
      payment_id: `pay_mock_expired_${i - 22}`,
    });
  }

  console.log('✓ Subscriptions seeded');
}

function seedOrders() {
  const subscriptions = db.prepare(`
    SELECT s.id, s.customer_id, s.meal_type, c.area
    FROM subscriptions s JOIN customers c ON s.customer_id = c.id
    WHERE s.status IN ('active', 'expired')
  `).all();

  if (!subscriptions.length) return;

  const partners = db.prepare('SELECT id FROM delivery_partners').all();
  const statuses = ['delivered', 'delivered', 'delivered', 'in_transit', 'confirmed', 'pending', 'cancelled'];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO orders
    (subscription_id, customer_id, meal_type, delivery_date, status, partner_id)
    VALUES (@subscription_id, @customer_id, @meal_type, @delivery_date, @status, @partner_id)
  `);

  let count = 0;
  // Seed today first to guarantee today has orders, then past days
  const days = [0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -11, -12, -13];
  for (const day of days) {
    if (count >= 80) break;
    const dateStr = addDays(today, day);
    subscriptions.forEach((sub, idx) => {
      if (count >= 80) return;
      const mealsToCreate = sub.meal_type === 'both' ? ['lunch', 'dinner'] : [sub.meal_type];
      mealsToCreate.forEach(mealType => {
        if (count >= 80) return;
        const isToday = dateStr === today;
        let status;
        if (isToday) {
          status = ['pending', 'confirmed', 'picked_up', 'in_transit'][count % 4];
        } else {
          status = statuses[(count + idx) % statuses.length];
        }
        stmt.run({
          subscription_id: sub.id,
          customer_id: sub.customer_id,
          meal_type: mealType,
          delivery_date: dateStr,
          status,
          partner_id: partners.length ? partners[idx % partners.length].id : null,
        });
        count++;
      });
    });
  }

  console.log(`✓ Orders seeded (${count} orders)`);
}

function seedKitchenLists() {
  const { generateKitchenListForDate } = require('../services/kitchenService');
  generateKitchenListForDate(today, 'lunch', true);
  generateKitchenListForDate(today, 'dinner', true);
  console.log('✓ Kitchen prep lists seeded');
}

function seedSupportTickets() {
  const customers = db.prepare('SELECT id FROM customers LIMIT 5').all();
  if (!customers.length) return;

  const categories = ['delivery_issue', 'meal_quality', 'payment', 'subscription', 'other'];
  const subjects = [
    'Tiffin late tha aaj',
    'Khana thanda tha',
    'Payment deduct hua par subscription nahi mila',
    'Subscription pause karna hai',
    'Delivery address change karna hai',
  ];

  const ticketStmt = db.prepare(`
    INSERT OR IGNORE INTO support_tickets (customer_id, category, subject, description, status, priority)
    VALUES (@customer_id, @category, @subject, @description, @status, @priority)
  `);

  const msgStmt = db.prepare(`
    INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, content)
    VALUES (@ticket_id, @sender_type, @sender_name, @content)
  `);

  customers.forEach((c, i) => {
    const result = ticketStmt.run({
      customer_id: c.id,
      category: categories[i],
      subject: subjects[i],
      description: `${subjects[i]} - please help.`,
      status: 'open',
      priority: i === 2 ? 'high' : 'normal',
    });

    if (result.lastInsertRowid) {
      msgStmt.run({
        ticket_id: result.lastInsertRowid,
        sender_type: 'customer',
        sender_name: 'Customer',
        content: subjects[i],
      });
    }
  });

  console.log('✓ Support tickets seeded');
}

seed();
