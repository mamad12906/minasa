import { getDatabase } from './connection'

export interface Invoice {
  id: number
  customer_id: number
  invoice_number: string
  total_months: number
  total_amount: number
  monthly_deduction: number
  creation_date: string
  status: string
  created_at: string
  updated_at: string
  // Joined fields
  customer_name?: string
  customer_phone?: string
  platform_name?: string
}

export interface InvoiceInput {
  customer_id: number
  invoice_number: string
  total_months: number
  total_amount: number
  monthly_deduction: number
  creation_date: string
  status: string
}

export interface Payment {
  id: number
  invoice_id: number
  payment_date: string
  amount: number
  month_number: number
  notes: string
  created_at: string
}

export interface PaymentInput {
  invoice_id: number
  payment_date: string
  amount: number
  month_number: number
  notes: string
}

export interface InvoiceListParams {
  page: number
  pageSize: number
  search?: string
  status?: string
  customer_id?: number
}

export interface InvoiceListResult {
  data: Invoice[]
  total: number
  page: number
  pageSize: number
}

export function listInvoices(params: InvoiceListParams): InvoiceListResult {
  const db = getDatabase()
  const { page, pageSize, search, status, customer_id } = params
  const offset = (page - 1) * pageSize

  let where = 'WHERE 1=1'
  const bindParams: any[] = []

  if (search) {
    where += ' AND (i.invoice_number LIKE ? OR c.full_name LIKE ? OR c.phone_number LIKE ?)'
    const term = `%${search}%`
    bindParams.push(term, term, term)
  }

  if (status) {
    where += ' AND i.status = ?'
    bindParams.push(status)
  }

  if (customer_id) {
    where += ' AND i.customer_id = ?'
    bindParams.push(customer_id)
  }

  const countRow = db.prepare(`
    SELECT COUNT(*) as total FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    ${where}
  `).get(...bindParams) as any

  const data = db.prepare(`
    SELECT i.*, c.full_name as customer_name, c.phone_number as customer_phone, c.platform_name
    FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    ${where}
    ORDER BY i.created_at DESC LIMIT ? OFFSET ?
  `).all(...bindParams, pageSize, offset) as Invoice[]

  return { data, total: countRow.total, page, pageSize }
}

export function getInvoice(id: number): Invoice | undefined {
  const db = getDatabase()
  return db.prepare(`
    SELECT i.*, c.full_name as customer_name, c.phone_number as customer_phone, c.platform_name
    FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    WHERE i.id = ?
  `).get(id) as Invoice | undefined
}

export function createInvoice(input: InvoiceInput): Invoice {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO invoices (customer_id, invoice_number, total_months, total_amount, monthly_deduction, creation_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(input.customer_id, input.invoice_number, input.total_months, input.total_amount, input.monthly_deduction, input.creation_date, input.status)

  return getInvoice(result.lastInsertRowid as number)!
}

export function updateInvoice(id: number, input: InvoiceInput): Invoice {
  const db = getDatabase()
  db.prepare(`
    UPDATE invoices SET
      customer_id = ?, invoice_number = ?, total_months = ?, total_amount = ?,
      monthly_deduction = ?, creation_date = ?, status = ?,
      updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(input.customer_id, input.invoice_number, input.total_months, input.total_amount, input.monthly_deduction, input.creation_date, input.status, id)

  return getInvoice(id)!
}

export function deleteInvoice(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM invoices WHERE id = ?').run(id)
}

export function getInvoicePayments(invoiceId: number): Payment[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY month_number ASC').all(invoiceId) as Payment[]
}

export function createPayment(input: PaymentInput): Payment {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO payments (invoice_id, payment_date, amount, month_number, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(input.invoice_id, input.payment_date, input.amount, input.month_number, input.notes)

  return db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid as number) as Payment
}

export function deletePayment(id: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM payments WHERE id = ?').run(id)
}

export function getDashboardStats(userId?: number) {
  const db = getDatabase()
  const filter = userId ? 'WHERE user_id = ?' : ''
  const filterAnd = userId ? 'AND user_id = ?' : ''
  const params = userId ? [userId] : []

  const customers = db.prepare(`SELECT COUNT(*) as count FROM customers ${filter}`).get(...params) as any

  const categoryBreakdown = db.prepare(`
    SELECT category, COUNT(*) as count FROM customers WHERE category != '' ${filterAnd} GROUP BY category ORDER BY count DESC LIMIT 10
  `).all(...params) as any[]

  const ministryBreakdown = db.prepare(`
    SELECT ministry_name, COUNT(*) as count FROM customers WHERE ministry_name != '' ${filterAnd} GROUP BY ministry_name ORDER BY count DESC LIMIT 15
  `).all(...params) as any[]

  const recentCustomers = db.prepare(`
    SELECT * FROM customers ${filter} ORDER BY created_at DESC LIMIT 10
  `).all(...params) as any[]

  return {
    totalCustomers: customers.count,
    categoryBreakdown,
    ministryBreakdown,
    recentCustomers
  }
}
