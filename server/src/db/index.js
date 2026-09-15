'use strict'

const path = require('path')
const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

let db = null

function initDb(dataDir) {
  const dbPath = path.join(dataDir, 'editor.sqlite')
  db = new Database(dbPath)

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS layouts (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      layout_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size INTEGER NOT NULL,
      url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'editor',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'rest',
      url TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'GET',
      headers_json TEXT NOT NULL DEFAULT '{}',
      body_json TEXT DEFAULT NULL,
      auth_type TEXT NOT NULL DEFAULT 'none',
      auth_value TEXT DEFAULT NULL,
      refresh_s INTEGER NOT NULL DEFAULT 60,
      transform_js TEXT DEFAULT NULL,
      last_data_json TEXT DEFAULT NULL,
      last_fetched_at TEXT DEFAULT NULL,
      last_error TEXT DEFAULT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Android TV',
      model TEXT DEFAULT '',
      android_version TEXT DEFAULT '',
      sdk_int INTEGER DEFAULT 0,
      app_version TEXT DEFAULT '1.0.0',
      loaded_slug TEXT DEFAULT '',
      mem_used_mb INTEGER DEFAULT 0,
      mem_total_mb INTEGER DEFAULT 0,
      config_json TEXT DEFAULT '{}',
      logs_json TEXT DEFAULT '[]',
      last_seen TEXT,
      last_ip TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Seed default admin if no users exist
  const count = db.prepare('SELECT COUNT(*) as n FROM users').get()
  if (count.n === 0) {
    const adminUser = process.env.ADMIN_USERNAME || 'admin'
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123'
    const hash = bcrypt.hashSync(adminPass, 10)
    db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(crypto.randomUUID(), adminUser, hash, 'admin')
    console.log(`[DB] Default admin created → ${adminUser} / ${adminPass}`)
  }

  // Migration: add display_token to layouts
  const layoutCols = db.prepare("PRAGMA table_info(layouts)").all().map(c => c.name)
  if (!layoutCols.includes('display_token')) {
    db.exec('ALTER TABLE layouts ADD COLUMN display_token TEXT')
    // Generate tokens for existing screens
    const screens = db.prepare("SELECT id FROM layouts WHERE display_token IS NULL OR display_token = ''").all()
    const genToken = db.prepare('UPDATE layouts SET display_token = ? WHERE id = ?')
    for (const s of screens) genToken.run(crypto.randomBytes(6).toString('hex'), s.id)
    console.log(`[DB] Migration: display_token added (${screens.length} screens updated)`)
  }

  // Migration: old schema had `path` instead of `url` in assets
  const cols = db.prepare("PRAGMA table_info(assets)").all().map(c => c.name)
  if (cols.includes('path') && !cols.includes('url')) {
    db.exec('ALTER TABLE assets ADD COLUMN url TEXT')
    db.exec("UPDATE assets SET url = path WHERE url IS NULL OR url = ''")
    console.log('[DB] Migration: assets.path → assets.url')
  }

  console.log('[DB] Initialized at:', dbPath)
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.')
  }
  return db
}

module.exports = { initDb, getDb }
