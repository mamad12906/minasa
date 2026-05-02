import { Router } from 'express'
import { pool } from '../db'
import { AuthRequest, authMiddleware, adminOnly } from '../middleware/auth'
import { validate, NameOnlySchema } from '../schemas'
import { audit } from '../audit'
import { emitEvent } from '../events'

const router = Router()
router.use(authMiddleware)

router.get('/', async (_req, res) => {
  const r = await pool.query('SELECT * FROM categories ORDER BY name ASC')
  res.json(r.rows)
})

router.post('/', adminOnly, validate(NameOnlySchema), async (req: AuthRequest, res) => {
  try {
    const name = req.body.name.trim()
    const r = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *',
      [name],
    )
    if (r.rowCount === 0) {
      return res.status(409).json({ error: 'هذا التصنيف موجود بالفعل' })
    }
    await audit(req, 'create', 'category', r.rows[0].id, `added category "${name}"`)
    emitEvent('category.created', req.user, r.rows[0].id, name)
    res.json({ success: true })
  } catch (err: any) {
    console.error('[categories.create]', err.message)
    res.status(500).json({ error: 'تعذر إنشاء التصنيف' })
  }
})

router.delete('/:id', adminOnly, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10)
  const existing = await pool.query('SELECT name FROM categories WHERE id = $1', [id])
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'التصنيف غير موجود' })
  }
  await pool.query('DELETE FROM categories WHERE id = $1', [id])
  await audit(req, 'delete', 'category', id,
    `removed category "${existing.rows[0]?.name || ''}"`)
  emitEvent('category.deleted', req.user, id, existing.rows[0]?.name || '')
  res.json({ success: true })
})

export default router
