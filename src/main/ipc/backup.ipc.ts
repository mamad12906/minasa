import { registerDbBackup } from './backup/db'
import { registerRestore } from './backup/restore'
import { registerExcelExport } from './backup/excel'

// Thin orchestrator — the three sub-modules each own one concern:
//   db.ts       → database backup + auto-backup schedule
//   restore.ts  → restore from .db file
//   excel.ts    → customer-list Excel export (all / per-user)
export function register(): void {
  registerDbBackup()
  registerRestore()
  registerExcelExport()
}
