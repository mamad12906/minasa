import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { calculateReminderDate, calculateExpiryDate } from '../utils/reminder-utils'
import { audit } from '../audit'
import { validate, CreateCustomerSchema, UpdateCustomerSchema } from '../schemas'
import { emitEvent } from '../events'

/**
 * Guard for destructive bulk routes — require the admin to re-enter their
 * password in the request body as `confirm_password`. Returns true if it
 * matches, else writes a 403/400 and returns false. Caller should `return`.
 */
async function verifyAdminPassword(req: AuthRequest, res: any): Promise<boolean> {
  const confirm = (req.body?.confirm_password as string | undefined)?.trim()
  if (!confirm) {
    res.status(400).json({ error: 'يجب إدخال كلمة مرور الأدمن للتأكيد' })
    return false
  }
  const r = await pool.query('SELECT password FROM users WHERE id = $1 LIMIT 1', [req.user!.id])
  const stored = r.rows[0]?.password as string | undefined
  if (!stored) {
    res.status(403).json({ error: 'تعذّر التحقق من كلمة المرور' })
    return false
  }
  const ok = stored.startsWith('$2') && bcrypt.compareSync(confirm, stored)
  if (!ok) {
    res.status(403).json({ error: 'كلمة المرور خاطئة — الحذف ملغى' })
    return false
  }
  return true
}

const router = Router()
router.use(authMiddleware)

// List customers
router.get('/', async (req: AuthRequest, res) => {
  const { page = 1, pageSize = 50, search, platform, category, userId } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)
  const params: any[] = []
  // Tenant scoping is the outermost gate — every other filter narrows from
  // here. Even main admin can only see rows in their own tenant.
  let where = `WHERE c.tenant_id = $1`
  params.push(req.user!.tenant_id)
  let idx = 2

  // Scope: main admin sees everything (optionally narrowed by userId filter);
  // subadmin sees their own + their sub-users' customers; regular user sees
  // only their own.
  const role = req.user!.role
  if (role === 'admin') {
    if (userId) { where += ` AND c.user_id = $${idx++}`; params.push(Number(userId)) }
  } else if (role === 'subadmin') {
    where += ` AND (c.user_id = $${idx} OR c.user_id IN (SELECT id FROM users WHERE parent_id = $${idx} AND tenant_id = c.tenant_id))`
    params.push(req.user!.id); idx++
    if (userId) {
      // Subadmin explicitly filtering to one of their sub-users — server
      // still enforces the parent relationship above, so no leakage.
      where += ` AND c.user_id = $${idx++}`
      params.push(Number(userId))
    }
  } else {
    where += ` AND c.user_id = $${idx++}`
    params.push(req.user!.id)
  }

  if (search) {
    where += ` AND (c.full_name ILIKE $${idx} OR c.phone_number ILIKE $${idx} OR c.card_number ILIKE $${idx} OR c.mother_name ILIKE $${idx})`
    params.push(`%${search}%`); idx++
  }
  if (platform) { where += ` AND c.platform_name = $${idx++}`; params.push(platform) }
  if (category) { where += ` AND c.category = $${idx++}`; params.push(category) }

  const countResult = await pool.query(
    `SELECT COUNT(*) as total FROM customers c ${where}`,
    params,
  )
  const dataResult = await pool.query(
    `SELECT c.*,
            TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI') as created_at_fmt,
            COALESCE(u.display_name, u.username, '') AS added_by_name,
            -- Parent of the owning user (subadmin name if any) so admin can
            -- see which sub-tree a customer belongs to. Null for top-level
            -- owners (main admin or orphaned parent_id).
            COALESCE(pu.display_name, pu.username, '') AS parent_admin_name
     FROM customers c
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN users pu ON pu.id = u.parent_id AND pu.role = 'subadmin'
     ${where} ORDER BY c.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, Number(pageSize), offset],
  )

  const data = dataResult.rows.map(r => ({ ...r, created_at: r.created_at_fmt || r.created_at }))
  res.json({ data, total: Number(countResult.rows[0].total), page: Number(page), pageSize: Number(pageSize) })
})

// Distinct values (MUST be before /:id)
router.get('/meta/platforms', async (req: AuthRequest, res) => {
  const r = await pool.query(
    "SELECT DISTINCT platform_name FROM customers WHERE tenant_id = $1 AND platform_name != '' ORDER BY platform_name",
    [req.user!.tenant_id],
  )
  res.json(r.rows.map(r => r.platform_name))
})

router.get('/meta/categories', async (req: AuthRequest, res) => {
  const r = await pool.query(
    "SELECT DISTINCT category FROM customers WHERE tenant_id = $1 AND category != '' ORDER BY category",
    [req.user!.tenant_id],
  )
  res.json(r.rows.map(r => r.category))
})

// DELETE ALL customers (admin only) - MUST be before /:id
// Requires `confirm_password` in the body matching the admin's current
// password. Without it, the request fails without touching any rows.
router.delete('/all/delete', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'admin only' })
  if (!await verifyAdminPassword(req, res)) return
  await pool.query('DELETE FROM reminders WHERE tenant_id = $1', [req.user!.tenant_id])
  const result = await pool.query('DELETE FROM customers WHERE tenant_id = $1', [req.user!.tenant_id])
  await audit(req, 'delete_all', 'customer', null, `deleted ${result.rowCount} customers`)
  res.json({ success: true, deleted: result.rowCount })
})

// DELETE all customers of a specific user (admin only) - MUST be before /:id
// Same password re-entry guard as the nuke-all route above.
router.delete('/user/:userId/delete', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'admin only' })
  if (!await verifyAdminPassword(req, res)) return
  const userId = parseInt(req.params.userId, 10)
  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({ error: 'user_id غير صالح' })
  }
  await pool.query(
    'DELETE FROM reminders WHERE tenant_id = $1 AND customer_id IN (SELECT id FROM customers WHERE user_id = $2 AND tenant_id = $1)',
    [req.user!.tenant_id, userId],
  )
  const result = await pool.query(
    'DELETE FROM customers WHERE tenant_id = $1 AND user_id = $2',
    [req.user!.tenant_id, userId],
  )
  await audit(req, 'delete_user_customers', 'user', userId,
    `deleted ${result.rowCount} customers of user #${userId}`)
  res.json({ success: true, deleted: result.rowCount })
})

