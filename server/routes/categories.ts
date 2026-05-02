import { Router } from 'express'
import { pool } from '../db'
import { authMiddleware, adminOnly } from '../middleware/auth'
import { validate, NameOnlySchema } from '../schemas'

const router = Router()
router.use(authMiddleware)

router.get('/', async (_req, res) => {
  const r = await pool.query('SELECT * FROM categories ORDER BY name ASC')
  res.json(r.rows)
})

router.post('/', adminOnly, validate(NameOnlySchema), async (req, res) => {
  try {
    const name = req.body.name.trim()
    const r = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *',
      [name],
    )
    if (r.rowCount === 0) {
      return res.status(409).json({ error: 'هذا التصنيف موجود بالفعل' })
    }
    res.json({ success: true })
  } catch (err: any) {
    console.error('[categories.create]', err.message)
    res.status(500).json({ error: 'تعذر إنشاء التصنيف' })
  }
})

router.delete('/:id', adminOnly, async (req, res) => {
  const r = await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id])
  if (r.rowCount === 0) {
    return res.status(404).json({ error: 'التصنيف غير موجود' })
  }
  res.json({ success: true })
})

export default router
