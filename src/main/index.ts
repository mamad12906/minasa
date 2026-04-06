import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import path from 'path'
import { autoUpdater } from 'electron-updater'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'منصة - إدارة الزبائن والفواتير',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    show: false
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.maximize()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// Helper: get window from event with fallbacks
function getWin(event?: any): BrowserWindow {
  if (event?.sender) {
    const w = BrowserWindow.fromWebContents(event.sender)
    if (w) return w
  }
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
}

// ===== File dialog IPC - ALWAYS registered (no SQLite dependency) =====
function registerFileIPC() {
  // Excel file picker
  ipcMain.handle('excel:selectFile', async (event) => {
    try {
      const win = getWin(event)
      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [{ name: 'Excel', extensions: ['xlsx', 'xls', 'csv'] }]
      })
      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    } catch (err: any) {
      console.error('[excel:selectFile] Error:', err.message)
      return null
    }
  })

  // Read Excel headers
  ipcMain.handle('excel:readHeaders', (_event, filePath: string) => {
    try {
      const XLSX = require('xlsx')
      const workbook = XLSX.readFile(filePath)
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) return []
      const sheet = workbook.Sheets[sheetName]
      if (!sheet) return []
      // Try raw rows first
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
      if (data && data.length > 0) {
        for (let i = 0; i < Math.min(data.length, 5); i++) {
          const row = data[i]
          if (!row) continue
          const headers = row.map((h: any) => String(h || '').trim()).filter((h: string) => h.length > 0)
          if (headers.length >= 2) return headers
        }
      }
      // Fallback: JSON keys
      const jsonData = XLSX.utils.sheet_to_json(sheet)
      if (jsonData.length > 0) return Object.keys(jsonData[0]).filter((k: string) => k && k !== '__EMPTY')
      return []
    } catch (err: any) {
      console.error('[excel:readHeaders] Error:', err.message)
      return []
    }
  })

  // Import Excel data - inline (no dependency on service file)
  ipcMain.handle('excel:import', (_event, filePath: string, mapping: any) => {
    try {
      const XLSX = require('xlsx')
      const forcePlatform = (mapping as any).__force_platform__ || ''
      delete (mapping as any).__force_platform__

      const workbook = XLSX.readFile(filePath)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(sheet)
      if (!rows || rows.length === 0) return { success: 0, failed: 0, errors: ['الملف فارغ'] }

      const { getDatabase } = require('./database/connection')
      const db = getDatabase()

      const getValue = (row: any, field: string): string => {
        for (const [excelCol, dbField] of Object.entries(mapping)) {
          if (dbField === field) { const v = row[excelCol]; return v != null ? String(v).trim() : '' }
        }
        return ''
      }

      // Get custom columns
      let customCols: string[] = []
      try { customCols = db.prepare("SELECT column_name FROM custom_columns WHERE table_name = 'customers'").all().map((r: any) => r.column_name) } catch {}

      const baseFields = ['platform_name', 'full_name', 'mother_name', 'phone_number', 'card_number', 'category', 'ministry_name', 'status_note', 'reminder_date', 'reminder_text', 'user_id', 'months_count', 'notes']
      const allFields = [...baseFields, ...customCols]
      const stmt = db.prepare(`INSERT INTO customers (${allFields.join(', ')}) VALUES (${allFields.map(() => '?').join(', ')})`)

      let success = 0, failed = 0
      const errors: string[] = []

      const run = db.transaction(() => {
        for (let i = 0; i < rows.length; i++) {
          try {
            const row = rows[i]
            const fullName = getValue(row, 'full_name')
            if (!fullName) { errors.push(`صف ${i + 2}: اسم الزبون فارغ`); failed++; continue }
            const vals = [
              forcePlatform || getValue(row, 'platform_name'), fullName, getValue(row, 'mother_name'),
              getValue(row, 'phone_number'), getValue(row, 'card_number'), getValue(row, 'category'),
              getValue(row, 'ministry_name'), getValue(row, 'status_note'), getValue(row, 'reminder_date'),
              getValue(row, 'reminder_text'), parseInt(getValue(row, 'user_id')) || 0,
              parseInt(getValue(row, 'months_count')) || 0, getValue(row, 'notes'),
              ...customCols.map(c => getValue(row, c))
            ]
            stmt.run(...vals)
            success++
          } catch (err: any) { errors.push(`صف ${i + 2}: ${err.message}`); failed++ }
        }
      })
      run()
      return { success, failed, errors }
    } catch (err: any) {
      console.error('[excel:import] Error:', err.message)
      return { success: 0, failed: 0, errors: [String(err?.message || err)] }
    }
  })

  // Backup: select directory
  ipcMain.handle('backup:select-dir', async (event) => {
    try {
      const win = getWin(event)
      const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'], title: 'اختر مجلد'
      })
      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    } catch { return null }
  })

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
        const { getDatabase } = require('./database/connection')
        const db = getDatabase()
        db.pragma('wal_checkpoint(TRUNCATE)')
      } catch {}

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

      try { const { closeDatabase } = require('./database/connection'); closeDatabase() } catch {}

      if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, dbPath + '.before-restore')
      if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal')
      if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm')
      fs.copyFileSync(srcFile, dbPath)

      try { const { getDatabase } = require('./database/connection'); getDatabase() } catch {}
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

      const { getDatabase } = require('./database/connection')
      const { exportToExcel } = require('./services/excel.service')
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

      const { getDatabase } = require('./database/connection')
      const { exportToExcel } = require('./services/excel.service')
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

  // Auto-backup with interval
  let autoBackupInterval: any = null

  const doAutoBackup = (dir: string) => {
    try {
      const fs = require('fs')
      const dbPath = path.join(app.getPath('userData'), 'minasa.db')
      if (!fs.existsSync(dbPath)) return
      try { const { getDatabase } = require('./database/connection'); getDatabase().pragma('wal_checkpoint(TRUNCATE)') } catch {}
      const date = new Date().toISOString().split('T')[0]
      const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-')
      fs.copyFileSync(dbPath, path.join(dir, `minasa-auto-${date}_${time}.db`))
      console.log('[auto-backup] Done')
    } catch (e: any) { console.error('[auto-backup] Error:', e.message) }
  }

  const startAutoBackup = (dir: string, hours: number) => {
    if (autoBackupInterval) clearInterval(autoBackupInterval)
    if (dir && hours > 0) {
      doAutoBackup(dir) // First backup now
      autoBackupInterval = setInterval(() => doAutoBackup(dir), hours * 60 * 60 * 1000)
    }
  }

  ipcMain.handle('backup:auto-setup', async (event, dirPath: string, intervalHours: number) => {
    try {
      // Save to persistent config
      const configPath = path.join(app.getPath('userData'), 'minasa-config.json')
      let config: any = {}
      try { config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8')) } catch {}
      config.auto_backup_dir = dirPath
      config.auto_backup_hours = intervalHours
      require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2))
      // Also save to DB settings if available
      try {
        const { getDatabase } = require('./database/connection')
        const db = getDatabase()
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_backup_dir', ?)").run(dirPath)
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_backup_hours', ?)").run(String(intervalHours))
      } catch {}
      startAutoBackup(dirPath, intervalHours)
      return { success: true }
    } catch { return { success: false } }
  })

  ipcMain.handle('backup:auto-stop', () => {
    if (autoBackupInterval) { clearInterval(autoBackupInterval); autoBackupInterval = null }
    try {
      const configPath = path.join(app.getPath('userData'), 'minasa-config.json')
      let config: any = {}
      try { config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8')) } catch {}
      delete config.auto_backup_dir; delete config.auto_backup_hours
      require('fs').writeFileSync(configPath, JSON.stringify(config, null, 2))
    } catch {}
    try {
      const { getDatabase } = require('./database/connection'); const db = getDatabase()
      db.prepare("DELETE FROM settings WHERE key = 'auto_backup_dir'").run()
      db.prepare("DELETE FROM settings WHERE key = 'auto_backup_hours'").run()
    } catch {}
    return { success: true }
  })

  ipcMain.handle('backup:auto-get', () => {
    // Try persistent config first
    try {
      const configPath = path.join(app.getPath('userData'), 'minasa-config.json')
      const config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'))
      if (config.auto_backup_dir) return { dir: config.auto_backup_dir, hours: config.auto_backup_hours || 0 }
    } catch {}
    // Fallback to DB
    try {
      const { getDatabase } = require('./database/connection'); const db = getDatabase()
      const dir = db.prepare("SELECT value FROM settings WHERE key = 'auto_backup_dir'").get() as any
      const hours = db.prepare("SELECT value FROM settings WHERE key = 'auto_backup_hours'").get() as any
      return { dir: dir?.value || '', hours: Number(hours?.value) || 0 }
    } catch { return { dir: '', hours: 0 } }
  })

  // Start auto-backup from saved settings on launch
  setTimeout(() => {
    try {
      const configPath = path.join(app.getPath('userData'), 'minasa-config.json')
      const config = JSON.parse(require('fs').readFileSync(configPath, 'utf-8'))
      if (config.auto_backup_dir && config.auto_backup_hours > 0) {
        startAutoBackup(config.auto_backup_dir, config.auto_backup_hours)
        console.log('[auto-backup] Started from config:', config.auto_backup_dir, 'every', config.auto_backup_hours, 'hours')
      }
    } catch {}
  }, 5000)
}

