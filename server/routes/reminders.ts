import { Router } from 'express'
import { pool } from '../db'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import {
  validate,
  ReminderDoneSchema,
  ReminderPostponeSchema,
  ReminderRemindSchema,
  UpdateReminderSchema,
} from '../schemas'
import { audit } from '../audit'
import { emitEvent } from '../events'
import { canAccessUser } from '../utils/scope'

const router = Router()
router.use(authMiddleware)

/**
 * Fetch the customer name + owner behind a reminder. Owner is needed so
 * mutating handlers can scope-check before they touch the row — without
 * this, a regular user holding `manage_reminders` could close any
 * customer's reminders across the whole system.
 */
async function reminderCustomerInfo(
  reminderId: number | string,
): Promise<{ name: string; ownerId: number | null } | null> {
  try {
    const r = await pool.query(
      `SELECT c.full_name, c.user_id FROM reminders r
       JOIN customers c ON c.id = r.customer_id WHERE r.id = $1`,
      [reminderId],
    )
    if (r.rows.length === 0) return null
    return { name: r.rows[0].full_name ?? '', ownerId: r.rows[0].user_id ?? null }
  } catch { return null }
}

/** Backwards-compat shim — name only. */
async function reminderCustomerName(reminderId: number | string): Promise<string> {
  const info = await reminderCustomerInfo(reminderId)
  return info?.name ?? ''
}

// Active reminders (due today or past)
router.get('/active', async (req: AuthRequest, res) => {
  const today = new Date().toISOString().split('T')[0]
  let where = 'WHERE r.is_done = 0 AND r.is_postponed = 0 AND r.reminder_date <= $1'
  const params: any[] = [today]
  // Scope rule mirrors customers.ts: admin = all, subadmin = self + children,
  // user = self.
  const role = req.user!.role
  if (role === 'subadmin') {
    where += ' AND (c.user_id = $2 OR c.user_id IN (SELECT id FROM users WHERE parent_id = $2))'
    params.push(req.user!.id)
  } else if (role !== 'admin') {
    where += ' AND c.user_id = $2'
    params.push(req.user!.id)
  }
  const r = await pool.query(
    `SELECT r.*, c.full_name, c.phone_number, c.platform_name, c.ministry_name, c.status_note, c.user_id,
            COALESCE(u.display_name, u.username, '') AS created_by_name
     FROM reminders r
     JOIN customers c ON c.id = r.customer_id
     LEFT JOIN users u ON u.id = r.user_id
     ${where} ORDER BY r.reminder_date ASC`,
    params,
  )
  res.json(r.rows)
})

// All reminders
router.get('/all', async (req: AuthRequest, res) => {
  let where = '1=1'
  const params: any[] = []
  const role = req.user!.role
  if (role === 'subadmin') {
    where = '(c.user_id = $1 OR c.user_id IN (SELECT id FROM users WHERE parent_id = $1))'
    params.push(req.user!.id)
  } else if (role !== 'admin') {
    where = 'c.user_id = $1'
    params.push(req.user!.id)
  }
  const r = await pool.query(
    `SELECT r.*, c.full_name, c.phone_number, c.platform_name, c.ministry_name, c.status_note, c.user_id,
            COALESCE(u.display_name, u.username, '') AS created_by_name
     FROM reminders r
     JOIN customers c ON c.id = r.customer_id
     LEFT JOIN users u ON u.id = r.user_id
     WHERE ${where} ORDER BY r.is_done ASC, r.reminder_date ASC`,
    params,
  )
  res.json(r.rows)
})

/**
 * Resolve a reminder to its owning customer + scope-check the caller.
 * Returns the customer info on success, or sends a 404 and returns null
 * when the reminder doesn't exist or the caller can't access the
 * underlying customer. Caller must `return` on null.
 */
async function gateReminder(
  reminderId: number,
  req: AuthRequest,
  res: any,
): Promise<{ name: string; ownerId: number | null } | null> {
  const info = await reminderCustomerInfo(reminderId)
  if (!info) {
    res.status(404).json({ error: 'التذكير غير موجود' })
    return null
  }
  if (!await canAccessUser(req.user!, info.ownerId)) {
    // Same response shape as not-found to avoid leaking existence.
    res.status(404).json({ error: 'التذكير غير موجود' })
    return null
  }
  return info
}

