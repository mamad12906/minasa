import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'minasa.db')

  db = new Database(dbPath)

  // Performance settings
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')

  // Initialize schema
  const schemaPath = path.join(__dirname, '../../src/main/database/schema.sql')
  const fallbackPath = path.join(app.getAppPath(), 'src/main/database/schema.sql')

  let schema: string
  if (fs.existsSync(schemaPath)) {
    schema = fs.readFileSync(schemaPath, 'utf-8')
  } else if (fs.existsSync(fallbackPath)) {
    schema = fs.readFileSync(fallbackPath, 'utf-8')
  } else {
    // Inline schema as fallback
    schema = getInlineSchema()
  }

  db.exec(schema)

  // Migrations
  const cols = db.prepare("PRAGMA table_info(customers)").all() as any[]
  const addCol = (name: string, def: string = "TEXT DEFAULT ''") => {
    if (!cols.find((c: any) => c.name === name)) db.exec(`ALTER TABLE customers ADD COLUMN ${name} ${def}`)
  }
  addCol('ministry_name')
  addCol('status_note')
  addCol('reminder_date')
  addCol('reminder_text')
  addCol('user_id', 'INTEGER DEFAULT 0')
  addCol('months_count', 'INTEGER DEFAULT 0')
  addCol('notes')

  // Reminders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      reminder_date TEXT NOT NULL,
      reminder_text TEXT NOT NULL,
      is_done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)
  db.exec('CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_reminders_done ON reminders(is_done)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_reminders_customer ON reminders(customer_id)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id)')

  // Migration: add reminder extra fields
  const rCols = db.prepare("PRAGMA table_info(reminders)").all() as any[]
  if (!rCols.find((c: any) => c.name === 'handled_by')) {
    db.exec("ALTER TABLE reminders ADD COLUMN handled_by TEXT DEFAULT ''")
  }
  if (!rCols.find((c: any) => c.name === 'handled_at')) {
    db.exec("ALTER TABLE reminders ADD COLUMN handled_at TEXT DEFAULT ''")
  }
  if (!rCols.find((c: any) => c.name === 'is_postponed')) {
    db.exec("ALTER TABLE reminders ADD COLUMN is_postponed INTEGER DEFAULT 0")
  }
  if (!rCols.find((c: any) => c.name === 'postpone_reason')) {
    db.exec("ALTER TABLE reminders ADD COLUMN postpone_reason TEXT DEFAULT ''")
  }
  if (!rCols.find((c: any) => c.name === 'original_date')) {
    db.exec("ALTER TABLE reminders ADD COLUMN original_date TEXT DEFAULT ''")
  }
  if (!rCols.find((c: any) => c.name === 'handle_method')) {
    db.exec("ALTER TABLE reminders ADD COLUMN handle_method TEXT DEFAULT ''")
  }

  // Users & permissions
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      permissions TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)
  // Migration: add platform_name to users
  const uCols = db.prepare("PRAGMA table_info(users)").all() as any[]
  if (!uCols.find((c: any) => c.name === 'platform_name')) {
    db.exec("ALTER TABLE users ADD COLUMN platform_name TEXT DEFAULT ''")
  }

  // Platforms table
  db.exec(`
    CREATE TABLE IF NOT EXISTS platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)

  // Categories table (managed by admin)
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `)

  // Create default admin with randomly generated password if not exists.
  // User is forced to change it on first login (hence must_change_password flag).
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin'").get()
  if (!adminExists) {
    const bcrypt = require('bcryptjs')
    const crypto = require('crypto')
    // Generate secure random password (12 chars, alphanumeric)
    const randomPw = crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '').substring(0, 12)
    const hashedPw = bcrypt.hashSync(randomPw, 10)
    db.prepare("INSERT INTO users (username, password, display_name, role, permissions, platform_name) VALUES (?, ?, ?, ?, ?, ?)")
      .run('admin', hashedPw, 'مدير النظام', 'admin', '{}', '')
    // Write initial password to file so admin can read it once
    try {
      const fs = require('fs')
      const path = require('path')
      const { app } = require('electron')
      const credFile = path.join(app.getPath('userData'), 'INITIAL_ADMIN_PASSWORD.txt')
      fs.writeFileSync(credFile,
        `منصة - كلمة المرور الأولى لحساب المدير\n` +
        `─────────────────────────────────────\n\n` +
        `اسم المستخدم: admin\n` +
        `كلمة المرور:  ${randomPw}\n\n` +
        `⚠️ يرجى تسجيل الدخول وتغيير كلمة المرور فوراً.\n` +
        `سيتم حذف هذا الملف بعد أول تسجيل دخول ناجح.\n`,
        { encoding: 'utf8' })
      console.log('[initDB] Initial admin password written to:', credFile)
    } catch (err: any) {
      console.error('[initDB] Failed to write initial password file:', err.message)
      // Fallback: log to console
      console.log('[initDB] INITIAL ADMIN PASSWORD:', randomPw)
    }
  }

  // Audit log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 0,
      user_name TEXT DEFAULT '',
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER DEFAULT 0,
      details TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)
  db.exec('CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id)')

  // Initialize custom columns metadata table
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      column_name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      column_type TEXT NOT NULL DEFAULT 'text',
      table_name TEXT NOT NULL DEFAULT 'customers',
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `)

  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

function getInlineSchema(): string {
  return `
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform_name TEXT NOT NULL DEFAULT '',
      full_name TEXT NOT NULL,
      mother_name TEXT DEFAULT '',
      phone_number TEXT DEFAULT '',
      card_number TEXT DEFAULT '',
      category TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      invoice_number TEXT NOT NULL,
      total_months INTEGER NOT NULL DEFAULT 1,
      total_amount REAL NOT NULL DEFAULT 0,
      monthly_deduction REAL NOT NULL DEFAULT 0,
      creation_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'نشطة',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      payment_date TEXT NOT NULL,
      amount REAL NOT NULL,
      month_number INTEGER NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_customers_full_name ON customers(full_name);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
    CREATE INDEX IF NOT EXISTS idx_customers_card ON customers(card_number);
    CREATE INDEX IF NOT EXISTS idx_customers_platform ON customers(platform_name);
    CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(category);
    CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
    CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
  `
}
