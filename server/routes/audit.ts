import { Router } from 'express'
import { pool } from '../db'
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)
router.use(adminOnly)

/**
 * GET /api/audit?limit=100&offset=0
 *
 * Returns the most recent audit entries. Admin-only, scoped to caller tenant.
 */
router.get('/', async (req: AuthRequest, res) => {
  const limit = Math.min(parseInt(String(req.query.limit ?? '100'), 10) || 100, 500)
  const offset = parseInt(String(req.query.offset ?? '0'), 10) || 0
  const tenantId = req.user!.tenant_id
  try {
    const r = await pool.query(
      `SELECT id, user_id, username, action, entity_type, entity_id, details, ip, created_at
       FROM audit_log WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    )
    const c = await pool.query(
      'SELECT COUNT(*) FROM audit_log WHERE tenant_id = $1',
      [tenantId],
    )
    res.json({ data: r.rows, total: parseInt(c.rows[0].count, 10) })
  } catch (e: any) {
    console.error('[audit.list]', e.message)
    res.status(500).json({ error: 'تعذر جلب سجل المراجعة' })
  }
})

export default router
