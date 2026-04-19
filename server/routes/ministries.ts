import { Router } from 'express'
import { pool } from '../db'
import { AuthRequest, authMiddleware, adminOnly } from '../middleware/auth'
import { audit } from '../audit'

const router = Router()
router.use(authMiddleware)

router.get('/', async (_req, res) => {
  const r = await pool.query('SELECT * FROM ministries ORDER BY name ASC')
  res.json(r.rows)
})

router.post('/', adminOnly, async (req: AuthRequest, res) => {
  try {
    const name = String(req.body.name || '').trim()
    if (!name) return res.json({ error: 'اسم فارغ' })
    await pool.query('INSERT INTO ministries (name) VALUES ($1) ON CONFLICT DO NOTHING', [name])
    await audit(req, 'create', 'ministry', null, `added ministry "${name}"`)
    res.json({ success: true })
  } catch (err: any) { res.json({ error: err.message }) }
})

router.delete('/:id', adminOnly, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10)
  const existing = await pool.query('SELECT name FROM ministries WHERE id = $1', [id])
  await pool.query('DELETE FROM ministries WHERE id = $1', [id])
  await audit(req, 'delete', 'ministry', id,
    `removed ministry "${existing.rows[0]?.name || ''}"`)
  res.json({ success: true })
})

export default router
