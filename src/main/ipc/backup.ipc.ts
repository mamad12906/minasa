import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'path'
import { startAutoBackup, stopAutoBackup } from '../services/backup.service'

function getWin(event?: any): BrowserWindow {
  if (event?.sender) {
    const w = BrowserWindow.fromWebContents(event.sender)
    if (w) return w
  }
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
}

export function register(): void {
  // Backup: save database file
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

      // Try WAL checkpoint first
      try {
        const { getDatabase } = require('../database/connection')
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

  // Backup: restore
  ipcMain.handle('backup:restore', async (event) => {
    try {
      const win = getWin(event)
      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'], title: 'اختر ملف النسخة الاحتياطية',
        filters: [{ name: 'Database', extensions: ['db'] }]
      })
      if (result.canceled || result.filePaths.length === 0) return null

      const fs = require('fs')
      const srcFile = result.filePaths[0]
      const dbPath = path.join(app.getPath('userData'), 'minasa.db')

      try { const { closeDatabase } = require('../database/connection'); closeDatabase() } catch (err) { console.error('[backup:restore] Failed to close database:', err) }

      if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, dbPath + '.before-restore')
      if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal')
      if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm')
      fs.copyFileSync(srcFile, dbPath)

      try { const { getDatabase } = require('../database/connection'); getDatabase() } catch (err) { console.error('[backup:restore] Failed to reopen database:', err) }
      return { success: true, message: 'تم استرجاع النسخة. يرجى إعادة تشغيل البرنامج.' }
    } catch (err: any) {
      return { success: false, message: `خطأ: ${err.message}` }
    }
  })

  // Backup: export all customers Excel
  ipcMain.handle('backup:excel-all', async (event) => {
    try {
      const win = getWin(event)
      const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'], title: 'اختر مكان حفظ التصدير'
      })
      if (result.canceled || result.filePaths.length === 0) return null

      const { getDatabase } = require('../database/connection')
      const { exportToExcel } = require('../services/excel.service')
      const db = getDatabase()
      const date = new Date().toISOString().split('T')[0]
      const customers = db.prepare('SELECT c.*, COALESCE(u.display_name, \'\') as employee_name FROM customers c LEFT JOIN users u ON u.id = c.user_id').all()
      const filePath = path.join(result.filePaths[0], `تصدير-كامل-${date}.xlsx`)
      exportToExcel(filePath, customers, {
        employee_name: 'اسم الموظف', platform_name: 'اسم المنصة', full_name: 'اسم الزبون',
        mother_name: 'اسم الأم', phone_number: 'رقم الهاتف', card_number: 'رقم البطاقة',
        category: 'الصنف', ministry_name: 'اسم الوزارة', status_note: 'الحالة',
        months_count: 'عدد الأشهر', notes: 'ملاحظات', created_at: 'تاريخ الإنشاء'
      })
      return filePath
    } catch (err: any) { console.error('[backup:excel-all]', err.message); return null }
  })

  // Backup: export user's customers Excel
  ipcMain.handle('backup:excel-user', async (event, userId: number, userName: string) => {
    try {
      const win = getWin(event)
      const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'], title: 'اختر مكان حفظ التصدير'
      })
      if (result.canceled || result.filePaths.length === 0) return null

      const { getDatabase } = require('../database/connection')
      const { exportToExcel } = require('../services/excel.service')
      const db = getDatabase()
      const date = new Date().toISOString().split('T')[0]
      const customers = db.prepare('SELECT * FROM customers WHERE user_id = ?').all(userId)
      const safeName = (userName || 'user').replace(/[/\\?%*:|"<>]/g, '-')
      const filePath = path.join(result.filePaths[0], `تصدير-زبائن-${safeName}-${date}.xlsx`)
      exportToExcel(filePath, customers, {
        platform_name: 'اسم المنصة', full_name: 'اسم الزبون', mother_name: 'اسم الأم',
        phone_number: 'رقم الهاتف', card_number: 'رقم البطاقة', category: 'الصنف',
        ministry_name: 'اسم الوزارة', status_note: 'الحالة', months_count: 'عدد الأشهر',
        notes: 'ملاحظات', created_at: 'تاريخ الإنشاء'
      })
      return filePath
    } catch (err: any) { console.error('[backup:excel-user]', err.message); return null }
  })

  ipcMain.handle('backup:auto-setup', async (_event, dirPath: string, intervalHours: number) => {
    try {
      // Save to persistent config
      const configPath = path.join(app.getPath('userData'), 'minasa-config.json')
      let config: any = {}
      try { config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8')) } catch (err) { console.error('[backup:auto-setup] Failed to read config:', err) }
      config.auto_backup_dir = dirPath
      config.auto_backup_hours = intervalHours
      require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2))
      // Also save to DB settings if available
      try {
        const { getDatabase } = require('../database/connection')
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
      const { getDatabase } = require('../database/connection'); const db = getDatabase()
      db.prepare("DELETE FROM settings WHERE key = 'auto_backup_dir'").run()
      db.prepare("DELETE FROM settings WHERE key = 'auto_backup_hours'").run()
    } catch (err) { console.error('[backup:auto-stop] Failed to clear DB settings:', err) }
    return { success: true }
  })

  ipcMain.handle('backup:auto-get', () => {
    // Try persistent config first
    try {
      const configPath = path.join(app.getPath('userData'), 'minasa-config.json')
      const config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'))
      if (config.auto_backup_dir) return { dir: config.auto_backup_dir, hours: config.auto_backup_hours || 0 }
    } catch (err) { console.error('[backup:auto-get] Failed to read config file:', err) }
    // Fallback to DB
    try {
      const { getDatabase } = require('../database/connection'); const db = getDatabase()
      const dir = db.prepare("SELECT value FROM settings WHERE key = 'auto_backup_dir'").get() as any
      const hours = db.prepare("SELECT value FROM settings WHERE key = 'auto_backup_hours'").get() as any
      return { dir: dir?.value || '', hours: Number(hours?.value) || 0 }
    } catch (err) { console.error('[backup:auto-get] Failed to read DB settings:', err); return { dir: '', hours: 0 } }
  })
}
