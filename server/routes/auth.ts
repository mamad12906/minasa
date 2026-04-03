import { Router } from 'express'
import { pool } from '../db'
import { generateToken } from '../middleware/auth'

const router = Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password])
  if (result.rows.length === 0) return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور خطأ' })
  const user = result.rows[0]
  const token = generateToken(user)
  res.json({ token, user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role, permissions: user.permissions, platform_name: user.platform_name } })
})

export default router
