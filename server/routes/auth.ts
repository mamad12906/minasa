import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { pool } from '../db'
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth'
import { emitEvent } from '../events'

const router = Router()

function sha256(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function clientIp(req: any): string {
  return (req.ip || req.socket?.remoteAddress || '').toString()
}

// Per-IP brute-force guard on /login. Sliding 60s window; a sweep drops stale
// buckets so the map can't grow unbounded.
const LOGIN_WINDOW_MS = 60_000
const LOGIN_MAX = 5
const loginBuckets = new Map<string, { count: number; reset: number }>()
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of loginBuckets) {
    if (entry.reset < now) loginBuckets.delete(ip)
  }
}, LOGIN_WINDOW_MS * 5).unref()

function loginLimit(ip: string): boolean {
  const now = Date.now()
  const bucket = loginBuckets.get(ip)
  if (!bucket || now >= bucket.reset) {
    loginBuckets.set(ip, { count: 1, reset: now + LOGIN_WINDOW_MS })
    return true
  }
  if (bucket.count >= LOGIN_MAX) return false
  bucket.count++
  return true
}

async function logLogin(userId: number | null, username: string, action: string, details: string, ip: string, tenantId: number = 1) {
  try {
    await pool.query(
      `INSERT INTO audit_log (tenant_id, user_id, username, action, entity_type, details, ip)
       VALUES ($1, $2, $3, $4, 'auth', $5, $6)`,
      [tenantId, userId, username, action, details, ip],
    )
  } catch (e) {
    console.error('[auth.audit]', (e as Error).message)
  }
}

router.post('/login', async (req, res) => {
  const { username, password, tenant_slug } = req.body
  const ip = clientIp(req)
  if (!loginLimit(ip)) {
    return res.status(429).json({ error: 'محاولات دخول كثيرة، حاول بعد دقيقة' })
  }
  // Resolve tenant from slug — defaults to 'default' so existing mobile
  // clients (which don't yet send tenant_slug) still authenticate against
  // the original single-tenant deployment.
  const slug = (tenant_slug || 'default').toString().trim().toLowerCase()
  const tenantRow = await pool.query(
    "SELECT id FROM tenants WHERE slug = $1 AND status = 'active' LIMIT 1",
    [slug],
  )
  if (tenantRow.rows.length === 0) {
    await logLogin(null, String(username || ''), 'login_failed', `unknown tenant: ${slug}`, ip)
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور خطأ' })
  }
  const tenantId = tenantRow.rows[0].id as number
  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1 AND tenant_id = $2',
    [username, tenantId],
  )
  if (result.rows.length === 0) {
    await logLogin(null, String(username || ''), 'login_failed', 'unknown user', ip)
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور خطأ' })
  }

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

  if (!valid) {
    await logLogin(user.id, user.username, 'login_failed', 'bad password', ip, user.tenant_id)
    emitEvent('auth.login_failed', { id: user.id, username: user.username },
      user.id, user.display_name || user.username, ip)
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور خطأ' })
  }

  await logLogin(user.id, user.username, 'login', '', ip, user.tenant_id)
  emitEvent('auth.login', { id: user.id, username: user.username },
    user.id, user.display_name || user.username, ip)
  const token = generateToken(user)
  res.json({ token, user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role, permissions: user.permissions, platform_name: user.platform_name, tenant_id: user.tenant_id } })
})

// Return the authenticated user's current profile — specifically so mobile
// clients can refresh stored permissions after an admin grants them new
// access. Biometric unlock otherwise hands back the profile snapshotted at
// enrollment time, which goes stale the moment admin edits perms.
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const r = await pool.query(
    'SELECT id, username, display_name, role, permissions, platform_name, tenant_id FROM users WHERE id = $1 AND tenant_id = $2',
    [req.user!.id, req.user!.tenant_id],
  )
  if (r.rows.length === 0) return res.status(404).json({ error: 'الحساب غير موجود' })
  res.json(r.rows[0])
})

export default router