// Mark done
router.post('/:id/done', requirePermission('manage_reminders'), validate(ReminderDoneSchema), async (req: AuthRequest, res) => {
  const { handled_by, handle_method } = req.body
  const id = parseInt(req.params.id, 10)
  const info = await gateReminder(id, req, res)
  if (!info) return
  await pool.query("UPDATE reminders SET is_done = 1, handled_by = $1, handle_method = $2, handled_at = NOW()::text WHERE id = $3", [handled_by||'', handle_method||'', id])
  await audit(req, 'update', 'reminder', id, `marked reminder done (${info.name})`)
  emitEvent('reminder.done', req.user, id, info.name)
  res.json({ success: true })
})

// Postpone
router.post('/:id/postpone', requirePermission('manage_reminders'), validate(ReminderPostponeSchema), async (req: AuthRequest, res) => {
  const { new_date, reason } = req.body
  const id = parseInt(req.params.id, 10)
  const info = await gateReminder(id, req, res)
  if (!info) return
  const r = await pool.query('SELECT * FROM reminders WHERE id = $1', [id])
  const orig = r.rows[0]?.original_date || r.rows[0]?.reminder_date
  await pool.query("UPDATE reminders SET reminder_date = $1, is_postponed = 1, postpone_reason = $2, original_date = $3 WHERE id = $4", [new_date, reason, orig, id])
  await audit(req, 'update', 'reminder', id,
    `postponed reminder to ${new_date} (${info.name})${reason ? ` — ${reason}` : ''}`)
  emitEvent('reminder.updated', req.user, id, info.name)
  res.json({ success: true })
})

// Re-remind
router.post('/:id/reremind', requirePermission('manage_reminders'), validate(ReminderRemindSchema), async (req: AuthRequest, res) => {
  const { new_date, reason } = req.body
  const id = parseInt(req.params.id, 10)
  const info = await gateReminder(id, req, res)
  if (!info) return
  const r = await pool.query('SELECT * FROM reminders WHERE id = $1', [id])
  const orig = r.rows[0]
  if (orig) {
    await pool.query('INSERT INTO reminders (customer_id, reminder_date, reminder_text, original_date, is_postponed, postpone_reason, user_id) VALUES ($1,$2,$3,$4,1,$5,$6)',
      [orig.customer_id, new_date, orig.reminder_text, orig.reminder_date, reason, req.user!.id])
    await audit(req, 'create', 'reminder', null,
      `re-reminded for ${new_date} (${info.name})`)
    emitEvent('reminder.created', req.user, null, info.name)
  }
  res.json({ success: true })
})

// Update reminder (date + text)
router.put('/:id', requirePermission('manage_reminders'), validate(UpdateReminderSchema), async (req: AuthRequest, res) => {
  const { reminder_date, reminder_text } = req.body
  const id = parseInt(req.params.id, 10)
  const info = await gateReminder(id, req, res)
  if (!info) return
  const sets: string[] = []
  const params: any[] = []
  let i = 1
  if (reminder_date !== undefined) {
    sets.push(`reminder_date = $${i++}`)
    params.push(reminder_date)
  }
  if (reminder_text !== undefined) {
    sets.push(`reminder_text = $${i++}`)
    params.push(reminder_text)
  }
  if (sets.length === 0) return res.json({ success: true })
  params.push(id)
  await pool.query(`UPDATE reminders SET ${sets.join(', ')} WHERE id = $${i}`, params)
  const bits: string[] = []
  if (reminder_date !== undefined) bits.push(`date=${reminder_date}`)
  if (reminder_text !== undefined) bits.push(`text="${(reminder_text as string).slice(0, 60)}"`)
  await audit(req, 'update', 'reminder', id,
    `edited reminder (${info.name}) — ${bits.join(', ')}`)
  emitEvent('reminder.updated', req.user, id, info.name)
  res.json({ success: true })
})

// Delete
router.delete('/:id', requirePermission('manage_reminders'), async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10)
  const info = await gateReminder(id, req, res)
  if (!info) return
  await pool.query('DELETE FROM reminders WHERE id = $1', [id])
  await audit(req, 'delete', 'reminder', id, `deleted reminder (${info.name})`)
  emitEvent('reminder.deleted', req.user, id, info.name)
  res.json({ success: true })
})

export default router
