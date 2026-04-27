import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db'
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/
const RESERVED_SLUGS = new Set([
  'default', 'admin', 'api', 'www', 'app', 'auth', 'public', 'static', 'assets',
])

/**
 * POST /api/tenants/signup
 *
 * Public endpoint — creates a new tenant and its first admin user atomically.
 * Body: { tenant_name, tenant_slug, admin_username, admin_password, admin_display_name? }
 *
 * The slug becomes the tenant's permanent identifier on the login form. We
 * keep the create+admin insert in a single transaction so a failed admin
 * creation doesn't leave an orphan tenant row behind.
 */
router.post('/signup', async (req, res) => {
  const {
    tenant_name,
    tenant_slug,
    admin_username,
    admin_password,
    admin_display_name,
  } = req.body || {}

  // Basic validation — names trimmed, slug shape-checked, password length.
  const name = String(tenant_name || '').trim()
  const slug = String(tenant_slug || '').trim().toLowerCase()
  const username = String(admin_username || '').trim()
  const password = String(admin_password || '')
  const displayName = String(admin_display_name || '').trim() || username

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: 'اسم الحساب يجب أن يكون بين 2 و 80 حرفاً' })
  }
  if (!SLUG_RE.test(slug) || RESERVED_SLUGS.has(slug)) {
    return res.status(400).json({ error: 'المعرّف غير صالح (3-32 حرفاً، أرقام وحروف لاتينية وشرطات فقط، ولا يكون محجوزاً)' })
  }
  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'اسم المستخدم يجب أن يكون بين 3 و 30 حرفاً' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Slug uniqueness — let the UNIQUE constraint handle the race; pre-check
    // gives a friendlier error for the common case.
    const existing = await client.query('SELECT id FROM tenants WHERE slug = $1', [slug])
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'هذا المعرّف مستخدم بالفعل' })
    }

    const tenantInsert = await client.query(
      `INSERT INTO tenants (name, slug, plan, status)
       VALUES ($1, $2, 'free', 'active') RETURNING id, name, slug, plan, status`,
      [name, slug],
    )
    const tenant = tenantInsert.rows[0]

    const hashed = bcrypt.hashSync(password, 10)
    const adminInsert = await client.query(
      `INSERT INTO users (tenant_id, username, password, display_name, role, permissions, platform_name)
       VALUES ($1, $2, $3, $4, 'admin', '{}', '')
       RETURNING id, username, display_name, role, permissions, platform_name, tenant_id, password_version`,
      [tenant.id, username, hashed, displayName],
    )
    const admin = adminInsert.rows[0]

    await client.query('COMMIT')

    const token = generateToken(admin)
    return res.status(201).json({
      token,
      tenant,
      user: {
        id: admin.id,
        username: admin.username,
        display_name: admin.display_name,
        role: admin.role,
        permissions: admin.permissions,
        platform_name: admin.platform_name,
        tenant_id: admin.tenant_id,
      },
    })
  } catch (err: any) {
    try { await client.query('ROLLBACK') } catch { /* ignore */ }
    console.error('[tenants.signup]', err.message)
    return res.status(500).json({ error: 'تعذر إنشاء الحساب، حاول مجدداً' })
  } finally {
    client.release()
  }
})

/**
 * GET /api/tenants/me
 *
 * Returns the authenticated user's tenant (name, slug, plan, status). Used
 * by clients to display tenant info in the UI.
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const r = await pool.query(
    'SELECT id, name, slug, plan, status, created_at FROM tenants WHERE id = $1',
    [req.user!.tenant_id],
  )
  if (r.rows.length === 0) return res.status(404).json({ error: 'tenant غير موجود' })
  res.json(r.rows[0])
})

export default router
