import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { touch } from '../presence'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required. Set it in .env file.')
  process.exit(1)
}

export interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string; display_name: string; platform_name: string }
}

export function generateToken(user: any): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, display_name: user.display_name, platform_name: user.platform_name || '' },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'غير مصرح' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    req.user = decoded
    touch(decoded?.id)
    next()
  } catch (e: any) {
    console.error('[authMiddleware] JWT verification failed:', e.message)
    return res.status(401).json({ error: 'توكن غير صالح' })
  }
}

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'صلاحية الأدمن فقط' })
  next()
}
