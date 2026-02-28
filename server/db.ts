import Database from 'better-sqlite3';

const db = new Database('datadetox.db');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    photos_access INTEGER DEFAULT 1,
    videos_access INTEGER DEFAULT 1,
    email_access INTEGER DEFAULT 1,
    documents_access INTEGER DEFAULT 1,
    files_access INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS backups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    size INTEGER,
    status TEXT DEFAULT 'completed', -- completed, in_progress, failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    theme TEXT DEFAULT 'light',
    auto_scan_enabled INTEGER DEFAULT 0,
    notification_threshold INTEGER DEFAULT 80,
    cleanup_goal INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
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

  CREATE TABLE IF NOT EXISTS user_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    provider_id TEXT,
    connected INTEGER DEFAULT 0,
    last_sync DATETIME,
    storage_used TEXT,
    UNIQUE(user_id, provider_id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add missing columns if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const columns = tableInfo.map(info => info.name);

if (!columns.includes('email')) {
  db.exec("ALTER TABLE users ADD COLUMN email TEXT UNIQUE");
}
if (!columns.includes('is_verified')) {
  db.exec("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0");
}
if (!columns.includes('verification_code')) {
  db.exec("ALTER TABLE users ADD COLUMN verification_code TEXT");
}

const prefTableInfo = db.prepare("PRAGMA table_info(user_preferences)").all() as any[];
const prefColumns = prefTableInfo.map(info => info.name);
if (!prefColumns.includes('cleanup_goal')) {
  db.exec("ALTER TABLE user_preferences ADD COLUMN cleanup_goal INTEGER");
}

// Ensure demo user has an email if it exists without one
db.exec("UPDATE users SET email = 'demo@datadetox.ai' WHERE username = 'demo' AND email IS NULL");

export default db;
