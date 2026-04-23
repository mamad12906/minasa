import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { pool } from '../db'
import { AuthRequest, authMiddleware, adminOnly, invalidatePwdVerCache, invalidatePermsCache } from '../middleware/auth'
import { audit } from '../audit'
import { validate, CreateUserSchema, UpdateUserSchema } from '../schemas'
import { emitEvent } from '../events'
import { snapshot as presenceSnapshot } from '../presence'

const router = Router()
router.use(authMiddleware)
// NOTE: adminOnly is intentionally per-route rather than router-wide so
// subadmins can list their own sub-users. All write routes below still
// gate with their own check (admin OR subadmin-with-permission).

/**
 * GET /api/users/online — map of userId → last-seen ms since epoch.
 * Admin-only presence map.
 */
router.get('/online', adminOnly, async (_req, res) => {
  res.json(presenceSnapshot())
})

router.get('/', async (req: AuthRequest, res) => {
  const role = req.user!.role
  if (role === 'admin') {
    const r = await pool.query(`
      SELECT u.*, COALESCE(c.count, 0)::int as customer_count
      FROM users u
      LEFT JOIN (SELECT user_id, COUNT(*) as count FROM customers GROUP BY user_id) c ON c.user_id = u.id
      ORDER BY u.created_at ASC
    `)
    return res.json(r.rows)
  }
  if (role === 'subadmin') {
    // Subadmin sees themselves + every user they own (parent_id = self).
    const r = await pool.query(
      `SELECT u.*, COALESCE(c.count, 0)::int as customer_count
       FROM users u
       LEFT JOIN (SELECT user_id, COUNT(*) as count FROM customers GROUP BY user_id) c ON c.user_id = u.id
       WHERE u.id = $1 OR u.parent_id = $1
       ORDER BY u.created_at ASC`,
      [req.user!.id],
    )
    return res.json(r.rows)
  }
  return res.status(403).json({ error: 'صلاحية الأدمن فقط' })
})

/**
 * Delegation rule — a subadmin can only grant permissions they themselves
 * hold. Rewrites the caller's incoming permissions JSON stripping any key
 * they don't possess. Admin bypasses this entirely.
 */
function filterGrantablePermissions(
  callerRole: string,
  callerPerms: Record<string, boolean> | undefined,
  incomingJson: string | undefined,
): string {
  if (callerRole === 'admin') return incomingJson ?? '{}'
  const ownPerms = callerPerms ?? {}
  let incoming: Record<string, unknown> = {}
  try { incoming = JSON.parse(incomingJson || '{}') } catch { incoming = {} }
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(incoming)) {
    if (v === true) {
      // Only allow setting a key to true if the caller also has it.
      if (ownPerms[k] === true) out[k] = true
    } else {
      out[k] = false
    }
  }
  return JSON.stringify(out)
}

router.post('/', validate(CreateUserSchema), async (req: AuthRequest, res) => {
  const { username, password, display_name, role, permissions, platform_name, parent_id } = req.body
  // Authorization: admin does anything; subadmin can create regular users
  // under themselves only IF they hold the create_users permission key.
  const callerRole = req.user!.role
  if (callerRole !== 'admin') {
    if (callerRole !== 'subadmin' || req.user!.permissions?.create_users !== true) {
      return res.status(403).json({ error: 'ليس لديك صلاحية إنشاء مستخدمين' })
    }
    if (role && role !== 'user') {
      return res.status(403).json({ error: 'يمكنك إنشاء مستخدمين عاديين فقط' })
    }
  }
  try {
    const hashed = bcrypt.hashSync(password, 10)
    // Assign parent: admin may pass parent_id explicitly; subadmin is always
    // forced to self so they can't plant users under someone else.
    const effectiveParent = callerRole === 'admin'
      ? (parent_id ?? req.user!.id)
      : req.user!.id
    const filteredPerms = filterGrantablePermissions(
      callerRole, req.user!.permissions, permissions)
    const r = await pool.query(
      'INSERT INTO users (username, password, display_name, role, permissions, platform_name, parent_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [username, hashed, display_name, role || 'user', filteredPerms, platform_name || '', effectiveParent],
    )
    await audit(req, 'create', 'user', r.rows[0].id,
      `created user ${username} (${display_name}) role=${role || 'user'}`)
    emitEvent('user.created', req.user, r.rows[0].id, display_name)
    res.json(r.rows[0])
  } catch (err: any) {
    res.json({ error: err.message })
  }
})

