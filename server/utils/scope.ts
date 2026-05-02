import { pool } from '../db'

/**
 * Shared user-hierarchy scope helpers. The same role-based access rule
 * (admin = all, subadmin = self + children, regular user = self only) is
 * used by every list/detail endpoint that exposes per-user data; before
 * this helper existed, each route reimplemented the WHERE clause inline,
 * with a few subtle bugs (param index drift in invoices, missing parent
 * lookups in single-record GETs).
 */

interface ScopedUser { id: number; role: string }

/**
 * Build the WHERE-fragment + params for a list query that filters by the
 * caller's scope on `<column>`.
 *
 *   const scope = userScopeWhere(req.user!, 'c.user_id')
 *   const sql = `SELECT * FROM customers c WHERE ${scope.sql}`
 *   pool.query(sql, scope.params)
 *
 * `paramOffset` is the next $N placeholder the caller wants — defaults to
 * 1 for a fresh query, but pass the current `idx` if the caller has earlier
 * params.
 */
export function userScopeWhere(
  user: ScopedUser,
  column: string = 'user_id',
  paramOffset: number = 1,
): { sql: string; params: any[]; nextOffset: number } {
  if (user.role === 'admin') {
    return { sql: '1=1', params: [], nextOffset: paramOffset }
  }
  if (user.role === 'subadmin') {
    const p = paramOffset
    return {
      sql: `(${column} = $${p} OR ${column} IN (SELECT id FROM users WHERE parent_id = $${p}))`,
      params: [user.id],
      nextOffset: paramOffset + 1,
    }
  }
  // Regular user — only their own rows.
  return {
    sql: `${column} = $${paramOffset}`,
    params: [user.id],
    nextOffset: paramOffset + 1,
  }
}

/**
 * True if `caller` is allowed to see records owned by `ownerId`.
 *
 * Used by single-record GET endpoints (`GET /customers/:id`) to gate access
 * after fetching the row. Returning 404 (not 403) is recommended so callers
 * can't probe for the existence of records outside their scope.
 */
export async function canAccessUser(
  caller: ScopedUser,
  ownerId: number | null | undefined,
): Promise<boolean> {
  if (caller.role === 'admin') return true
  if (ownerId == null) return false
  if (caller.id === ownerId) return true
  if (caller.role === 'subadmin') {
    const r = await pool.query(
      'SELECT 1 FROM users WHERE id = $1 AND parent_id = $2 LIMIT 1',
      [ownerId, caller.id],
    )
    return r.rows.length > 0
  }
  return false
}
