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

  // Read Excel - get ALL columns, no conditions, super simple
  ipcMain.handle('excel:readHeaders', (_event, filePath: string) => {
    console.log('[readHeaders] START:', filePath)
    const empty = { headers: [], hasHeaderRow: false, totalRows: 0, preview: [] }
    try {
      const XLSX = require('xlsx')
      const fs = require('fs')
      console.log('[readHeaders] XLSX loaded')
      // Read file as buffer first (avoids permission issues)
      const buffer = fs.readFileSync(filePath)
      console.log('[readHeaders] File buffer size:', buffer.length)
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      console.log('[readHeaders] File read, sheets:', workbook.SheetNames)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!sheet) { console.log('[readHeaders] No sheet'); return empty }

      // Simple approach: get ref range
      const ref = sheet['!ref']
      console.log('[readHeaders] Ref:', ref)
      if (!ref) return empty

      // Read all data as array of arrays
      const allRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
      console.log('[readHeaders] Total rows:', allRows.length)
      if (allRows.length === 0) return empty

      // Find max columns
      let maxCols = 0
      for (let i = 0; i < Math.min(allRows.length, 20); i++) {
        if (allRows[i] && allRows[i].length > maxCols) maxCols = allRows[i].length
      }
      console.log('[readHeaders] Max cols:', maxCols)

      // Build headers from first row
      const firstRow = allRows[0] || []
      const headers: string[] = []
      for (let c = 0; c < maxCols; c++) {
        const v = firstRow[c]
        const s = v != null && v !== '' ? String(v).trim() : ''
        headers.push(s || ('\u0639\u0645\u0648\u062f ' + (c + 1))) // عمود X
      }
      console.log('[readHeaders] Headers:', headers)

      // Guess if first row is header
      let hasNum = false
      for (const v of firstRow) {
        if (v != null && /^\d{5,}$/.test(String(v).trim())) { hasNum = true; break }
      }
      const hasHeaderRow = !hasNum && headers.some(h => !/^\u0639\u0645\u0648\u062f \d+$/.test(h))

      // Preview
      const start = hasHeaderRow ? 1 : 0
      const preview: string[][] = []
      for (let r = start; r < Math.min(start + 3, allRows.length); r++) {
        const row: string[] = []
        for (let c = 0; c < maxCols; c++) {
          row.push(allRows[r] && allRows[r][c] != null ? String(allRows[r][c]) : '')
        }
        preview.push(row)
      }

      const result = { headers, hasHeaderRow, totalRows: allRows.length - (hasHeaderRow ? 1 : 0), preview }
      console.log('[readHeaders] SUCCESS:', headers.length, 'cols,', result.totalRows, 'rows')
      return result
    } catch (err: any) {
      console.error('[readHeaders] ERROR:', err.message, err.stack)
      return empty
    }
  })

  // Import Excel data - supports files with and without header row
  ipcMain.handle('excel:import', (_event, filePath: string, mapping: any) => {
    console.log('[excel:import] START file:', filePath)
    console.log('[excel:import] Mapping keys:', Object.keys(mapping || {}))
    try {
      const XLSX = require('xlsx')
      const forcePlatform = (mapping as any).__force_platform__ || ''
      const hasHeaderRow = (mapping as any).__has_header_row__ !== false
      const forceUserId = (mapping as any).__user_id__ || 0
      delete (mapping as any).__force_platform__
      delete (mapping as any).__has_header_row__
      delete (mapping as any).__user_id__

      const fs = require('fs')
      const buffer = fs.readFileSync(filePath)
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]

      // Read as raw array of arrays
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]
      if (!rawData || rawData.length === 0) return { success: 0, failed: 0, errors: ['الملف فارغ'] }

      // Build headers from first row (or generate)
      const firstRow = rawData[0] || []
      const totalCols = Math.max(...rawData.slice(0, 10).map(r => (r || []).length), 0)
      const headers: string[] = []
      for (let c = 0; c < totalCols; c++) {
        const val = firstRow[c] != null ? String(firstRow[c]).trim() : ''
        headers.push(val || `عمود ${c + 1}`)
      }

      // Data rows (skip header if exists)
      const dataStart = hasHeaderRow ? 1 : 0
      const dataRows = rawData.slice(dataStart)
      if (dataRows.length === 0) return { success: 0, failed: 0, errors: ['لا توجد بيانات'] }

      const { getDatabase } = require('./database/connection')
      const db = getDatabase()

      const getValue = (row: any[], field: string): string => {
        for (const [excelCol, dbField] of Object.entries(mapping)) {
          if (dbField === field) {
            const colIdx = headers.indexOf(excelCol)
            if (colIdx >= 0 && row[colIdx] != null) return String(row[colIdx]).trim()
          }
        }
        return ''
      }

      let customCols: string[] = []
      try { customCols = db.prepare("SELECT column_name FROM custom_columns WHERE table_name = 'customers'").all().map((r: any) => r.column_name) } catch {}

      const baseFields = ['platform_name', 'full_name', 'mother_name', 'phone_number', 'card_number', 'category', 'ministry_name', 'status_note', 'reminder_date', 'reminder_text', 'user_id', 'months_count', 'notes']
      const allFields = [...baseFields, ...customCols]
      const stmt = db.prepare(`INSERT INTO customers (${allFields.join(', ')}) VALUES (${allFields.map(() => '?').join(', ')})`)
      // Duplicate check: same full_name + mother_name + phone_number
      const checkDup = db.prepare('SELECT id FROM customers WHERE full_name = ? AND mother_name = ? AND phone_number = ?')

      let success = 0, failed = 0, skipped = 0
      const errors: string[] = []

      const run = db.transaction(() => {
        for (let i = 0; i < dataRows.length; i++) {
          try {
            const row = dataRows[i]
            if (!row || row.every((v: any) => !v || String(v).trim() === '')) continue

            const fullName = getValue(row, 'full_name')
            if (!fullName) { failed++; continue }

            const motherName = getValue(row, 'mother_name')
            const phone = getValue(row, 'phone_number')

            // Skip duplicate
            const existing = checkDup.get(fullName, motherName, phone)
            if (existing) { skipped++; continue }

            const vals = [
              forcePlatform || getValue(row, 'platform_name'), fullName, motherName,
              phone, getValue(row, 'card_number'), getValue(row, 'category'),
              getValue(row, 'ministry_name'), getValue(row, 'status_note'), getValue(row, 'reminder_date'),
              getValue(row, 'reminder_text'), forceUserId || parseInt(getValue(row, 'user_id')) || 0,
              parseInt(getValue(row, 'months_count')) || 0, getValue(row, 'notes'),
              ...customCols.map(c => getValue(row, c))
            ]
            stmt.run(...vals)
            success++
          } catch (err: any) { errors.push(`صف ${i + dataStart + 1}: ${err.message}`); failed++ }
        }
      })
      run()
      console.log('[excel:import] DONE success:', success, 'failed:', failed, 'skipped:', skipped)
      if (skipped > 0) errors.unshift(`تم تخطي ${skipped} اسم مكرر`)
      return { success, failed, errors }
    } catch (err: any) {
      console.error('[excel:import] ERROR:', err.message, err.stack)
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

  // ===== Full Sync: runs entirely in main process =====
  ipcMain.handle('sync:full', async (_event, serverUrl: string, token: string, apiKey: string) => {
    console.log('[sync:full] START')
    if (!serverUrl) return { success: false, details: 'لا يوجد رابط سيرفر' }

    const https = require('https')
    const http = require('http')
    const results: string[] = []

    const doGet = (urlPath: string): Promise<any> => {
      return new Promise((resolve) => {
        const headers: any = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        if (apiKey) headers['x-api-key'] = apiKey
        const req = (serverUrl.startsWith('https') ? https : http).request(`${serverUrl}${urlPath}`, { method: 'GET', headers }, (res: any) => {
          let d = ''; res.on('data', (c: any) => d += c)
          res.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve(null) } })
        })
        req.on('error', () => resolve(null))
        req.end()
      })
    }

    const doPost = (urlPath: string, body: any): Promise<any> => {
      return new Promise((resolve) => {
        const headers: any = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        if (apiKey) headers['x-api-key'] = apiKey
        const req = (serverUrl.startsWith('https') ? https : http).request(`${serverUrl}${urlPath}`, { method: 'POST', headers }, (res: any) => {
          let d = ''; res.on('data', (c: any) => d += c)
          res.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve(null) } })
        })
        req.on('error', () => resolve(null))
        req.write(JSON.stringify(body))
        req.end()
      })
    }

    try {
      const { getDatabase } = require('./database/connection')
      const db = getDatabase()

      // Step 1: Get local customers
      const localCustomers = db.prepare('SELECT * FROM customers').all() as any[]
      console.log('[sync:full] Local:', localCustomers.length)

      // Step 2: Get server customers (paginated)
      let serverCustomers: any[] = []
      let sPage = 1
      while (true) {
        const sRes = await doGet(`/api/customers?page=${sPage}&pageSize=200`)
        const sData = sRes?.data || []
        if (sData.length === 0) break
        serverCustomers.push(...sData)
        if (serverCustomers.length >= (sRes.total || 0)) break
        sPage++
      }
      console.log('[sync:full] Server:', serverCustomers.length)

      // Step 3: Push local-only to server
      const serverSet = new Set(serverCustomers.map((c: any) =>
        `${(c.full_name || '').trim()}|${(c.mother_name || '').trim()}|${(c.phone_number || '').trim()}`
      ))
      let pushed = 0
      for (const c of localCustomers) {
        const key = `${(c.full_name || '').trim()}|${(c.mother_name || '').trim()}|${(c.phone_number || '').trim()}`
        if (!serverSet.has(key)) {
          await doPost('/api/customers', c)
          pushed++
        }
      }
      if (pushed > 0) results.push(`رُفع ${pushed} جديد`)
      console.log('[sync:full] Pushed:', pushed)

      // Step 4: Clear local and download fresh from server (paginated)
      db.exec('DELETE FROM customers')
      const stmt = db.prepare(`INSERT INTO customers (platform_name, full_name, mother_name, phone_number, card_number, category, ministry_name, status_note, months_count, notes, user_id, reminder_date, reminder_text, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)

      let totalInserted = 0
      let page = 1
      while (true) {
        const pageRes = await doGet(`/api/customers?page=${page}&pageSize=200`)
        const pageData = pageRes?.data || []
        if (pageData.length === 0) break

        const insertBatch = db.transaction(() => {
          for (const c of pageData) {
            stmt.run(
              c.platform_name || '', c.full_name || '', c.mother_name || '',
              c.phone_number || '', c.card_number || '', c.category || '',
              c.ministry_name || '', c.status_note || '', c.months_count || 0,
              c.notes || '', c.user_id || 0, c.reminder_date || '', c.reminder_text || '',
              c.created_at || '', c.updated_at || ''
            )
          }
        })
        insertBatch()
        totalInserted += pageData.length
        console.log('[sync:full] Page', page, ':', pageData.length, 'total:', totalInserted)

        if (totalInserted >= (pageRes.total || 0)) break
        page++
      }
      if (totalInserted > 0) results.push(`${totalInserted} زبون محلياً`)

      // Step 6: Sync users
      try {
        const users = await doGet('/api/users')
        if (Array.isArray(users) && users.length > 0) {
          for (const u of users) {
            db.prepare('INSERT OR REPLACE INTO users (id, username, password, display_name, role, permissions, platform_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
              .run(u.id, u.username || '', u.password || 'synced', u.display_name || '', u.role || 'user', u.permissions || '{}', u.platform_name || '', u.created_at || '')
          }
          results.push(`${users.length} مستخدم`)
        }
      } catch {}

      console.log('[sync:full] DONE:', results.join(', '))
      return { success: true, details: results.length > 0 ? results.join(' | ') : 'لا توجد بيانات جديدة' }
    } catch (err: any) {
      console.error('[sync:full] ERROR:', err.message)
      return { success: false, details: err.message }
    }
  })

  // Fast server request helper
  const serverRequest = (method: string, serverUrl: string, urlPath: string, token: string, apiKey: string): Promise<any> => {
    const https = require('https'); const http = require('http')
    return new Promise((resolve) => {
      const headers: any = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (apiKey) headers['x-api-key'] = apiKey
      const req = (serverUrl.startsWith('https') ? https : http).request(`${serverUrl}${urlPath}`, { method, headers }, (res: any) => {
        let d = ''; res.on('data', (c: any) => d += c)
        res.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve({ status: res.statusCode }) } })
      })
      req.on('error', () => resolve(null))
      req.end()
    })
  }

  // Delete ALL customers - local + server (1 SQL command each, instant)
  ipcMain.handle('db:delete-all-customers', async (_event, serverUrl?: string, token?: string, apiKey?: string) => {
    try {
      const { getDatabase } = require('./database/connection')
      const db = getDatabase()
      const count = (db.prepare('SELECT COUNT(*) as c FROM customers').get() as any).c
      db.exec('DELETE FROM reminders')
      db.exec('DELETE FROM customers')
      console.log('[delete-all] Local:', count)

      let serverDeleted = 0
      if (serverUrl) {
        const res = await serverRequest('DELETE', serverUrl, '/api/customers/all/delete', token || '', apiKey || '')
        serverDeleted = res?.deleted || 0
        console.log('[delete-all] Server:', serverDeleted)
      }
      return { success: true, deleted: count, serverDeleted }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Delete user's customers - local + server (1 SQL command each, instant)
  ipcMain.handle('db:delete-user-customers', async (_event, userId: number, serverUrl?: string, token?: string, apiKey?: string) => {
    try {
      const { getDatabase } = require('./database/connection')
      const db = getDatabase()
      const count = (db.prepare('SELECT COUNT(*) as c FROM customers WHERE user_id = ?').get(userId) as any).c
      db.exec(`DELETE FROM reminders WHERE customer_id IN (SELECT id FROM customers WHERE user_id = ${userId})`)
      db.prepare('DELETE FROM customers WHERE user_id = ?').run(userId)
      console.log('[delete-user] Local:', count)

      let serverDeleted = 0
      if (serverUrl) {
        const res = await serverRequest('DELETE', serverUrl, `/api/customers/user/${userId}/delete`, token || '', apiKey || '')
        serverDeleted = res?.deleted || 0
        console.log('[delete-user] Server:', serverDeleted)
      }
      return { success: true, deleted: count, serverDeleted }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Push all local customers to server (runs in main process - survives page changes)
  let pushInProgress = false
  ipcMain.handle('sync:push-all-to-server', async (_event, serverUrl: string, token: string, apiKey: string) => {
    if (pushInProgress) return { success: false, error: 'المزامنة قيد التنفيذ' }
    pushInProgress = true
    console.log('[sync:push] Starting...')

    try {
      const { getDatabase } = require('./database/connection')
      const db = getDatabase()
      const customers = db.prepare('SELECT * FROM customers').all()
      console.log('[sync:push] Local customers:', customers.length)

      const https = require('https')
      const http = require('http')

      const doRequest = (method: string, urlPath: string, body: any): Promise<any> => {
        return new Promise((resolve) => {
          const fullUrl = `${serverUrl}${urlPath}`
          const headers: any = { 'Content-Type': 'application/json' }
          if (token) headers['Authorization'] = `Bearer ${token}`
          if (apiKey) headers['x-api-key'] = apiKey
          const req = (fullUrl.startsWith('https') ? https : http).request(fullUrl, { method, headers }, (res: any) => {
            let data = ''
            res.on('data', (d: any) => data += d)
            res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(data) }) } catch { resolve({ status: res.statusCode, data }) } })
          })
          req.on('error', () => resolve({ status: 0, data: null }))
          if (body) req.write(JSON.stringify(body))
          req.end()
        })
      }

      // First get existing customers from server to check duplicates
      let serverCustomers: any[] = []
      try {
        const res = await doRequest('GET', '/api/customers?page=1&pageSize=50000', null)
        serverCustomers = res?.data?.data || []
        console.log('[sync:push] Server has:', serverCustomers.length, 'customers')
      } catch {}

      // Build server lookup: full_name+mother_name+phone
      const serverSet = new Set(serverCustomers.map((c: any) =>
        `${(c.full_name || '').trim()}|${(c.mother_name || '').trim()}|${(c.phone_number || '').trim()}`
      ))

      let synced = 0, skipped = 0, failed = 0

      for (const c of customers) {
        const key = `${(c.full_name || '').trim()}|${(c.mother_name || '').trim()}|${(c.phone_number || '').trim()}`
        if (serverSet.has(key)) { skipped++; continue } // Already on server

        const res = await doRequest('POST', '/api/customers', c)
        if (res.status >= 200 && res.status < 300) {
          synced++
          serverSet.add(key) // Prevent sending same customer twice
        } else { failed++ }

        // Send progress to renderer
        if (mainWindow && (synced + skipped + failed) % 50 === 0) {
          mainWindow.webContents.send('sync-progress', { synced, skipped, failed, total: customers.length })
        }
      }

      console.log('[sync:push] DONE synced:', synced, 'skipped:', skipped, 'failed:', failed)
      pushInProgress = false
      // Notify renderer
      if (mainWindow) mainWindow.webContents.send('sync-progress', { synced, skipped, failed, total: customers.length, done: true })
      return { success: true, synced, skipped, failed, total: customers.length }
    } catch (err: any) {
      console.error('[sync:push] ERROR:', err.message)
      pushInProgress = false
      return { success: false, synced: 0, failed: 0, error: err.message }
    }
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
