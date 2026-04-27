import { pool } from './db'
import { AuthRequest } from './middleware/auth'

/**
 * Append an entry to the audit_log table. Never throws — logging must not
 * take down a mutation.
 *
 * Typical usage:
 *   await audit(req, 'create', 'customer', newId, `name=${name}`)
 */
export async function audit(
  req: AuthRequest,
  action: string,
  entityType: string = '',
  entityId: number | null = null,
  details: string = '',
): Promise<void> {
  try {
    const ip = (req.ip || req.socket?.remoteAddress || '').toString()
    await pool.query(
      `INSERT INTO audit_log (tenant_id, user_id, username, action, entity_type, entity_id, details, ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        req.user?.tenant_id ?? 1,
        req.user?.id ?? null,
        req.user?.username ?? '',
        action,
        entityType,
        entityId,
        details.slice(0, 1000),
        ip,
      ],
    )
  } catch (e) {
    console.error('[audit] failed to write log:', (e as Error).message)
  }
}
