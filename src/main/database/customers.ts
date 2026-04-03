import { getDatabase } from './connection'
import { listCustomColumns } from './columns'

export interface Customer {
  id: number
  platform_name: string
  full_name: string
  mother_name: string
  phone_number: string
  card_number: string
  category: string
  ministry_name: string
  status_note: string
  months_count: number
  notes: string
  user_id: number
  created_at: string
  updated_at: string
  [key: string]: any
}

export interface CustomerListParams {
  page: number
  pageSize: number
  search?: string
  platform?: string
  category?: string
  userId?: number // filter by owner user (non-admin)
}

export interface CustomerListResult {
  data: Customer[]
  total: number
  page: number
  pageSize: number
}

const BASE_FIELDS = [
  'platform_name', 'full_name', 'mother_name', 'phone_number', 'card_number',
  'category', 'ministry_name', 'status_note', 'reminder_date', 'reminder_text',
  'user_id', 'months_count', 'notes'
]

export function listCustomers(params: CustomerListParams): CustomerListResult {
  const db = getDatabase()
  const { page, pageSize, search, platform, category, userId } = params
  const offset = (page - 1) * pageSize

  let where = 'WHERE 1=1'
  const bindParams: any[] = []

  if (userId) {
    where += ' AND user_id = ?'
    bindParams.push(userId)
  }

  if (search) {
    where += ' AND (full_name LIKE ? OR phone_number LIKE ? OR card_number LIKE ? OR mother_name LIKE ?)'
    const term = `%${search}%`
    bindParams.push(term, term, term, term)
  }

  if (platform) {
    where += ' AND platform_name = ?'
    bindParams.push(platform)
  }

  if (category) {
    where += ' AND category = ?'
    bindParams.push(category)
  }

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM customers ${where}`).get(...bindParams) as any
  const data = db.prepare(
    `SELECT * FROM customers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...bindParams, pageSize, offset) as Customer[]

  return { data, total: countRow.total, page, pageSize }
}

export function getCustomer(id: number): Customer | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer | undefined
}

export function createCustomer(input: any): Customer {
  const db = getDatabase()
  const customCols = listCustomColumns('customers')
  const customFieldNames = customCols.map(c => c.column_name)
  const allFields = [...BASE_FIELDS, ...customFieldNames]
  const placeholders = allFields.map(() => '?').join(', ')

  const values = [
    input.platform_name || '',
    input.full_name,
    input.mother_name || '',
    input.phone_number || '',
    input.card_number || '',
    input.category || '',
    input.ministry_name || '',
    input.status_note || '',
    input.reminder_date || '',
    input.reminder_text || '',
    input.user_id || 0,
    input.months_count || 0,
    input.notes || '',
    ...customFieldNames.map(name => input[name] != null ? String(input[name]) : '')
  ]

  const result = db.prepare(`INSERT INTO customers (${allFields.join(', ')}) VALUES (${placeholders})`).run(...values)
  return getCustomer(result.lastInsertRowid as number)!
}

export function updateCustomer(id: number, input: any): Customer {
  const db = getDatabase()
  const customCols = listCustomColumns('customers')

  const baseSetClauses = BASE_FIELDS.map(f => `${f} = ?`)
  const customSetClauses = customCols.map(c => `${c.column_name} = ?`)
  const allSetClauses = [...baseSetClauses, ...customSetClauses, "updated_at = datetime('now','localtime')"]

  const values = [
    input.platform_name || '',
    input.full_name,
    input.mother_name || '',
    input.phone_number || '',
    input.card_number || '',
    input.category || '',
    input.ministry_name || '',
    input.status_note || '',
    input.reminder_date || '',
    input.reminder_text || '',
    input.user_id || 0,
    input.months_count || 0,
    input.notes || '',
    ...customCols.map(c => input[c.column_name] != null ? String(input[c.column_name]) : ''),
    id
  ]

  db.prepare(`UPDATE customers SET ${allSetClauses.join(', ')} WHERE id = ?`).run(...values)
  return getCustomer(id)!
}