// Get single customer
router.get('/:id', async (req: AuthRequest, res) => {
  const result = await pool.query(
    'SELECT * FROM customers WHERE id = $1 AND tenant_id = $2',
    [req.params.id, req.user!.tenant_id],
  )
  if (result.rows.length === 0) return res.status(404).json({ error: 'not found' })
  res.json(result.rows[0])
})

// Create customer
router.post('/', requirePermission('add_customer'), validate(CreateCustomerSchema), async (req: AuthRequest, res) => {
  const input = req.body
  const userId = req.user!.role !== 'admin' ? req.user!.id : (input.user_id || req.user!.id)
  const tenantId = req.user!.tenant_id

  const result = await pool.query(
    `INSERT INTO customers (tenant_id, platform_name, full_name, mother_name, nickname, phone_number, card_number, category, ministry_name, status_note, reminder_date, reminder_text, user_id, months_count, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [tenantId, input.platform_name||'', input.full_name, input.mother_name||'', input.nickname||'', input.phone_number||'', input.card_number||'', input.category||'', input.ministry_name||'', input.status_note||'', input.reminder_date||'', input.reminder_text||'', userId, input.months_count||0, input.notes||'']
  )
  const customer = result.rows[0]

  if (input.reminder_date && input.reminder_text) {
    await pool.query('DELETE FROM reminders WHERE tenant_id = $1 AND customer_id = $2 AND is_done = 0', [tenantId, customer.id])
    await pool.query('INSERT INTO reminders (tenant_id, customer_id, reminder_date, reminder_text, user_id) VALUES ($1, $2, $3, $4, $5)', [tenantId, customer.id, input.reminder_date, input.reminder_text, req.user!.id])
  }

  if (input.months_count && input.months_count > 0) {
    const createdAt: Date = customer.created_at instanceof Date ? customer.created_at : new Date(customer.created_at)
    const endDate = calculateExpiryDate(createdAt, input.months_count)
    const computedReminder = calculateReminderDate(createdAt, input.months_count, input.reminder_before || 2)
    const reminderDate = input.reminder_date || computedReminder
    const reminderText = input.reminder_text || `تذكير: انتهاء المدة (${input.months_count} شهر) بتاريخ ${endDate}`
    if (reminderDate) {
      await pool.query('INSERT INTO reminders (tenant_id, customer_id, reminder_date, reminder_text, user_id) VALUES ($1, $2, $3, $4, $5)',
        [tenantId, customer.id, reminderDate, reminderText, req.user!.id])
    }
  }

  await audit(req, 'create', 'customer', customer.id,
    `added customer ${customer.full_name}`)
  emitEvent('customer.created', req.user, customer.id, customer.full_name)
  res.json(customer)
})

// Update customer
router.put('/:id', requirePermission('edit_customer'), validate(UpdateCustomerSchema), async (req: AuthRequest, res) => {
  const input = req.body
  const tenantId = req.user!.tenant_id
  const existing = await pool.query(
    'SELECT user_id FROM customers WHERE id = $1 AND tenant_id = $2',
    [req.params.id, tenantId],
  )
  if (existing.rows.length === 0) return res.status(404).json({ error: 'not found' })
  const originalUserId = existing.rows[0]?.user_id || req.user!.id
  const result = await pool.query(
    `UPDATE customers SET platform_name=$1, full_name=$2, mother_name=$3, nickname=$4, phone_number=$5, card_number=$6, category=$7, ministry_name=$8, status_note=$9, reminder_date=$10, reminder_text=$11, user_id=$12, months_count=$13, notes=$14, updated_at=NOW() WHERE id=$15 AND tenant_id=$16 RETURNING *`,
    [input.platform_name||'', input.full_name, input.mother_name||'', input.nickname||'', input.phone_number||'', input.card_number||'', input.category||'', input.ministry_name||'', input.status_note||'', input.reminder_date||'', input.reminder_text||'', input.user_id || originalUserId, input.months_count||0, input.notes||'', req.params.id, tenantId]
  )
  const customer = result.rows[0]

  // Reminder sync — only touch the reminder table when the caller actually
  // supplied reminder data. Editing unrelated fields (name, phone, etc.)
  // must preserve existing reminders untouched.
  const hasManualReminder = input.reminder_date && input.reminder_text
  const hasMonthsReminder = input.months_count && input.months_count > 0

  if (hasManualReminder || hasMonthsReminder) {
    // User is replacing reminders — drop pending ones first so the old
    // auto-generated reminder doesn't keep firing on its old schedule.
    await pool.query(
      'DELETE FROM reminders WHERE tenant_id = $1 AND customer_id = $2 AND is_done = 0',
      [tenantId, req.params.id])
  }

  if (hasManualReminder) {
    await pool.query(
      'INSERT INTO reminders (tenant_id, customer_id, reminder_date, reminder_text, user_id) VALUES ($1, $2, $3, $4, $5)',
      [tenantId, req.params.id, input.reminder_date, input.reminder_text, req.user!.id])
  }

  if (hasMonthsReminder) {
    const createdAt: Date = customer.created_at instanceof Date
      ? customer.created_at
      : new Date(customer.created_at)
    const endDate = calculateExpiryDate(createdAt, input.months_count)
    const computedReminder = calculateReminderDate(
      createdAt, input.months_count, input.reminder_before || 2)
    const reminderDate = input.reminder_date || computedReminder
    const reminderText = input.reminder_text
      || `تذكير: انتهاء المدة (${input.months_count} شهر) بتاريخ ${endDate}`
    if (reminderDate && !hasManualReminder) {
      // Only insert the auto-reminder if the manual one wasn't already inserted above.
      await pool.query(
        'INSERT INTO reminders (tenant_id, customer_id, reminder_date, reminder_text, user_id) VALUES ($1, $2, $3, $4, $5)',
        [tenantId, req.params.id, reminderDate, reminderText, req.user!.id])
    }
  }

  await audit(req, 'update', 'customer', customer.id,
    `edited customer ${customer.full_name}`)
  emitEvent('customer.updated', req.user, customer.id, customer.full_name)
  res.json(customer)
})

// Delete customer
router.delete('/:id', requirePermission('delete_customer'), async (req: AuthRequest, res) => {
  const tenantId = req.user!.tenant_id
  const existing = await pool.query(
    'SELECT full_name FROM customers WHERE id = $1 AND tenant_id = $2',
    [req.params.id, tenantId],
  )
  if (existing.rows.length === 0) return res.status(404).json({ error: 'not found' })
  await pool.query(
    'DELETE FROM customers WHERE id = $1 AND tenant_id = $2',
    [req.params.id, tenantId],
  )
  await audit(req, 'delete', 'customer', parseInt(req.params.id, 10),
    `deleted customer ${existing.rows[0]?.full_name || ''}`)
  emitEvent('customer.deleted', req.user, parseInt(req.params.id, 10),
    existing.rows[0]?.full_name || '')
  res.json({ success: true })
})

// Customer reminders
router.get('/:id/reminders', async (req: AuthRequest, res) => {
  const r = await pool.query(
    'SELECT * FROM reminders WHERE customer_id = $1 AND tenant_id = $2 ORDER BY created_at DESC',
    [req.params.id, req.user!.tenant_id],
  )
  res.json(r.rows)
})

// Transfer customers (admin)
router.post('/transfer', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'admin only' })
  const tenantId = req.user!.tenant_id
  const { customerIds, targetPlatform } = req.body
  for (const id of customerIds) {
    await pool.query(
      "UPDATE customers SET platform_name = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3",
      [targetPlatform, id, tenantId],
    )
  }
  res.json({ success: true })
})

// Change customer owner — admin only. Simpler than going through PUT /:id
// because the full-record update would otherwise need every required field.
router.patch('/:id/owner', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin') return res.status(403).json({ error: 'admin only' })
  const targetUserId = Number(req.body?.user_id)
  if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
    return res.status(400).json({ error: 'user_id غير صالح' })
  }
  const tenantId = req.user!.tenant_id
  const customerId = parseInt(req.params.id, 10)

  const target = await pool.query(
    'SELECT id, display_name FROM users WHERE id = $1 AND tenant_id = $2',
    [targetUserId, tenantId],
  )
  if (target.rows.length === 0) return res.status(400).json({ error: 'المستخدم الهدف غير موجود' })

  const result = await pool.query(
    'UPDATE customers SET user_id = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING full_name',
    [targetUserId, customerId, tenantId]
  )
  if (result.rows.length === 0) return res.status(404).json({ error: 'الزبون غير موجود' })
  const name = result.rows[0].full_name

  await audit(req, 'update', 'customer', customerId,
    `transferred ${name} to ${target.rows[0].display_name}`)
  emitEvent('customer.updated', req.user, customerId, name)
  res.json({ success: true, user_id: targetUserId })
})

export default router
