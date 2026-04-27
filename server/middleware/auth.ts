import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db'
import { touch } from '../presence'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required. Set it in .env file.')
  process.exit(1)
}

export interface AuthRequest extends Request {
  user?: {
    id: number
    username: string
    role: string
    display_name: string
    platform_name: string
    permissions?: Record<string, boolean>
  }
}

export function generateToken(user: any): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      display_name: user.display_name,
      platform_name: user.platform_name || '',
      pwdVer: user.password_version ?? 1,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

// Per-user current password_version, avoids a DB hit on every authenticated
// request. Populated lazily on first check and invalidated via
// `invalidatePwdVerCache` whenever we change the password for that user.
const pwdVerCache = new Map<number, number>()

export function invalidatePwdVerCache(userId: number): void {
  pwdVerCache.delete(userId)
}

export async function currentPwdVer(userId: number): Promise<number | null> {
  const cached = pwdVerCache.get(userId)
  if (cached != null) return cached
  try {
    const r = await pool.query<{ password_version: number }>(
      'SELECT password_version FROM users WHERE id = $1', [userId])
    if (r.rows.length === 0) return null
    const v = Number(r.rows[0].password_version) || 1
    pwdVerCache.set(userId, v)
    return v
  } catch {
    return null
  }
}

// Per-user permissions cache — same pattern as pwdVerCache. Admin routes
// must call invalidatePermsCache(userId) whenever they change a user's
// permissions so the next request picks up the new set.
const permsCache = new Map<number, Record<string, boolean>>()

export function invalidatePermsCache(userId: number): void {
  permsCache.delete(userId)
}

export async function currentPermissions(userId: number): Promise<Record<string, boolean>> {
  const cached = permsCache.get(userId)
  if (cached) return cached
  try {
    const r = await pool.query<{ permissions: string }>(
      'SELECT permissions FROM users WHERE id = $1', [userId])
    if (r.rows.length === 0) return {}
    let perms: Record<string, boolean> = {}
    try {
      const parsed = JSON.parse(r.rows[0].permissions || '{}')
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          perms[k] = v === true
        }
      }
    } catch { /* leave perms empty on malformed JSON */ }
    permsCache.set(userId, perms)
    return perms
  } catch {
    return {}
  }
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'غير مصرح' })

  let decoded: any
  try {
    decoded = jwt.verify(token, JWT_SECRET) as any
  } catch (e: any) {
    console.error('[authMiddleware] JWT verification failed:', e.message)
    return res.status(401).json({ error: 'توكن غير صالح' })
  }

  // Reject tokens issued against an older password. Tokens minted before
  // pwdVer existed (older sessions) treat as version 1 on both sides, which
  // stays valid until the first password change after the upgrade.
  const tokenVer = decoded?.pwdVer ?? 1
  const liveVer = await currentPwdVer(decoded?.id)
  if (liveVer == null) {
    return res.status(401).json({ error: 'الحساب غير موجود' })
  }
  if (tokenVer !== liveVer) {
    return res.status(401).json({ error: 'انتهت الجلسة، سجل دخول مرة أخرى' })
  }

  // Attach permissions for non-admins so requirePermission() can check
  // without an extra DB query (cached). Admins bypass all perm checks.
  if (decoded.role !== 'admin') {
    decoded.permissions = await currentPermissions(decoded.id)
  }

  req.user = decoded
  touch(decoded?.id)
  next()
}

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'صلاحية الأدمن فقط' })
  next()
}
