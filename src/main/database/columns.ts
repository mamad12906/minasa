import { getDatabase } from './connection'

export interface CustomColumn {
  id: number
  column_name: string
  display_name: string
  column_type: string // 'text' | 'number' | 'date'
  table_name: string // 'customers' | 'invoices'
  sort_order: number
}

export interface CustomColumnInput {
  display_name: string
  column_type: string
  table_name: string
}

export function initCustomColumnsTable(): void {
  const db = getDatabase()
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_columns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      column_name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      column_type TEXT NOT NULL DEFAULT 'text',
      table_name TEXT NOT NULL DEFAULT 'customers',
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `)
}

export function listCustomColumns(tableName?: string): CustomColumn[] {
  const db = getDatabase()
  if (tableName) {
    return db.prepare('SELECT * FROM custom_columns WHERE table_name = ? ORDER BY sort_order ASC').all(tableName) as CustomColumn[]
  }
  return db.prepare('SELECT * FROM custom_columns ORDER BY sort_order ASC').all() as CustomColumn[]
}

export function addCustomColumn(input: CustomColumnInput): CustomColumn {
  const db = getDatabase()

  // Generate safe column name from display name
  const colName = 'custom_' + Date.now()

  // Get next sort order
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) as max_order FROM custom_columns WHERE table_name = ?').get(input.table_name) as any

  // Add to metadata table
  const result = db.prepare(`
    INSERT INTO custom_columns (column_name, display_name, column_type, table_name, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `).run(colName, input.display_name, input.column_type, input.table_name, maxOrder.max_order + 1)

  // Add actual column to the target table (validate table name)
  const validTables = ['customers', 'invoices']
  if (!validTables.includes(input.table_name)) throw new Error('Invalid table name')
  if (!/^custom_\d+$/.test(colName)) throw new Error('Invalid column name')
  const defaultVal = input.column_type === 'number' ? '0' : "''"
  db.exec(`ALTER TABLE ${input.table_name} ADD COLUMN ${colName} TEXT DEFAULT ${defaultVal}`)

  return db.prepare('SELECT * FROM custom_columns WHERE id = ?').get(result.lastInsertRowid as number) as CustomColumn
}

export function updateCustomColumn(id: number, display_name: string): CustomColumn {
  const db = getDatabase()
  db.prepare('UPDATE custom_columns SET display_name = ? WHERE id = ?').run(display_name, id)
  return db.prepare('SELECT * FROM custom_columns WHERE id = ?').get(id) as CustomColumn
}

export function deleteCustomColumn(id: number): void {
  const db = getDatabase()
  const col = db.prepare('SELECT * FROM custom_columns WHERE id = ?').get(id) as CustomColumn
  if (!col) return

  // SQLite doesn't support DROP COLUMN in older versions, but since v3.35+ it does.
  // We'll try it, and if it fails, we leave the column but remove metadata.
  try {
    const validTables = ['customers', 'invoices']
    if (validTables.includes(col.table_name) && /^custom_\d+$/.test(col.column_name)) {
      db.exec(`ALTER TABLE ${col.table_name} DROP COLUMN ${col.column_name}`)
    }
  } catch {
    // Column remains in table but will be ignored since metadata is removed
  }

  db.prepare('DELETE FROM custom_columns WHERE id = ?').run(id)
}
