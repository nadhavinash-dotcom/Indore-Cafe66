process.env.TZ = 'Asia/Kolkata';
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { getDB } = require('../config/database');

function runMigrations() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      run_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const already = db.prepare('SELECT id FROM _migrations WHERE filename = ?').get(file);
    if (already) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
      console.log(`✓ Migrated: ${file}`);
    } catch (err) {
      console.error(`✗ Failed: ${file}`, err.message);
      process.exit(1);
    }
  }

  console.log('All migrations complete.');
}

runMigrations();
