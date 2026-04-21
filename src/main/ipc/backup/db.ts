import { app, ipcMain, dialog } from 'electron'
import path from 'path'
import { startAutoBackup, stopAutoBackup } from '../../services/backup.service'
import { getWin } from './shared'

export function registerDbBackup(): void {
  // Save a copy of the SQLite DB to a user-chosen folder.
  ipcMain.handle('backup:database', async (event) => {
    try {
      const win = getWin(event)
      const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'], title: 'اختر مكان حفظ النسخة الاحتياطية'
      })
      if (result.canceled || result.filePaths.length === 0) return null

      const fs = require('fs')
      const dbPath = path.join(app.getPath('userData'), 'minasa.db')
      if (!fs.existsSync(dbPath)) return { success: false, message: 'ملف قاعدة البيانات غير موجود' }

      const date = new Date().toISOString().split('T')[0]
      const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-')
      const destFile = path.join(result.filePaths[0], `minasa-backup-${date}_${time}.db`)

      // Flush WAL to main DB file so the copied snapshot is consistent.
      try {
        const { getDatabase } = require('../../database/connection')
        const db = getDatabase()
        db.pragma('wal_checkpoint(TRUNCATE)')
      } catch (err) { console.error('[backup:database] WAL checkpoint failed:', err) }

      fs.copyFileSync(dbPath, destFile)
      return destFile
    } catch (err: any) {
      console.error('[backup:database] Error:', err.message)
      return null
    }
  })

  // Auto-backup: persists setting to both userData config + settings table,
  // then starts the interval.
  ipcMain.handle('backup:auto-setup', async (_event, dirPath: string, intervalHours: number) => {
    try {
      const configPath = path.join(app.getPath('userData'), 'minasa-config.json')
      let config: any = {}
      try { config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8')) } catch (err) { console.error('[backup:auto-setup] Failed to read config:', err) }
      config.auto_backup_dir = dirPath
      config.auto_backup_hours = intervalHours
      require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2))
      try {
        const { getDatabase } = require('../../database/connection')
        const db = getDatabase()
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_backup_dir', ?)").run(dirPath)
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_backup_hours', ?)").run(String(intervalHours))
      } catch (err) { console.error('[backup:auto-setup] Failed to save DB settings:', err) }
      startAutoBackup(dirPath, intervalHours)
      return { success: true }
    } catch (err) { console.error('[backup:auto-setup] Error:', err); return { success: false } }
  })

  ipcMain.handle('backup:auto-stop', () => {
    stopAutoBackup()
    try {
      const configPath = path.join(app.getPath('userData'), 'minasa-config.json')
      let config: any = {}
      try { config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8')) } catch (err) { console.error('[backup:auto-stop] Failed to read config:', err) }
      delete config.auto_backup_dir; delete config.auto_backup_hours
      require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2))
    } catch (err) { console.error('[backup:auto-stop] Failed to update config file:', err) }
    try {
      const { getDatabase } = require('../../database/connection'); const db = getDatabase()
      db.prepare("DELETE FROM settings WHERE key = 'auto_backup_dir'").run()
      db.prepare("DELETE FROM settings WHERE key = 'auto_backup_hours'").run()
    } catch (err) { console.error('[backup:auto-stop] Failed to clear DB settings:', err) }
    return { success: true }
  })

  ipcMain.handle('backup:auto-get', () => {
    try {
      const configPath = path.join(app.getPath('userData'), 'minasa-config.json')
      const config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'))
      if (config.auto_backup_dir) return { dir: config.auto_backup_dir, hours: config.auto_backup_hours || 0 }
    } catch (err) { console.error('[backup:auto-get] Failed to read config file:', err) }
    try {
      const { getDatabase } = require('../../database/connection'); const db = getDatabase()
      const dir = db.prepare("SELECT value FROM settings WHERE key = 'auto_backup_dir'").get() as any
      const hours = db.prepare("SELECT value FROM settings WHERE key = 'auto_backup_hours'").get() as any
      return { dir: dir?.value || '', hours: Number(hours?.value) || 0 }
    } catch (err) { console.error('[backup:auto-get] Failed to read DB settings:', err); return { dir: '', hours: 0 } }
  })
}