router.put('/:id', validate(UpdateUserSchema), async (req: AuthRequest, res) => {
  const { display_name, password, role, platform_name, parent_id } = req.body
  let { permissions } = req.body
  const id = parseInt(req.params.id, 10)
  // Subadmin gate: can only edit their own sub-users, and only if the
  // edit_users permission is granted. Role/parent changes are blocked for
  // them to prevent self-promotion or reparenting outside the hierarchy.
  const callerRole = req.user!.role
  if (callerRole !== 'admin') {
    if (callerRole !== 'subadmin' || req.user!.permissions?.edit_users !== true) {
      return res.status(403).json({ error: 'ليس لديك صلاحية تعديل مستخدمين' })
    }
    const target = await pool.query('SELECT parent_id FROM users WHERE id = $1', [id])
    if (target.rows[0]?.parent_id !== req.user!.id) {
      return res.status(403).json({ error: 'لا يمكنك تعديل هذا المستخدم' })
    }
    if (role || parent_id !== undefined) {
      return res.status(403).json({ error: 'لا يمكنك تغيير الدور أو الارتباط' })
    }
    // Delegation rule: subadmin can't grant permissions they don't own.
    permissions = filterGrantablePermissions(
      callerRole, req.user!.permissions, permissions)
  }
  // Build the dynamic UPDATE. Optional fields (role, parent_id) only get
  // written when the caller explicitly supplies them.
  const sets: string[] = ['display_name=$1', 'permissions=$2', 'platform_name=$3']
  const params: any[] = [display_name, permissions, platform_name || '']
  let i = 4
  if (password) {
    const hashed = bcrypt.hashSync(password, 10)
    sets.push(`password=$${i++}`)
    params.push(hashed)
    sets.push('password_version = password_version + 1')
  }
  if (role) {
    sets.push(`role=$${i++}`)
    params.push(role)
  }
  if (parent_id !== undefined) {
    // Accept null (top-level) or any integer. Admin is trusted not to
    // create cycles; phase 3 will add server-side cycle check.
    sets.push(`parent_id=$${i++}`)
    params.push(parent_id)
  }
  params.push(id)
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id=$${i}`, params)
  if (password) invalidatePwdVerCache(id)
  // Permissions cache keyed by user id — drop it so requirePermission()
  // on the next request fetches fresh from the DB.
  invalidatePermsCache(id)
  const r = await pool.query('SELECT * FROM users WHERE id = $1', [id])
  await audit(req, 'update', 'user', id,
    password ? 'updated user (password changed)' : 'updated user')
  emitEvent('user.updated', req.user, r.rows[0]?.id ?? null,
    r.rows[0]?.display_name || '')
  res.json(r.rows[0])
})

router.delete('/:id', async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id, 10)
  const callerRole = req.user!.role
  if (callerRole !== 'admin') {
    if (callerRole !== 'subadmin' || req.user!.permissions?.delete_users !== true) {
      return res.status(403).json({ error: 'ليس لديك صلاحية حذف مستخدمين' })
    }
    const target = await pool.query('SELECT parent_id FROM users WHERE id = $1', [id])
    if (target.rows[0]?.parent_id !== req.user!.id) {
      return res.status(403).json({ error: 'لا يمكنك حذف هذا المستخدم' })
    }
  }
  const victim = await pool.query('SELECT username FROM users WHERE id = $1', [req.params.id])
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
  invalidatePermsCache(parseInt(req.params.id, 10))
  invalidatePwdVerCache(parseInt(req.params.id, 10))
  await audit(req, 'delete', 'user', parseInt(req.params.id, 10),
    `deleted user ${victim.rows[0]?.username || ''}`)
  emitEvent('user.deleted', req.user, parseInt(req.params.id, 10),
    victim.rows[0]?.username || '')
  res.json({ success: true })
})

/**
 * POST /api/users/:id/reset-password
 *
 * Admin generates a new random password for a user. The plaintext is returned
 * ONCE in the response and never stored. Admin is expected to communicate it
 * securely to the user, who can then change it.
 */
router.post('/:id/reset-password', adminOnly, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const user = await pool.query('SELECT username, display_name FROM users WHERE id = $1', [id])
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'المستخدم غير موجود' })
    }
    const newPassword = crypto.randomBytes(6).toString('base64')
      .replace(/[+/=]/g, '').substring(0, 10)
    const hashed = bcrypt.hashSync(newPassword, 10)
    await pool.query(
      'UPDATE users SET password = $1, password_version = password_version + 1 WHERE id = $2',
      [hashed, id])
    invalidatePwdVerCache(id)
    await audit(req, 'reset_password', 'user', id,
      `admin reset password for ${user.rows[0].username}`)
    emitEvent('user.password_reset', req.user, id, user.rows[0].username)
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
