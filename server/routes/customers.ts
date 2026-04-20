import { Router } from 'express'
import { pool } from '../db'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import { calculateReminderDate, calculateExpiryDate } from '../utils/reminder-utils'
import { audit } from '../audit'
import { validate, CreateCustomerSchema, UpdateCustomerSchema } from '../schemas'
import { emitEvent } from '../events'

const router = Router()
router.use(authMiddleware)

// List customers
router.get('/', async (req: AuthRequest, res) => {
  const { page = 1, pageSize = 50, search, platform, category, userId } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)
  const params: any[] = []
  let where = 'WHERE 1=1'
  let idx = 1

  const filterUserId = req.user!.role !== 'admin' ? req.user!.id : (userId ? Number(userId) : null)
  if (filterUserId) { where += ` AND user_id = $${idx++}`; params.push(filterUserId) }
  if (search) {
    where += ` AND (full_name ILIKE $${idx} OR phone_number ILIKE $${idx} OR card_number ILIKE $${idx} OR mother_name ILIKE $${idx})`
    params.push(`%${search}%`); idx++
  }
  if (platform) { where += ` AND platform_name = $${idx++}`; params.push(platform) }
  if (category) { where += ` AND category = $${idx++}`; params.push(category) }

  const countResult = await pool.query(`SELECT COUNT(*) as total FROM customers ${where}`, params)
  const dataResult = await pool.query(
    `SELECT *, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at_fmt FROM customers ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, Number(pageSize), offset]
  )

  const data = dataResult.rows.map(r => ({ ...r, created_at: r.created_at_fmt || r.created_at }))
  res.json({ data, total: Number(countResult.rows[0].total), page: Number(page), pageSize: Number(pageSize) })
})

// Distinct values (MUST be before /:id)
router.get('/meta/platforms', async (_req, res) => {
  const r = await pool.query("SELECT DISTINCT platform_name FROM customers WHERE platform_name != '' ORDER BY platform_name")
  res.json(r.rows.map(r => r.platform_name))
})

router.get('/meta/categories', async (_req, res) => {
  const r = await pool.query("SELECT DISTINCT category FROM customers WHERE category != '' ORDER BY category")
  res.json(r.rows.map(r => r.category))
})

// DELETE ALL customers (admin only) - MUST be before /:id
router.delete('/all/delete', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'admin only' })
  await pool.query('DELETE FROM reminders')
  const result = await pool.query('DELETE FROM customers')
  await audit(req, 'delete_all', 'customer', null, `deleted ${result.rowCount} customers`)
  res.json({ success: true, deleted: result.rowCount })
})

// DELETE all customers of a specific user (admin only) - MUST be before /:id
router.delete('/user/:userId/delete', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'admin only' })
  const userId = req.params.userId
  await pool.query('DELETE FROM reminders WHERE customer_id IN (SELECT id FROM customers WHERE user_id = $1)', [userId])
  const result = await pool.query('DELETE FROM customers WHERE user_id = $1', [userId])
  await audit(req, 'delete_user_customers', 'user', parseInt(userId, 10),
    `deleted ${result.rowCount} customers of user #${userId}`)
  res.json({ success: true, deleted: result.rowCount })
})

// Get single customer
router.get('/:id', async (req: AuthRequest, res) => {
  const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id])
  if (result.rows.length === 0) return res.status(404).json({ error: 'not found' })
  res.json(result.rows[0])
})

