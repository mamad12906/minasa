import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import { readExcelHeaders, importExcelData, exportToExcel } from '../services/excel.service'
import { getDatabase, closeDatabase } from '../database/connection'
import path from 'path'
import fs from 'fs'

// Auto-backup interval reference
let autoBackupInterval: any = null

export function registerExcelIPC(): void {
  ipcMain.handle('excel:selectFile', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile'],
      filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle('excel:readHeaders', (_event, filePath: string) => {
    try { return readExcelHeaders(filePath) }
    catch { return [] }
  })

  ipcMain.handle('excel:import', (_event, filePath: string, mapping: any) => {
    try {
      const result = importExcelData(filePath, mapping)
      return { success: Number(result.success) || 0, failed: Number(result.failed) || 0, errors: result.errors.map(String) }
    } catch (err: any) {
      return { success: 0, failed: 0, errors: [String(err?.message || err)] }
    }
  })

  ipcMain.handle('excel:exportCustomers', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showSaveDialog(win!, {
      defaultPath: 'customers.xlsx',
      filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    })
    if (result.canceled || !result.filePath) return null
    try {
      const db = getDatabase()
      const data = db.prepare('SELECT * FROM customers').all()
      exportToExcel(result.filePath, data, {
        platform_name: 'اسم المنصة', full_name: 'اسم الزبون', mother_name: 'اسم الأم',
        phone_number: 'رقم الهاتف', card_number: 'رقم البطاقة', category: 'الصنف',
        ministry_name: 'اسم الوزارة', status_note: 'الحالة', created_at: 'تاريخ الإنشاء'
      })
      return result.filePath
    } catch { return null }
  })

  // === BACKUP ===

  const doBackupDB = (destDir: string): string | null => {
    try {
      const dbPath = path.join(app.getPath('userData'), 'minasa.db')
      const date = new Date().toISOString().split('T')[0]
      const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-')
      const destFile = path.join(destDir, `minasa-backup-${date}_${time}.db`)
      const db = getDatabase()
      db.pragma('wal_checkpoint(TRUNCATE)')
      fs.copyFileSync(dbPath, destFile)
      return destFile
    } catch (err: any) {
      console.error('[backup] error:', err)
      return null
    }
  }

  ipcMain.handle('backup:database', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory'], title: 'اختر مكان حفظ النسخة الاحتياطية'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return doBackupDB(result.filePaths[0])
  })

  // Restore database from backup
  ipcMain.handle('backup:restore', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile'],
      title: 'اختر ملف النسخة الاحتياطية',
      filters: [{ name: 'Database', extensions: ['db'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    try {
      const srcFile = result.filePaths[0]
      const dbPath = path.join(app.getPath('userData'), 'minasa.db')
      // Close current DB
      closeDatabase()
      // Backup current before overwrite
      const currentBackup = dbPath + '.before-restore'
      if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, currentBackup)
      // Remove WAL/SHM files
      if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal')
      if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm')
      // Copy backup over
      fs.copyFileSync(srcFile, dbPath)
      // Reinit database
      getDatabase()
      return { success: true, message: 'تم استرجاع النسخة الاحتياطية بنجاح. يرجى إعادة تشغيل البرنامج.' }
    } catch (err: any) {
      console.error('[restore] error:', err)
      // Try to reinit anyway
      try { getDatabase() } catch {}
      return { success: false, message: `خطأ: ${err.message}` }
    }
  })

  // Admin: export ALL customers with employee name
  ipcMain.handle('backup:excel-all', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory'], title: 'اختر مكان حفظ التصدير'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    try {
      const db = getDatabase()
      const date = new Date().toISOString().split('T')[0]
      // Join with users to get employee name
      const customers = db.prepare(`
        SELECT c.*, COALESCE(u.display_name, '') as employee_name
        FROM customers c LEFT JOIN users u ON u.id = c.user_id
      `).all()
      const filePath = path.join(result.filePaths[0], `تصدير-كامل-${date}.xlsx`)
      exportToExcel(filePath, customers, {
        employee_name: 'اسم الموظف', platform_name: 'اسم المنصة', full_name: 'اسم الزبون',
        mother_name: 'اسم الأم', phone_number: 'رقم الهاتف', card_number: 'رقم البطاقة',
        category: 'الصنف', ministry_name: 'اسم الوزارة', status_note: 'الحالة',
        months_count: 'عدد الأشهر', notes: 'ملاحظات', created_at: 'تاريخ الإنشاء'
      })
      return filePath
    } catch { return null }
  })

  // User: export only their own customers
  ipcMain.handle('backup:excel-user', async (event, userId: number, userName: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory'], title: 'اختر مكان حفظ التصدير'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    try {
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
    } catch { return null }
  })

  // Auto-backup settings
  ipcMain.handle('backup:auto-setup', async (event, dirPath: string, intervalHours: number) => {
    try {
      // Save settings
      const db = getDatabase()
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_backup_dir', ?)").run(dirPath)
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_backup_hours', ?)").run(String(intervalHours))

      // Clear old interval
      if (autoBackupInterval) clearInterval(autoBackupInterval)

      // Setup new interval
      if (dirPath && intervalHours > 0) {
        const ms = intervalHours * 60 * 60 * 1000
        autoBackupInterval = setInterval(() => {
          doBackupDB(dirPath)
          console.log('[auto-backup] Done at', new Date().toISOString())
        }, ms)
        // Do first backup now
        doBackupDB(dirPath)
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('backup:auto-stop', () => {
    if (autoBackupInterval) { clearInterval(autoBackupInterval); autoBackupInterval = null }
    const db = getDatabase()
    db.prepare("DELETE FROM settings WHERE key = 'auto_backup_dir'").run()
    db.prepare("DELETE FROM settings WHERE key = 'auto_backup_hours'").run()
    return { success: true }
  })

  ipcMain.handle('backup:auto-get', () => {
    const db = getDatabase()
    const dir = db.prepare("SELECT value FROM settings WHERE key = 'auto_backup_dir'").get() as any
    const hours = db.prepare("SELECT value FROM settings WHERE key = 'auto_backup_hours'").get() as any
    return { dir: dir?.value || '', hours: Number(hours?.value) || 0 }
  })

  ipcMain.handle('backup:select-dir', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openDirectory'], title: 'اختر مجلد النسخ الاحتياطي التلقائي'
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })
}
