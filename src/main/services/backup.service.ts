import { app } from 'electron'
import path from 'path'

let autoBackupInterval: NodeJS.Timeout | null = null

export function doAutoBackup(dir: string): void {
  try {
    const fs = require('fs')
    const dbPath = path.join(app.getPath('userData'), 'minasa.db')
    if (!fs.existsSync(dbPath)) return
    try {
      const { getDatabase } = require('../database/connection')
      getDatabase().pragma('wal_checkpoint(TRUNCATE)')
    } catch (err) { console.error('[auto-backup] WAL checkpoint failed:', err) }
    const date = new Date().toISOString().split('T')[0]
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-')
    fs.copyFileSync(dbPath, path.join(dir, `minasa-auto-${date}_${time}.db`))
  } catch (e: any) {
    console.error('[auto-backup] Error:', e.message)
  }
}

export function startAutoBackup(dir: string, hours: number): void {
  if (autoBackupInterval) clearInterval(autoBackupInterval)
  if (dir && hours > 0) {
    doAutoBackup(dir)
    autoBackupInterval = setInterval(() => doAutoBackup(dir), hours * 60 * 60 * 1000)
  }
}

export function stopAutoBackup(): void {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval)
    autoBackupInterval = null
  }
}

export function restoreAutoBackupOnStartup(): void {
  try {
    const configPath = path.join(app.getPath('userData'), 'minasa-config.json')
    const config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'))
    if (config.auto_backup_dir && config.auto_backup_hours > 0) {
      startAutoBackup(config.auto_backup_dir, config.auto_backup_hours)
    }
  } catch (err) {
    console.error('[auto-backup] Failed to restore auto-backup on startup:', err)
  }
}