export function deleteCustomer(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM customers WHERE id = ?').run(id)
}

export function getDistinctPlatforms(): string[] {
  const db = getDatabase()
  return (db.prepare("SELECT DISTINCT platform_name FROM customers WHERE platform_name != '' ORDER BY platform_name").all() as any[]).map(r => r.platform_name)
}

export function getDistinctCategories(): string[] {
  const db = getDatabase()
  return (db.prepare("SELECT DISTINCT category FROM customers WHERE category != '' ORDER BY category").all() as any[]).map(r => r.category)
}

// --- Reminders ---

export function createReminder(customerId: number, reminderDate: string, reminderText: string) {
  const db = getDatabase()
  db.prepare('INSERT INTO reminders (customer_id, reminder_date, reminder_text) VALUES (?, ?, ?)').run(customerId, reminderDate, reminderText)
}

export function getActiveReminders(userId?: number) {
  const db = getDatabase()
  const today = new Date().toISOString().split('T')[0]
  let where = 'WHERE r.is_done = 0 AND r.is_postponed = 0 AND r.reminder_date <= ?'
  const params: any[] = [today]
  if (userId) { where += ' AND c.user_id = ?'; params.push(userId) }
  return db.prepare(`
    SELECT r.*, c.full_name, c.phone_number, c.platform_name, c.ministry_name, c.status_note, c.user_id
    FROM reminders r JOIN customers c ON c.id = r.customer_id ${where} ORDER BY r.reminder_date ASC
  `).all(...params) as any[]
}

export function getAllReminders(userId?: number) {
  const db = getDatabase()
  let where = '1=1'
  const params: any[] = []
  if (userId) { where = 'c.user_id = ?'; params.push(userId) }
  return db.prepare(`
    SELECT r.*, c.full_name, c.phone_number, c.platform_name, c.ministry_name, c.status_note, c.user_id
    FROM reminders r JOIN customers c ON c.id = r.customer_id WHERE ${where} ORDER BY r.is_done ASC, r.reminder_date ASC
  `).all(...params) as any[]
}

export function getCustomerReminders(customerId: number) {
  const db = getDatabase()
  return db.prepare('SELECT * FROM reminders WHERE customer_id = ? ORDER BY created_at DESC').all(customerId) as any[]
}

export function markReminderDone(id: number, handledBy: string, handleMethod: string) {
  const db = getDatabase()
  db.prepare("UPDATE reminders SET is_done = 1, handled_by = ?, handle_method = ?, handled_at = datetime('now','localtime') WHERE id = ?").run(handledBy, handleMethod, id)
}

export function reReminder(id: number, newDate: string, reason: string) {
  const db = getDatabase()
  const r = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id) as any
  db.prepare('INSERT INTO reminders (customer_id, reminder_date, reminder_text, original_date, is_postponed, postpone_reason) VALUES (?, ?, ?, ?, 1, ?)')
    .run(r.customer_id, newDate, r.reminder_text, r.reminder_date, reason)
}

export function postponeReminder(id: number, newDate: string, reason: string) {
  const db = getDatabase()
  const r = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id) as any
  const origDate = r.original_date || r.reminder_date
  db.prepare("UPDATE reminders SET reminder_date = ?, is_postponed = 1, postpone_reason = ?, original_date = ? WHERE id = ?").run(newDate, reason, origDate, id)
}

export function deleteReminder(id: number) {
  const db = getDatabase()
  db.prepare('DELETE FROM reminders WHERE id = ?').run(id)
}

export function syncCustomerReminder(customerId: number, reminderDate: string, reminderText: string) {
  const db = getDatabase()
  db.prepare('DELETE FROM reminders WHERE customer_id = ? AND is_done = 0').run(customerId)
  if (reminderDate && reminderText) {
    db.prepare('INSERT INTO reminders (customer_id, reminder_date, reminder_text) VALUES (?, ?, ?)').run(customerId, reminderDate, reminderText)
  }
}
