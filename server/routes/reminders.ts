import { Router } from 'express'
import { pool } from '../db'
import { AuthRequest, authMiddleware } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

// Active reminders (due today or past)
router.get('/active', async (req: AuthRequest, res) => {
  const today = new Date().toISOString().split('T')[0]
  let where = 'WHERE r.is_done = 0 AND r.is_postponed = 0 AND r.reminder_date <= $1'
  const params: any[] = [today]
  if (req.user!.role !== 'admin') {
    where += ' AND c.user_id = $2'
    params.push(req.user!.id)
  }
  const r = await pool.query(`SELECT r.*, c.full_name, c.phone_number, c.platform_name, c.ministry_name, c.status_note, c.user_id FROM reminders r JOIN customers c ON c.id = r.customer_id ${where} ORDER BY r.reminder_date ASC`, params)
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
  const r = await pool.query(`SELECT r.*, c.full_name, c.phone_number, c.platform_name, c.ministry_name, c.status_note, c.user_id FROM reminders r JOIN customers c ON c.id = r.customer_id WHERE ${where} ORDER BY r.is_done ASC, r.reminder_date ASC`, params)
  res.json(r.rows)
})

// Mark done
router.post('/:id/done', async (req, res) => {
  const { handled_by, handle_method } = req.body
  await pool.query("UPDATE reminders SET is_done = 1, handled_by = $1, handle_method = $2, handled_at = NOW()::text WHERE id = $3", [handled_by||'', handle_method||'', req.params.id])
  res.json({ success: true })
})

// Postpone
router.post('/:id/postpone', async (req, res) => {
  const { new_date, reason } = req.body
  const r = await pool.query('SELECT * FROM reminders WHERE id = $1', [req.params.id])
  const orig = r.rows[0]?.original_date || r.rows[0]?.reminder_date
  await pool.query("UPDATE reminders SET reminder_date = $1, is_postponed = 1, postpone_reason = $2, original_date = $3 WHERE id = $4", [new_date, reason, orig, req.params.id])
  res.json({ success: true })
})

// Re-remind
router.post('/:id/reremind', async (req, res) => {
  const { new_date, reason } = req.body
  const r = await pool.query('SELECT * FROM reminders WHERE id = $1', [req.params.id])
  const orig = r.rows[0]
  if (orig) {
    await pool.query('INSERT INTO reminders (customer_id, reminder_date, reminder_text, original_date, is_postponed, postpone_reason) VALUES ($1,$2,$3,$4,1,$5)',
      [orig.customer_id, new_date, orig.reminder_text, orig.reminder_date, reason])
  }
  res.json({ success: true })
})

// Update reminder (date + text)
router.put('/:id', async (req, res) => {
  const { reminder_date, reminder_text } = req.body
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
  params.push(req.params.id)
  await pool.query(`UPDATE reminders SET ${sets.join(', ')} WHERE id = $${i}`, params)
  res.json({ success: true })
})

// Delete
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM reminders WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

export default router
