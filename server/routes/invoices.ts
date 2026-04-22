import { Router } from 'express'
import { pool } from '../db'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { audit } from '../audit'
import { validate, CreateInvoiceSchema, UpdateInvoiceSchema } from '../schemas'
import { emitEvent } from '../events'

const router = Router()
router.use(authMiddleware)

function computeStatus(amount: number, paid: number): string {
  if (amount <= 0 || paid <= 0) return 'unpaid'
  if (paid >= amount) return 'paid'
  return 'partial'
}

// List invoices (paginated, filtered)
router.get('/', async (req: AuthRequest, res) => {
  const { page = 1, pageSize = 50, search, status, customer_id } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)
  const params: any[] = []
  let where = 'WHERE 1=1'
  let idx = 1

  // Scope: admin sees all; subadmin sees their own + sub-users' customers'
  // invoices; regular user sees only their own customers' invoices.
  const role = req.user!.role
  if (role === 'subadmin') {
    where += ` AND (c.user_id = $${idx} OR c.user_id IN (SELECT id FROM users WHERE parent_id = $${idx}))`
    params.push(req.user!.id); idx++
  } else if (role !== 'admin') {
    where += ` AND c.user_id = $${idx++}`
    params.push(req.user!.id)
  }
  if (customer_id) {
    where += ` AND i.customer_id = $${idx++}`
    params.push(Number(customer_id))
  }
  if (status) {
    where += ` AND i.status = $${idx++}`
    params.push(status)
  }
  if (search) {
    where += ` AND (i.customer_name ILIKE $${idx} OR i.customer_phone ILIKE $${idx} OR i.notes ILIKE $${idx})`
    params.push(`%${search}%`); idx++
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM invoices i LEFT JOIN customers c ON c.id = i.customer_id ${where}`,
    params
  )
  const dataResult = await pool.query(
    `SELECT i.*, TO_CHAR(i.created_at, 'YYYY-MM-DD HH24:MI') as created_at_fmt,
            COALESCE(u.display_name, u.username, '') AS created_by_name
     FROM invoices i
     LEFT JOIN customers c ON c.id = i.customer_id
     LEFT JOIN users u ON u.id = i.user_id
     ${where} ORDER BY i.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, Number(pageSize), offset]
  )

  const data = dataResult.rows.map(r => ({
    ...r,
    amount: Number(r.amount),
    paid_amount: Number(r.paid_amount),
    created_at: r.created_at_fmt || r.created_at,
  }))
  res.json({ data, total: Number(countResult.rows[0].total), page: Number(page), pageSize: Number(pageSize) })
})

// Get single invoice
router.get('/:id', async (req: AuthRequest, res) => {
  const r = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id])
  if (r.rows.length === 0) return res.status(404).json({ error: 'not found' })
  const row = r.rows[0]
  res.json({ ...row, amount: Number(row.amount), paid_amount: Number(row.paid_amount) })
})

// Create invoice
router.post('/', requirePermission('add_invoice'), validate(CreateInvoiceSchema), async (req: AuthRequest, res) => {
  const input = req.body

  // Verify customer exists (foreign key would fail otherwise with a cryptic error).
  const cust = await pool.query('SELECT id, full_name, phone_number, user_id FROM customers WHERE id = $1', [input.customer_id])
  if (cust.rows.length === 0) {
    return res.status(400).json({ error: 'الزبون غير موجود' })
  }
  const customer = cust.rows[0]

  const amount = Number(input.amount) || 0
  const paid = Number(input.paid_amount) || 0
  const status = input.status || computeStatus(amount, paid)
  const name = input.customer_name || customer.full_name || ''
  const phone = input.customer_phone || customer.phone_number || ''

  const result = await pool.query(
    `INSERT INTO invoices (customer_id, customer_name, customer_phone, platform_name, amount, paid_amount, status, due_date, notes, user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [input.customer_id, name, phone, input.platform_name || '', amount, paid, status, input.due_date || '', input.notes || '', req.user!.id]
  )
  const invoice = result.rows[0]

  await audit(req, 'create', 'invoice', invoice.id,
    `added invoice ${amount} for ${name}`)
  emitEvent('invoice.created', req.user, invoice.id, name)
  res.json({ ...invoice, amount: Number(invoice.amount), paid_amount: Number(invoice.paid_amount) })
})

// Update invoice
router.put('/:id', requirePermission('edit_invoice'), validate(UpdateInvoiceSchema), async (req: AuthRequest, res) => {
  const input = req.body
  const id = parseInt(req.params.id, 10)

  const existing = await pool.query('SELECT * FROM invoices WHERE id = $1', [id])
  if (existing.rows.length === 0) return res.status(404).json({ error: 'not found' })
  const cur = existing.rows[0]

  const amount = input.amount !== undefined ? Number(input.amount) : Number(cur.amount)
  const paid = input.paid_amount !== undefined ? Number(input.paid_amount) : Number(cur.paid_amount)
  const status = input.status || computeStatus(amount, paid)

  const result = await pool.query(
    `UPDATE invoices SET
       customer_id = $1,
       customer_name = $2,
       customer_phone = $3,
       platform_name = $4,
       amount = $5,
       paid_amount = $6,
       status = $7,
       due_date = $8,
       notes = $9,
       updated_at = NOW()
     WHERE id = $10 RETURNING *`,
    [
      input.customer_id ?? cur.customer_id,
      input.customer_name ?? cur.customer_name,
      input.customer_phone ?? cur.customer_phone,
      input.platform_name ?? cur.platform_name,
      amount,
      paid,
      status,
      input.due_date ?? cur.due_date,
      input.notes ?? cur.notes,
      id,
    ]
  )
  const invoice = result.rows[0]
  await audit(req, 'update', 'invoice', invoice.id,
    `edited invoice #${invoice.id} (${invoice.customer_name})`)
  emitEvent('invoice.updated', req.user, invoice.id, invoice.customer_name)
  res.json({ ...invoice, amount: Number(invoice.amount), paid_amount: Number(invoice.paid_amount) })
})

// Delete invoice
router.delete('/:id', requirePermission('delete_invoice'), async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10)
  const existing = await pool.query('SELECT customer_name FROM invoices WHERE id = $1', [id])
  await pool.query('DELETE FROM invoices WHERE id = $1', [id])
  await audit(req, 'delete', 'invoice', id,
    `deleted invoice #${id} (${existing.rows[0]?.customer_name || ''})`)
  emitEvent('invoice.deleted', req.user, id, existing.rows[0]?.customer_name || '')
  res.json({ success: true })
})

export default router
