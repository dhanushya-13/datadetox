import Database from 'better-sqlite3';

const db = new Database('datadetox.db');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS files_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    path TEXT,
    size INTEGER,
    hash TEXT,
    file_type TEXT,
    last_accessed DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS cleanup_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER,
    confidence_score REAL,
    risk_level TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(file_id) REFERENCES files_metadata(id)
  );

  CREATE TABLE IF NOT EXISTS user_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    recommendation_id INTEGER,
    decision TEXT, -- approve, reject, override
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(recommendation_id) REFERENCES cleanup_recommendations(id)
  );

  CREATE TABLE IF NOT EXISTS storage_trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total_used_size INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

export default db;
