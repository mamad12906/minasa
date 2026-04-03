import { Router } from 'express'
import { pool } from '../db'
import { authMiddleware, adminOnly } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

router.get('/', async (_req, res) => {
  const r = await pool.query('SELECT * FROM categories ORDER BY name ASC')
  res.json(r.rows)
})

router.post('/', adminOnly, async (req, res) => {
  try {
    await pool.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING', [req.body.name])
    res.json({ success: true })
  } catch (err: any) { res.json({ error: err.message }) }
})

router.delete('/:id', adminOnly, async (req, res) => {
  await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

export default router
