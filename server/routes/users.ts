import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db'
import { AuthRequest, authMiddleware, adminOnly } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)
router.use(adminOnly)

router.get('/', async (_req, res) => {
  const r = await pool.query(`
    SELECT u.*, COALESCE(c.count, 0)::int as customer_count
    FROM users u
    LEFT JOIN (SELECT user_id, COUNT(*) as count FROM customers GROUP BY user_id) c ON c.user_id = u.id
    ORDER BY u.created_at ASC
  `)
  res.json(r.rows)
})

router.post('/', async (req, res) => {
  const { username, password, display_name, role, permissions, platform_name } = req.body
  try {
    const hashed = bcrypt.hashSync(password, 10)
    const r = await pool.query(
      'INSERT INTO users (username, password, display_name, role, permissions, platform_name) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [username, hashed, display_name, role || 'user', permissions || '{}', platform_name || '']
    )
    res.json(r.rows[0])
  } catch (err: any) {
    res.json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  const { display_name, password, permissions, platform_name } = req.body
  if (password) {
    const hashed = bcrypt.hashSync(password, 10)
    await pool.query('UPDATE users SET display_name=$1, password=$2, permissions=$3, platform_name=$4 WHERE id=$5',
      [display_name, hashed, permissions, platform_name||'', req.params.id])
  } else {
    await pool.query('UPDATE users SET display_name=$1, permissions=$2, platform_name=$3 WHERE id=$4',
      [display_name, permissions, platform_name||'', req.params.id])
  }
  const r = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id])
  res.json(r.rows[0])
})

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
  res.json({ success: true })
})

export default router
