import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { pool } from '../db'
import { generateToken } from '../middleware/auth'

const router = Router()

function sha256(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username])
  if (result.rows.length === 0) return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور خطأ' })

  const user = result.rows[0]
  let valid = false

  // Support bcrypt, SHA256, and plain text (auto-migrate)
  if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
    valid = bcrypt.compareSync(password, user.password)
  } else if (user.password === sha256(password)) {
    valid = true
    // Migrate to bcrypt
    const hashed = bcrypt.hashSync(password, 10)
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id])
  } else if (user.password === password) {
    valid = true
    // Migrate plain text to bcrypt
    const hashed = bcrypt.hashSync(password, 10)
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id])
  }

  if (!valid) return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور خطأ' })

  const token = generateToken(user)
  res.json({ token, user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role, permissions: user.permissions, platform_name: user.platform_name } })
})

export default router
