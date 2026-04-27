import { Router } from 'express'
import { pool } from '../db'
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res) => {
  const r = await pool.query(
    'SELECT * FROM platforms WHERE tenant_id = $1 ORDER BY name ASC',
    [req.user!.tenant_id],
  )
  res.json(r.rows)
})

router.post('/', adminOnly, async (req: AuthRequest, res) => {
  try {
    await pool.query(
      'INSERT INTO platforms (tenant_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user!.tenant_id, req.body.name],
    )
    res.json({ success: true })
  } catch (err: any) {
    console.error('[platforms.create]', err.message)
    res.status(500).json({ error: 'تعذر إنشاء المنصة' })
  }
})

router.delete('/:id', adminOnly, async (req: AuthRequest, res) => {
  await pool.query(
    'DELETE FROM platforms WHERE id = $1 AND tenant_id = $2',
    [req.params.id, req.user!.tenant_id],
  )
  res.json({ success: true })
})

export default router
