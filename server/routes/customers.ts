import { Router } from 'express'
import { pool } from '../db'
import { AuthRequest, authMiddleware } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

function addMonths(date: string, months: number): string {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

// List customers
router.get('/', async (req: AuthRequest, res) => {
  const { page = 1, pageSize = 50, search, platform, category, userId } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)
  const params: any[] = []
  let where = 'WHERE 1=1'
  let idx = 1

  // Non-admin: filter by user_id
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
    `SELECT * FROM customers ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, Number(pageSize), offset]
  )

  res.json({ data: dataResult.rows, total: Number(countResult.rows[0].total), page: Number(page), pageSize: Number(pageSize) })
})

// Get single customer
router.get('/:id', async (req: AuthRequest, res) => {
  const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id])
  if (result.rows.length === 0) return res.status(404).json({ error: 'not found' })
  res.json(result.rows[0])
})

// Create customer
router.post('/', async (req: AuthRequest, res) => {
  const input = req.body
  const userId = req.user!.role !== 'admin' ? req.user!.id : (input.user_id || req.user!.id)

  const result = await pool.query(
    `INSERT INTO customers (platform_name, full_name, mother_name, phone_number, card_number, category, ministry_name, status_note, reminder_date, reminder_text, user_id, months_count, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [input.platform_name||'', input.full_name, input.mother_name||'', input.phone_number||'', input.card_number||'', input.category||'', input.ministry_name||'', input.status_note||'', input.reminder_date||'', input.reminder_text||'', userId, input.months_count||0, input.notes||'']
  )
  const customer = result.rows[0]

  // Manual reminder
  if (input.reminder_date && input.reminder_text) {
    await pool.query('DELETE FROM reminders WHERE customer_id = $1 AND is_done = 0', [customer.id])
    await pool.query('INSERT INTO reminders (customer_id, reminder_date, reminder_text) VALUES ($1, $2, $3)', [customer.id, input.reminder_date, input.reminder_text])
  }

  // Auto-reminder: 2 months before expiry
  if (input.months_count && input.months_count > 2) {
    const startDate = customer.created_at.toISOString().split('T')[0]
    const reminderDate = addMonths(startDate, input.months_count - 2)
    await pool.query('INSERT INTO reminders (customer_id, reminder_date, reminder_text) VALUES ($1, $2, $3)',
      [customer.id, reminderDate, `تنبيه: باقي شهرين على انتهاء مدة ${input.months_count} شهر`])
  }

  res.json(customer)
})

// Update customer
router.put('/:id', async (req: AuthRequest, res) => {
  const input = req.body
  const result = await pool.query(
    `UPDATE customers SET platform_name=$1, full_name=$2, mother_name=$3, phone_number=$4, card_number=$5, category=$6, ministry_name=$7, status_note=$8, reminder_date=$9, reminder_text=$10, user_id=$11, months_count=$12, notes=$13, updated_at=NOW() WHERE id=$14 RETURNING *`,
    [input.platform_name||'', input.full_name, input.mother_name||'', input.phone_number||'', input.card_number||'', input.category||'', input.ministry_name||'', input.status_note||'', input.reminder_date||'', input.reminder_text||'', input.user_id||0, input.months_count||0, input.notes||'', req.params.id]
  )
  // Sync reminder
  if (input.reminder_date && input.reminder_text) {
    await pool.query('DELETE FROM reminders WHERE customer_id = $1 AND is_done = 0', [req.params.id])
    await pool.query('INSERT INTO reminders (customer_id, reminder_date, reminder_text) VALUES ($1, $2, $3)', [req.params.id, input.reminder_date, input.reminder_text])
  }
  res.json(result.rows[0])
})

// Delete customer
router.delete('/:id', async (req: AuthRequest, res) => {
  await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

// Distinct values
router.get('/meta/platforms', async (_req, res) => {
  const r = await pool.query("SELECT DISTINCT platform_name FROM customers WHERE platform_name != '' ORDER BY platform_name")
  res.json(r.rows.map(r => r.platform_name))
})

router.get('/meta/categories', async (_req, res) => {
  const r = await pool.query("SELECT DISTINCT category FROM customers WHERE category != '' ORDER BY category")
  res.json(r.rows.map(r => r.category))
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
