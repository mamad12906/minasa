import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth'

/**
 * Deny the request unless the authenticated user holds the named
 * permission. Admins bypass all checks.
 *
 * Mount AFTER authMiddleware so req.user (with .permissions for non-admins)
 * is already populated.
 *
 * Example:
 *   router.delete('/:id', requirePermission('delete_customer'), handler)
 */
export function requirePermission(key: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role === 'admin') return next()
    const perms = req.user?.permissions ?? {}
    if (perms[key] === true) return next()
    return res.status(403).json({
      error: 'ليس لديك صلاحية لهذا الإجراء. اطلب من المدير منحك هذه الصلاحية.',
      required: key,
    })
  }
}
