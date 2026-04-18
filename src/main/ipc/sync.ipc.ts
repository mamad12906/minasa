import { BrowserWindow, ipcMain } from 'electron'

// Shared server request helper (used by delete-all, delete-user, sync-push)
function serverRequest(method: string, serverUrl: string, urlPath: string, token: string, apiKey: string, body?: any): Promise<any> {
  const https = require('https'); const http = require('http')
  return new Promise((resolve) => {
    const fullUrl = `${serverUrl}${urlPath}`
    const headers: any = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    if (apiKey) headers['x-api-key'] = apiKey
    const req = (fullUrl.startsWith('https') ? https : http).request(fullUrl, { method, headers }, (res: any) => {
      let d = ''; res.on('data', (c: any) => d += c)
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(d) }) } catch { resolve({ status: res.statusCode, data: d }) } })
    })
    req.on('error', () => resolve({ status: 0, data: null }))
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

export function register(getMainWindow: () => BrowserWindow | null): void {
  // Delete ALL customers - local + server (1 SQL command each, instant)
  ipcMain.handle('db:delete-all-customers', async (_event, serverUrl?: string, token?: string, apiKey?: string) => {
    try {
      const { getDatabase } = require('../database/connection')
      const db = getDatabase()
      const count = (db.prepare('SELECT COUNT(*) as c FROM customers').get() as any).c
      db.exec('DELETE FROM reminders')
      db.exec('DELETE FROM customers')

      let serverDeleted = 0
      if (serverUrl) {
        const res = await serverRequest('DELETE', serverUrl, '/api/customers/all/delete', token || '', apiKey || '')
        serverDeleted = res?.data?.deleted || 0
      }
      return { success: true, deleted: count, serverDeleted }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Delete user's customers - local + server (1 SQL command each, instant)
  ipcMain.handle('db:delete-user-customers', async (_event, userId: number, serverUrl?: string, token?: string, apiKey?: string) => {
    try {
      const { getDatabase } = require('../database/connection')
      const db = getDatabase()
      const count = (db.prepare('SELECT COUNT(*) as c FROM customers WHERE user_id = ?').get(userId) as any).c
      db.prepare('DELETE FROM reminders WHERE customer_id IN (SELECT id FROM customers WHERE user_id = ?)').run(userId)
      db.prepare('DELETE FROM customers WHERE user_id = ?').run(userId)

      let serverDeleted = 0
      if (serverUrl) {
        const res = await serverRequest('DELETE', serverUrl, `/api/customers/user/${userId}/delete`, token || '', apiKey || '')
        serverDeleted = res?.data?.deleted || 0
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

    try {
      const { getDatabase } = require('../database/connection')
      const db = getDatabase()
      const customers = db.prepare('SELECT * FROM customers').all()

      // First get existing customers from server to check duplicates
      let serverCustomers: any[] = []
      try {
        const res = await serverRequest('GET', serverUrl, '/api/customers?page=1&pageSize=50000', token, apiKey)
        serverCustomers = res?.data?.data || []
      } catch (err) { console.error('[sync:push] Failed to fetch server customers:', err) }

      // Build server lookup: full_name+mother_name+phone
      const serverSet = new Set(serverCustomers.map((c: any) =>
        `${(c.full_name || '').trim()}|${(c.mother_name || '').trim()}|${(c.phone_number || '').trim()}`
      ))

      let synced = 0, skipped = 0, failed = 0

      for (const c of customers) {
        const key = `${(c.full_name || '').trim()}|${(c.mother_name || '').trim()}|${(c.phone_number || '').trim()}`
        if (serverSet.has(key)) { skipped++; continue } // Already on server

        const res = await serverRequest('POST', serverUrl, '/api/customers', token, apiKey, c)
        if (res.status >= 200 && res.status < 300) {
          synced++
          serverSet.add(key) // Prevent sending same customer twice
        } else { failed++ }

        // Send progress to renderer
        const mainWindow = getMainWindow()
        if (mainWindow && (synced + skipped + failed) % 50 === 0) {
          mainWindow.webContents.send('sync-progress', { synced, skipped, failed, total: customers.length })
        }
      }

      pushInProgress = false
      // Notify renderer
      const mainWindow = getMainWindow()
      if (mainWindow) mainWindow.webContents.send('sync-progress', { synced, skipped, failed, total: customers.length, done: true })
      return { success: true, synced, skipped, failed, total: customers.length }
    } catch (err: any) {
      console.error('[sync:push] ERROR:', err.message)
      pushInProgress = false
      return { success: false, synced: 0, failed: 0, error: err.message }
    }
  })
}
