import { Router } from 'express'
import { pool } from '../db'
import { AuthRequest, authMiddleware, adminOnly } from '../middleware/auth'
import { audit } from '../audit'
import { validate, NameOnlySchema } from '../schemas'
import { emitEvent } from '../events'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res) => {
  const r = await pool.query(
    'SELECT * FROM ministries WHERE tenant_id = $1 ORDER BY name ASC',
    [req.user!.tenant_id],
  )
  res.json(r.rows)
})

router.post('/', adminOnly, validate(NameOnlySchema), async (req: AuthRequest, res) => {
  try {
    const name = req.body.name.trim()
    await pool.query(
      'INSERT INTO ministries (tenant_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user!.tenant_id, name],
    )
    await audit(req, 'create', 'ministry', null, `added ministry "${name}"`)
    emitEvent('ministry.created', req.user, null, name)
    res.json({ success: true })
  } catch (err: any) {
    console.error('[ministries.create]', err.message)
    res.status(500).json({ error: 'تعذر إضافة الوزارة' })
  }
})

router.delete('/:id', adminOnly, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10)
  const existing = await pool.query(
    'SELECT name FROM ministries WHERE id = $1 AND tenant_id = $2',
    [id, req.user!.tenant_id],
  )
  await pool.query(
    'DELETE FROM ministries WHERE id = $1 AND tenant_id = $2',
    [id, req.user!.tenant_id],
  )
  await audit(req, 'delete', 'ministry', id,
    `removed ministry "${existing.rows[0]?.name || ''}"`)
  emitEvent('ministry.deleted', req.user, id, existing.rows[0]?.name || '')
  res.json({ success: true })
})

export default router
