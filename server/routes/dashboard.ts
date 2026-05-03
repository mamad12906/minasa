import { Router } from 'express'
import { pool } from '../db'
import { AuthRequest, authMiddleware } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

router.get('/stats', async (req: AuthRequest, res) => {
  const role = req.user!.role
  const isAdmin = role === 'admin'
  const isSubadmin = role === 'subadmin'

  // Build the scope: admin = no filter; subadmin = self + sub-users;
  // regular user = self only.
  let filter = ''
  let filterAnd = ''
  const params: any[] = []
  if (isSubadmin) {
    filter = 'WHERE (user_id = $1 OR user_id IN (SELECT id FROM users WHERE parent_id = $1))'
    filterAnd = 'AND (user_id = $1 OR user_id IN (SELECT id FROM users WHERE parent_id = $1))'
    params.push(req.user!.id)
  } else if (!isAdmin) {
    filter = 'WHERE user_id = $1'
    filterAnd = 'AND user_id = $1'
    params.push(req.user!.id)
  }

  const customers = await pool.query(`SELECT COUNT(*) as total FROM customers ${filter}`, params)
  const cats = await pool.query(`SELECT category, COUNT(*)::int as count FROM customers WHERE category != '' ${filterAnd} GROUP BY category ORDER BY count DESC LIMIT 10`, params)
  const mins = await pool.query(`SELECT ministry_name, COUNT(*)::int as count FROM customers WHERE ministry_name != '' ${filterAnd} GROUP BY ministry_name ORDER BY count DESC LIMIT 15`, params)
  const recent = await pool.query(`SELECT *, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as created_at_fmt FROM customers ${filter} ORDER BY created_at DESC LIMIT 10`, params)

  // Last-7-days new-customer series, in chronological order so the mobile
  // sparkline rises when activity is up and falls when it stops. The CTE
  // generates the 7 buckets so days with zero additions still render as a
  // dip rather than being skipped (which would make every day look "up").
  const trend = await pool.query(
    `WITH days AS (
       SELECT generate_series(
         (CURRENT_DATE - INTERVAL '6 days')::date,
         CURRENT_DATE,
         INTERVAL '1 day'
       )::date AS day
     )
     SELECT TO_CHAR(d.day, 'YYYY-MM-DD') AS day,
            COALESCE(c.cnt, 0)::int AS count
     FROM days d
     LEFT JOIN (
       SELECT created_at::date AS day, COUNT(*) AS cnt
       FROM customers
       ${filter ? `${filter} AND ` : 'WHERE '}created_at >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY 1
     ) c ON c.day = d.day
     ORDER BY d.day ASC`,
    params,
  )

  // Employee customer counts. Admin sees everyone non-admin; subadmin sees
  // only their sub-users; regular user: empty (no reports under them).
  let employeeStats: any[] = []
  if (isAdmin) {
    const emp = await pool.query(`
      SELECT u.id, u.display_name, COALESCE(c.count, 0)::int as customer_count
      FROM users u LEFT JOIN (SELECT user_id, COUNT(*) as count FROM customers GROUP BY user_id) c ON c.user_id = u.id
      WHERE u.role != 'admin' ORDER BY customer_count DESC
    `)
    employeeStats = emp.rows
  } else if (isSubadmin) {
    const emp = await pool.query(`
      SELECT u.id, u.display_name, COALESCE(c.count, 0)::int as customer_count
      FROM users u LEFT JOIN (SELECT user_id, COUNT(*) as count FROM customers GROUP BY user_id) c ON c.user_id = u.id
      WHERE u.parent_id = $1 ORDER BY customer_count DESC
    `, [req.user!.id])
    employeeStats = emp.rows
  }

  res.json({
    totalCustomers: Number(customers.rows[0].total),
    categoryBreakdown: cats.rows,
    ministryBreakdown: mins.rows,
    recentCustomers: recent.rows.map(r => ({ ...r, created_at: r.created_at_fmt || r.created_at })),
    employeeStats,
    last7Days: trend.rows.map(r => ({ day: r.day, count: r.count })),
  })
})

export default router
