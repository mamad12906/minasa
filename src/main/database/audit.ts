import { getDatabase } from './connection'

export interface AuditEntry {
  id: number
  user_id: number
  user_name: string
  action: string
  entity_type: string
  entity_id: number
  details: string
  created_at: string
}

export function logAudit(userId: number, userName: string, action: string, entityType: string, entityId: number, details: string = '') {
  try {
    const db = getDatabase()
    db.prepare('INSERT INTO audit_log (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, userName, action, entityType, entityId, details)
  } catch { /* ignore audit failures */ }
}

export function getAuditLog(params: { page: number; pageSize: number; entityType?: string }): { data: AuditEntry[]; total: number } {
  const db = getDatabase()
  let where = ''
  const args: any[] = []
  if (params.entityType) { where = 'WHERE entity_type = ?'; args.push(params.entityType) }

  const total = (db.prepare(`SELECT COUNT(*) as c FROM audit_log ${where}`).get(...args) as any).c
  const offset = (params.page - 1) * params.pageSize
  const data = db.prepare(`SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...args, params.pageSize, offset) as AuditEntry[]
  return { data, total }
}
