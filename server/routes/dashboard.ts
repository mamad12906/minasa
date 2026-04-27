import { Router } from 'express'
import { pool } from '../db'
import { AuthRequest, authMiddleware } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

router.get('/stats', async (req: AuthRequest, res) => {
  const role = req.user!.role
  const tenantId = req.user!.tenant_id
  const isAdmin = role === 'admin'
  const isSubadmin = role === 'subadmin'

  // Build the scope: admin = no further filter beyond tenant; subadmin =
  // self + sub-users; regular user = self only. tenant_id is always $1.
  const params: any[] = [tenantId]
  let scope = ''
  if (isSubadmin) {
    scope = ` AND (user_id = $2 OR user_id IN (SELECT id FROM users WHERE parent_id = $2 AND tenant_id = $1))`
    params.push(req.user!.id)
  } else if (!isAdmin) {
    scope = ` AND user_id = $2`
    params.push(req.user!.id)
  }

  const customers = await pool.query(
    `SELECT COUNT(*) as total FROM customers WHERE tenant_id = $1${scope}`,
    params,
  )
  const cats = await pool.query(
    `SELECT category, COUNT(*)::int as count FROM customers WHERE tenant_id = $1 AND category != ''${scope} GROUP BY category ORDER BY count DESC LIMIT 10`,
    params,
  )
  const mins = await pool.query(
    `SELECT ministry_name, COUNT(*)::int as count FROM customers WHERE tenant_id = $1 AND ministry_name != ''${scope} GROUP BY ministry_name ORDER BY count DESC LIMIT 15`,
    params,
  )
  const recent = await pool.query(
    `SELECT *, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at_fmt FROM customers WHERE tenant_id = $1${scope} ORDER BY created_at DESC LIMIT 10`,
    params,
  )

  // Employee customer counts. Admin sees everyone non-admin in this tenant;
  // subadmin sees only their sub-users; regular user: empty.
  let employeeStats: any[] = []
  if (isAdmin) {
    const emp = await pool.query(`
      SELECT u.id, u.display_name, COALESCE(c.count, 0)::int as customer_count
      FROM users u
      LEFT JOIN (SELECT user_id, COUNT(*) as count FROM customers WHERE tenant_id = $1 GROUP BY user_id) c ON c.user_id = u.id
      WHERE u.tenant_id = $1 AND u.role != 'admin' ORDER BY customer_count DESC
    `, [tenantId])
    employeeStats = emp.rows
  } else if (isSubadmin) {
    const emp = await pool.query(`
      SELECT u.id, u.display_name, COALESCE(c.count, 0)::int as customer_count
      FROM users u
      LEFT JOIN (SELECT user_id, COUNT(*) as count FROM customers WHERE tenant_id = $1 GROUP BY user_id) c ON c.user_id = u.id
      WHERE u.tenant_id = $1 AND u.parent_id = $2 ORDER BY customer_count DESC
    `, [tenantId, req.user!.id])
    employeeStats = emp.rows
  }

  res.json({
    totalCustomers: Number(customers.rows[0].total),
    categoryBreakdown: cats.rows,
    ministryBreakdown: mins.rows,
    recentCustomers: recent.rows.map(r => ({ ...r, created_at: r.created_at_fmt || r.created_at })),
    employeeStats
  })
})

export default router
