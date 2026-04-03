import { Pool } from 'pg'
import dotenv from 'dotenv'
dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      permissions TEXT NOT NULL DEFAULT '{}',
      platform_name TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      platform_name TEXT DEFAULT '',
      full_name TEXT NOT NULL,
      mother_name TEXT DEFAULT '',
      phone_number TEXT DEFAULT '',
      card_number TEXT DEFAULT '',
      category TEXT DEFAULT '',
      ministry_name TEXT DEFAULT '',
      status_note TEXT DEFAULT '',
      reminder_date TEXT DEFAULT '',
      reminder_text TEXT DEFAULT '',
      user_id INTEGER DEFAULT 0,
      months_count INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      reminder_date TEXT NOT NULL,
      reminder_text TEXT NOT NULL,
      is_done INTEGER NOT NULL DEFAULT 0,
      handled_by TEXT DEFAULT '',
      handled_at TEXT DEFAULT '',
      handle_method TEXT DEFAULT '',
      is_postponed INTEGER DEFAULT 0,
      postpone_reason TEXT DEFAULT '',
      original_date TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS platforms (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)

  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_customers_full_name ON customers(full_name);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
    CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
    CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date);
    CREATE INDEX IF NOT EXISTS idx_reminders_done ON reminders(is_done);
  `)

  // Create default admin (password is sha256 hashed)
  const admin = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
  if (admin.rows.length === 0) {
    await pool.query(
      "INSERT INTO users (username, password, display_name, role, permissions) VALUES ($1, $2, $3, $4, $5)",
      ['admin', 'eb778f8ff7c8e4850f95aa12441aae3b27ea867bb6820e20e695352b897b95bf', 'مدير النظام', 'admin', '{}']
    )
  }

  // Migrate: rehash admin password if it's still plain text
  const adminUser = await pool.query("SELECT id, password FROM users WHERE username = 'admin' AND role = 'admin' LIMIT 1")
  if (adminUser.rows.length > 0 && adminUser.rows[0].password.length < 64) {
    const crypto = await import('crypto')
    const hashed = crypto.createHash('sha256').update(adminUser.rows[0].password).digest('hex')
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, adminUser.rows[0].id])
  }

  console.log('Database initialized')
}
