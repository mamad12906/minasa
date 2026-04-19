import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { pool } from '../db'
import { AuthRequest, authMiddleware, adminOnly } from '../middleware/auth'
import { audit } from '../audit'

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

router.post('/', async (req: AuthRequest, res) => {
  const { username, password, display_name, role, permissions, platform_name } = req.body
  try {
    const hashed = bcrypt.hashSync(password, 10)
    const r = await pool.query(
      'INSERT INTO users (username, password, display_name, role, permissions, platform_name) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [username, hashed, display_name, role || 'user', permissions || '{}', platform_name || '']
    )
    await audit(req, 'create', 'user', r.rows[0].id,
      `created user ${username} (${display_name}) role=${role || 'user'}`)
    res.json(r.rows[0])
  } catch (err: any) {
    res.json({ error: err.message })
  }
})

router.put('/:id', async (req: AuthRequest, res) => {
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
  await audit(req, 'update', 'user', parseInt(req.params.id, 10),
    password ? 'updated user (password changed)' : 'updated user')
  res.json(r.rows[0])
})

router.delete('/:id', async (req: AuthRequest, res) => {
  const victim = await pool.query('SELECT username FROM users WHERE id = $1', [req.params.id])
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
  await audit(req, 'delete', 'user', parseInt(req.params.id, 10),
    `deleted user ${victim.rows[0]?.username || ''}`)
  res.json({ success: true })
})

/**
 * POST /api/users/:id/reset-password
 *
 * Admin generates a new random password for a user. The plaintext is returned
 * ONCE in the response and never stored. Admin is expected to communicate it
 * securely to the user, who can then change it.
 */
router.post('/:id/reset-password', async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const user = await pool.query('SELECT username, display_name FROM users WHERE id = $1', [id])
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'المستخدم غير موجود' })
    }
    const newPassword = crypto.randomBytes(6).toString('base64')
      .replace(/[+/=]/g, '').substring(0, 10)
    const hashed = bcrypt.hashSync(newPassword, 10)
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, id])
    await audit(req, 'reset_password', 'user', id,
      `admin reset password for ${user.rows[0].username}`)
    res.json({
      success: true,
      password: newPassword,
      username: user.rows[0].username,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
