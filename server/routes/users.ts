import { Router } from 'express'
import crypto from 'crypto'
import { pool } from '../db'
import { AuthRequest, authMiddleware, adminOnly } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)
router.use(adminOnly)

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

router.get('/', async (_req, res) => {
  const r = await pool.query('SELECT * FROM users ORDER BY created_at ASC')
  res.json(r.rows)
})

router.post('/', async (req, res) => {
  const { username, password, display_name, role, permissions, platform_name } = req.body
  try {
    const r = await pool.query(
      'INSERT INTO users (username, password, display_name, role, permissions, platform_name) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [username, hashPassword(password), display_name, role || 'user', permissions || '{}', platform_name || '']
    )
    res.json(r.rows[0])
  } catch (err: any) {
    res.json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  const { display_name, password, permissions, platform_name } = req.body
  if (password) {
    await pool.query('UPDATE users SET display_name=$1, password=$2, permissions=$3, platform_name=$4 WHERE id=$5',
      [display_name, hashPassword(password), permissions, platform_name||'', req.params.id])
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
