const Database = require('better-sqlite3');
const path = require('path');

let db;

function getDB() {
  if (!db) {
    const dbPath = process.env.DB_PATH
      ? path.resolve(process.cwd(), process.env.DB_PATH)
      : path.join(__dirname, '../db/cafe_indoori.sqlite');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('synchronous = NORMAL');
  }
  return db;
}

module.exports = { getDB };
