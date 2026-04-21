import { Router } from 'express'
import { pool } from '../db'
import { AuthRequest, authMiddleware } from '../middleware/auth'
import { audit } from '../audit'
import { emitEvent } from '../events'

const router = Router()
router.use(authMiddleware)

/** Fetch the customer name behind a reminder for audit/event logging. */
async function reminderCustomerName(reminderId: number | string): Promise<string> {
  try {
    const r = await pool.query(
      `SELECT c.full_name FROM reminders r
       JOIN customers c ON c.id = r.customer_id WHERE r.id = $1`,
      [reminderId],
    )
    return r.rows[0]?.full_name ?? ''
  } catch { return '' }
}

// Active reminders (due today or past)
router.get('/active', async (req: AuthRequest, res) => {
  const today = new Date().toISOString().split('T')[0]
  let where = 'WHERE r.is_done = 0 AND r.is_postponed = 0 AND r.reminder_date <= $1'
  const params: any[] = [today]
  if (req.user!.role !== 'admin') {
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
  if (req.user!.role !== 'admin') {
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

// Mark done
router.post('/:id/done', async (req: AuthRequest, res) => {
  const { handled_by, handle_method } = req.body
  const id = parseInt(req.params.id, 10)
  const name = await reminderCustomerName(id)
  await pool.query("UPDATE reminders SET is_done = 1, handled_by = $1, handle_method = $2, handled_at = NOW()::text WHERE id = $3", [handled_by||'', handle_method||'', id])
  await audit(req, 'update', 'reminder', id, `marked reminder done (${name})`)
  emitEvent('reminder.done', req.user, id, name)
  res.json({ success: true })
})

// Postpone
router.post('/:id/postpone', async (req: AuthRequest, res) => {
  const { new_date, reason } = req.body
  const id = parseInt(req.params.id, 10)
  const r = await pool.query('SELECT * FROM reminders WHERE id = $1', [id])
  const orig = r.rows[0]?.original_date || r.rows[0]?.reminder_date
  await pool.query("UPDATE reminders SET reminder_date = $1, is_postponed = 1, postpone_reason = $2, original_date = $3 WHERE id = $4", [new_date, reason, orig, id])
  const name = await reminderCustomerName(id)
  await audit(req, 'update', 'reminder', id,
    `postponed reminder to ${new_date} (${name})${reason ? ` — ${reason}` : ''}`)
  emitEvent('reminder.updated', req.user, id, name)
  res.json({ success: true })
})

// Re-remind
router.post('/:id/reremind', async (req: AuthRequest, res) => {
  const { new_date, reason } = req.body
  const r = await pool.query('SELECT * FROM reminders WHERE id = $1', [req.params.id])
  const orig = r.rows[0]
  if (orig) {
    await pool.query('INSERT INTO reminders (customer_id, reminder_date, reminder_text, original_date, is_postponed, postpone_reason, user_id) VALUES ($1,$2,$3,$4,1,$5,$6)',
      [orig.customer_id, new_date, orig.reminder_text, orig.reminder_date, reason, req.user!.id])
    const name = await reminderCustomerName(req.params.id)
    await audit(req, 'create', 'reminder', null,
      `re-reminded for ${new_date} (${name})`)
    emitEvent('reminder.created', req.user, null, name)
  }
  res.json({ success: true })
})

// Update reminder (date + text)
router.put('/:id', async (req: AuthRequest, res) => {
  const { reminder_date, reminder_text } = req.body
  const id = parseInt(req.params.id, 10)
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
  const name = await reminderCustomerName(id)
  const bits: string[] = []
  if (reminder_date !== undefined) bits.push(`date=${reminder_date}`)
  if (reminder_text !== undefined) bits.push(`text="${(reminder_text as string).slice(0, 60)}"`)
  await audit(req, 'update', 'reminder', id,
    `edited reminder (${name}) — ${bits.join(', ')}`)
  emitEvent('reminder.updated', req.user, id, name)
  res.json({ success: true })
})

// Delete
router.delete('/:id', async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10)
  const name = await reminderCustomerName(id)
  await pool.query('DELETE FROM reminders WHERE id = $1', [id])
  await audit(req, 'delete', 'reminder', id, `deleted reminder (${name})`)
  emitEvent('reminder.deleted', req.user, id, name)
  res.json({ success: true })
})

export default router
