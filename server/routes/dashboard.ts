import { Router } from 'express'
import { pool } from '../db'
import { AuthRequest, authMiddleware } from '../middleware/auth'

const router = Router()
router.use(authMiddleware)

router.get('/stats', async (req: AuthRequest, res) => {
  const isAdmin = req.user!.role === 'admin'
  const userId = isAdmin ? null : req.user!.id
  const filter = userId ? 'WHERE user_id = $1' : ''
  const filterAnd = userId ? 'AND user_id = $1' : ''
  const params = userId ? [userId] : []

  const customers = await pool.query(`SELECT COUNT(*) as total FROM customers ${filter}`, params)
  const cats = await pool.query(`SELECT category, COUNT(*)::int as count FROM customers WHERE category != '' ${filterAnd} GROUP BY category ORDER BY count DESC LIMIT 10`, params)
  const mins = await pool.query(`SELECT ministry_name, COUNT(*)::int as count FROM customers WHERE ministry_name != '' ${filterAnd} GROUP BY ministry_name ORDER BY count DESC LIMIT 15`, params)
  const recent = await pool.query(`SELECT * FROM customers ${filter} ORDER BY created_at DESC LIMIT 10`, params)

  res.json({
    totalCustomers: Number(customers.rows[0].total),
    categoryBreakdown: cats.rows,
    ministryBreakdown: mins.rows,
    recentCustomers: recent.rows
  })
})

export default router
