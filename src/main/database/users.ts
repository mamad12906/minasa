import { getDatabase } from './connection'
import bcrypt from 'bcryptjs'

export interface User {
  id: number
  username: string
  password: string
  display_name: string
  role: string
  permissions: string
  platform_name: string
  created_at: string
}

export function loginUser(username: string, password: string): User | null {
  const db = getDatabase()
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined
  if (!user) return null

  // Support both hashed and plain passwords (migration)
  if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
    // Hashed password
    if (bcrypt.compareSync(password, user.password)) return user
    return null
  } else {
    // Plain text (legacy) - migrate to hashed
    if (user.password === password) {
      const hashed = bcrypt.hashSync(password, 10)
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, user.id)
      return user
    }
    return null
  }
}

export function listUsers(): (Omit<User, 'password'> & { customer_count: number })[] {
  const db = getDatabase()
  return db.prepare(`
    SELECT u.id, u.username, u.display_name, u.role, u.permissions, u.platform_name, u.created_at,
      (SELECT COUNT(*) FROM customers c WHERE c.user_id = u.id) as customer_count
    FROM users u ORDER BY u.created_at ASC
  `).all() as any[]
}

export function createUser(username: string, password: string, displayName: string, role: string, permissions: string, platformName: string): User {
  const db = getDatabase()
  const hashed = bcrypt.hashSync(password, 10)
  const result = db.prepare('INSERT INTO users (username, password, display_name, role, permissions, platform_name) VALUES (?, ?, ?, ?, ?, ?)')
    .run(username, hashed, displayName, role, permissions, platformName || '')
  return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid as number) as User
}

export function updateUser(id: number, displayName: string, password: string | null, permissions: string, platformName: string): User {
  const db = getDatabase()
  if (password) {
    const hashed = bcrypt.hashSync(password, 10)
    db.prepare('UPDATE users SET display_name = ?, password = ?, permissions = ?, platform_name = ? WHERE id = ?')
      .run(displayName, hashed, permissions, platformName || '', id)
  } else {
    db.prepare('UPDATE users SET display_name = ?, permissions = ?, platform_name = ? WHERE id = ?')
      .run(displayName, permissions, platformName || '', id)
  }
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User
}

export function deleteUser(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM users WHERE id = ?').run(id)
}

// Platforms
export function listPlatforms(): { id: number; name: string }[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM platforms ORDER BY name ASC').all() as any[]
}

export function addPlatform(name: string) {
  const db = getDatabase()
  db.prepare('INSERT OR IGNORE INTO platforms (name) VALUES (?)').run(name)
}

export function deletePlatform(id: number) {
  const db = getDatabase()
  db.prepare('DELETE FROM platforms WHERE id = ?').run(id)
}

// Categories
export function listCategories(): { id: number; name: string }[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM categories ORDER BY name ASC').all() as any[]
}

export function addCategory(name: string) {
  const db = getDatabase()
  db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(name)
}

export function deleteCategory(id: number) {
  const db = getDatabase()
  db.prepare('DELETE FROM categories WHERE id = ?').run(id)
}

// Ministries
export function listMinistries(): { id: number; name: string }[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM ministries ORDER BY name ASC').all() as any[]
}

export function addMinistry(name: string) {
  const db = getDatabase()
  db.prepare('INSERT OR IGNORE INTO ministries (name) VALUES (?)').run(name)
}

export function deleteMinistry(id: number) {
  const db = getDatabase()
  db.prepare('DELETE FROM ministries WHERE id = ?').run(id)
}

// Transfer customers between platforms
export function transferCustomers(customerIds: number[], targetPlatform: string) {
  const db = getDatabase()
  const stmt = db.prepare("UPDATE customers SET platform_name = ?, updated_at = datetime('now','localtime') WHERE id = ?")
  const run = db.transaction(() => {
    for (const id of customerIds) {
      stmt.run(targetPlatform, id)
    }
  })
  run()
}