// Create customer
router.post('/', validate(CreateCustomerSchema), async (req: AuthRequest, res) => {
  const input = req.body
  const userId = req.user!.role !== 'admin' ? req.user!.id : (input.user_id || req.user!.id)

  const result = await pool.query(
    `INSERT INTO customers (platform_name, full_name, mother_name, phone_number, card_number, category, ministry_name, status_note, reminder_date, reminder_text, user_id, months_count, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [input.platform_name||'', input.full_name, input.mother_name||'', input.phone_number||'', input.card_number||'', input.category||'', input.ministry_name||'', input.status_note||'', input.reminder_date||'', input.reminder_text||'', userId, input.months_count||0, input.notes||'']
  )
  const customer = result.rows[0]

  if (input.reminder_date && input.reminder_text) {
    await pool.query('DELETE FROM reminders WHERE customer_id = $1 AND is_done = 0', [customer.id])
    await pool.query('INSERT INTO reminders (customer_id, reminder_date, reminder_text) VALUES ($1, $2, $3)', [customer.id, input.reminder_date, input.reminder_text])
  }

  if (input.months_count && input.months_count > 0) {
    const createdAt: Date = customer.created_at instanceof Date ? customer.created_at : new Date(customer.created_at)
    const endDate = calculateExpiryDate(createdAt, input.months_count)
    const computedReminder = calculateReminderDate(createdAt, input.months_count, input.reminder_before || 2)
    const reminderDate = input.reminder_date || computedReminder
    const reminderText = input.reminder_text || `تذكير: انتهاء المدة (${input.months_count} شهر) بتاريخ ${endDate}`
    if (reminderDate) {
      await pool.query('INSERT INTO reminders (customer_id, reminder_date, reminder_text) VALUES ($1, $2, $3)',
        [customer.id, reminderDate, reminderText])
    }
  }

  await audit(req, 'create', 'customer', customer.id,
    `added customer ${customer.full_name}`)
  emitEvent('customer.created', req.user, customer.id, customer.full_name)
  res.json(customer)
})

// Update customer
router.put('/:id', validate(UpdateCustomerSchema), async (req: AuthRequest, res) => {
  const input = req.body
  const existing = await pool.query('SELECT user_id FROM customers WHERE id = $1', [req.params.id])
  const originalUserId = existing.rows[0]?.user_id || req.user!.id
  const result = await pool.query(
    `UPDATE customers SET platform_name=$1, full_name=$2, mother_name=$3, phone_number=$4, card_number=$5, category=$6, ministry_name=$7, status_note=$8, reminder_date=$9, reminder_text=$10, user_id=$11, months_count=$12, notes=$13, updated_at=NOW() WHERE id=$14 RETURNING *`,
    [input.platform_name||'', input.full_name, input.mother_name||'', input.phone_number||'', input.card_number||'', input.category||'', input.ministry_name||'', input.status_note||'', input.reminder_date||'', input.reminder_text||'', input.user_id || originalUserId, input.months_count||0, input.notes||'', req.params.id]
  )
  if (input.reminder_date && input.reminder_text) {
    await pool.query('DELETE FROM reminders WHERE customer_id = $1 AND is_done = 0', [req.params.id])
    await pool.query('INSERT INTO reminders (customer_id, reminder_date, reminder_text) VALUES ($1, $2, $3)', [req.params.id, input.reminder_date, input.reminder_text])
  }
  await audit(req, 'update', 'customer', result.rows[0].id,
    `edited customer ${result.rows[0].full_name}`)
  emitEvent('customer.updated', req.user, result.rows[0].id, result.rows[0].full_name)
  res.json(result.rows[0])
})

// Delete customer
router.delete('/:id', async (req: AuthRequest, res) => {
  const existing = await pool.query('SELECT full_name FROM customers WHERE id = $1', [req.params.id])
  await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id])
  await audit(req, 'delete', 'customer', parseInt(req.params.id, 10),
    `deleted customer ${existing.rows[0]?.full_name || ''}`)
  emitEvent('customer.deleted', req.user, parseInt(req.params.id, 10),
    existing.rows[0]?.full_name || '')
  res.json({ success: true })
})

// Customer reminders
router.get('/:id/reminders', async (req, res) => {
  const r = await pool.query('SELECT * FROM reminders WHERE customer_id = $1 ORDER BY created_at DESC', [req.params.id])
  res.json(r.rows)
})

// Transfer customers (admin)
router.post('/transfer', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'admin only' })
  const { customerIds, targetPlatform } = req.body
  for (const id of customerIds) {
    await pool.query("UPDATE customers SET platform_name = $1, updated_at = NOW() WHERE id = $2", [targetPlatform, id])
  }
  res.json({ success: true })
})

export default router