// ===== SQLite IPC (may fail on some systems) =====
function tryRegisterLocalIPC() {
  try {
    const { registerAllIPC } = require('./ipc/handlers')
    registerAllIPC()
    console.log('Local SQLite IPC registered successfully')
  } catch (err: any) {
    console.error('Failed to register SQLite IPC:', err.message)
  }
}

// ===== Auto-updater =====
function setupAutoUpdater() {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', { version: info.version, releaseNotes: info.releaseNotes })
  })
  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-progress', { percent: Math.round(progress.percent) })
  })
  autoUpdater.on('update-downloaded', () => { mainWindow?.webContents.send('update-downloaded') })
  autoUpdater.on('error', (err) => { console.error('Updater error:', err) })

  ipcMain.handle('updater:check', () => { autoUpdater.checkForUpdates().catch(() => {}) })
  ipcMain.handle('updater:download', () => { autoUpdater.downloadUpdate().catch(() => {}) })
  ipcMain.handle('updater:install', () => { autoUpdater.quitAndInstall() })

  setInterval(() => { autoUpdater.checkForUpdates().catch(() => {}) }, 30 * 60 * 1000)
  setTimeout(() => { autoUpdater.checkForUpdates().catch(() => {}) }, 10000)
}

app.whenReady().then(() => {
  registerFileIPC()      // Always works (file dialogs + xlsx)
  tryRegisterLocalIPC()  // May fail (SQLite)
  createWindow()
  setupAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
