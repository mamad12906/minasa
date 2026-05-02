import { Router } from 'express'
import { pool } from '../db'
import { authMiddleware, adminOnly } from '../middleware/auth'
import { validate, NameOnlySchema } from '../schemas'

const router = Router()
router.use(authMiddleware)

router.get('/', async (_req, res) => {
  const r = await pool.query('SELECT * FROM platforms ORDER BY name ASC')
  res.json(r.rows)
})

router.post('/', adminOnly, validate(NameOnlySchema), async (req, res) => {
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
    res.json({ success: true })
  } catch (err: any) {
    console.error('[platforms.create]', err.message)
    res.status(500).json({ error: 'تعذر إنشاء المنصة' })
  }
})

router.delete('/:id', adminOnly, async (req, res) => {
  const r = await pool.query('DELETE FROM platforms WHERE id = $1', [req.params.id])
  if (r.rowCount === 0) {
    return res.status(404).json({ error: 'المنصة غير موجودة' })
  }
  res.json({ success: true })
})

export default router
