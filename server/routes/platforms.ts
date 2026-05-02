import { Router } from 'express'
import { pool } from '../db'
import { AuthRequest, authMiddleware, adminOnly } from '../middleware/auth'
import { validate, NameOnlySchema } from '../schemas'
import { audit } from '../audit'
import { emitEvent } from '../events'

const router = Router()
router.use(authMiddleware)

router.get('/', async (_req, res) => {
  const r = await pool.query('SELECT * FROM platforms ORDER BY name ASC')
  res.json(r.rows)
})

router.post('/', adminOnly, validate(NameOnlySchema), async (req: AuthRequest, res) => {
  try {
    const name = req.body.name.trim()
    // RETURNING * is empty when ON CONFLICT skipped the insert — distinguish
    // a genuine create from a duplicate so the client can show a useful
    // error instead of believing it succeeded.
    const r = await pool.query(
      'INSERT INTO platforms (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *',
      [name],
    )
    if (r.rowCount === 0) {
      return res.status(409).json({ error: 'هذه المنصة موجودة بالفعل' })
    }
    await audit(req, 'create', 'platform', r.rows[0].id, `added platform "${name}"`)
    emitEvent('platform.created', req.user, r.rows[0].id, name)
    res.json({ success: true })
  } catch (err: any) {
    console.error('[platforms.create]', err.message)
    res.status(500).json({ error: 'تعذر إنشاء المنصة' })
  }
})

router.delete('/:id', adminOnly, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10)
  const existing = await pool.query('SELECT name FROM platforms WHERE id = $1', [id])
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'المنصة غير موجودة' })
  }
  await pool.query('DELETE FROM platforms WHERE id = $1', [id])
  await audit(req, 'delete', 'platform', id,
    `removed platform "${existing.rows[0]?.name || ''}"`)
  emitEvent('platform.deleted', req.user, id, existing.rows[0]?.name || '')
  res.json({ success: true })
})

export default router
