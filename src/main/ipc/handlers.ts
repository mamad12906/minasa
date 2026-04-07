import { ipcMain, Notification, BrowserWindow } from 'electron'
import { registerCustomerIPC } from './customer.ipc'
import { registerInvoiceIPC } from './invoice.ipc'
import { registerColumnsIPC } from './columns.ipc'
import { registerUsersIPC } from './users.ipc'
import { getDashboardStats } from '../database/invoices'
import { getDatabase } from '../database/connection'
import { logAudit, getAuditLog } from '../database/audit'
import { getActiveReminders } from '../database/customers'

export function registerAllIPC(): void {
  registerCustomerIPC()
  registerInvoiceIPC()
  registerColumnsIPC()
  registerUsersIPC()

  ipcMain.handle('dashboard:stats', (_event, userId?: number) => {
    return getDashboardStats(userId)
  })

  // === Persistent Config (survives updates) ===
  const configPath = require('path').join(require('electron').app.getPath('userData'), 'minasa-config.json')
  const loadConfig = (): any => {
    try { return JSON.parse(require('fs').readFileSync(configPath, 'utf-8')) } catch { return {} }
  }
  const saveConfig = (data: any) => {
    try { require('fs').writeFileSync(configPath, JSON.stringify(data, null, 2)) } catch {}
  }

  ipcMain.handle('config:get', () => loadConfig())
  ipcMain.handle('config:set', (_event, key: string, value: string) => {
    const config = loadConfig()
    config[key] = value
    saveConfig(config)
    return { success: true }
  })

  // App version
  ipcMain.handle('app:version', () => require('electron').app.getVersion())

  // === Audit Log ===
  ipcMain.handle('audit:log', (_event, userId: number, userName: string, action: string, entityType: string, entityId: number, details: string) => {
    logAudit(userId, userName, action, entityType, entityId, details)
    return { success: true }
  })

  ipcMain.handle('audit:list', (_event, params: any) => {
    return getAuditLog(params)
  })

  // === Desktop Notifications for Reminders ===
  function checkAndNotifyReminders() {
    try {
      const reminders = getActiveReminders()
      if (reminders && reminders.length > 0) {
        const notification = new Notification({
          title: `منصة - ${reminders.length} تذكير مستحق`,
          body: reminders.slice(0, 3).map((r: any) => `${r.full_name}: ${r.reminder_text}`).join('\n'),
          silent: false
        })
        notification.show()
        notification.on('click', () => {
          const win = BrowserWindow.getAllWindows()[0]
          if (win) { win.show(); win.focus() }
        })
      }
    } catch { /* ignore */ }
  }

  // Check reminders every 10 minutes
  setInterval(checkAndNotifyReminders, 10 * 60 * 1000)
  // First check after 30 seconds
  setTimeout(checkAndNotifyReminders, 30000)

  // === Sync: Pull all data from server into local DB ===
  ipcMain.handle('sync:pull-customers', (_event, customers: any[]) => {
    if (!customers || !Array.isArray(customers)) return { success: false }
    const db = getDatabase()
    const checkDup = db.prepare('SELECT id FROM customers WHERE full_name = ? AND mother_name = ? AND phone_number = ? AND created_at = ?')
    const insert = db.prepare(`
      INSERT INTO customers (platform_name, full_name, mother_name, phone_number, card_number, category, ministry_name, status_note, months_count, notes, user_id, reminder_date, reminder_text, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    let added = 0, skipped = 0
    const run = db.transaction(() => {
      for (const c of customers) {
        const exists = checkDup.get(c.full_name || '', c.mother_name || '', c.phone_number || '', c.created_at || '')
        if (exists) { skipped++; continue }
        insert.run(
          c.platform_name || '', c.full_name || '', c.mother_name || '',
          c.phone_number || '', c.card_number || '', c.category || '',
          c.ministry_name || '', c.status_note || '', c.months_count || 0,
          c.notes || '', c.user_id || 0, c.reminder_date || '', c.reminder_text || '',
          c.created_at || '', c.updated_at || ''
        )
        added++
      }
    })
    run()
    console.log('[sync:pull-customers] Added:', added, 'Skipped:', skipped)
    return { success: true, count: added, skipped }
  })

  ipcMain.handle('sync:pull-users', (_event, users: any[]) => {
    if (!users || !Array.isArray(users)) return { success: false }
    const db = getDatabase()
    const insert = db.transaction(() => {
      for (const u of users) {
        db.prepare(`
          INSERT OR REPLACE INTO users (id, username, password, display_name, role, permissions, platform_name, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          u.id, u.username || '', u.password || 'synced', u.display_name || '',
          u.role || 'user', u.permissions || '{}', u.platform_name || '', u.created_at || ''
        )
      }
    })
    insert()
    return { success: true, count: users.length }
  })

  ipcMain.handle('sync:pull-platforms', (_event, platforms: any[]) => {
    if (!platforms || !Array.isArray(platforms)) return { success: false }
    const db = getDatabase()
    const insert = db.transaction(() => {
      for (const p of platforms) {
        db.prepare('INSERT OR REPLACE INTO platforms (id, name) VALUES (?, ?)').run(p.id, p.name)
      }
    })
    insert()
    return { success: true, count: platforms.length }
  })

  ipcMain.handle('sync:pull-categories', (_event, categories: any[]) => {
    if (!categories || !Array.isArray(categories)) return { success: false }
    const db = getDatabase()
    const insert = db.transaction(() => {
      for (const c of categories) {
        db.prepare('INSERT OR REPLACE INTO categories (id, name) VALUES (?, ?)').run(c.id, c.name)
      }
    })
    insert()
    return { success: true, count: categories.length }
  })

  ipcMain.handle('sync:pull-reminders', (_event, reminders: any[]) => {
    if (!reminders || !Array.isArray(reminders)) return { success: false }
    const db = getDatabase()
    const checkDup = db.prepare('SELECT id FROM reminders WHERE customer_id = ? AND reminder_date = ? AND reminder_text = ?')
    const insert = db.prepare(`
      INSERT INTO reminders (customer_id, reminder_date, reminder_text, is_done, handled_by, handled_at, is_postponed, postpone_reason, original_date, handle_method, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    let added = 0, skipped = 0
    const run = db.transaction(() => {
      for (const r of reminders) {
        const exists = checkDup.get(r.customer_id, r.reminder_date || '', r.reminder_text || '')
        if (exists) { skipped++; continue }
        insert.run(
          r.customer_id, r.reminder_date || '', r.reminder_text || '',
          r.is_done || 0, r.handled_by || '', r.handled_at || '',
          r.is_postponed || 0, r.postpone_reason || '', r.original_date || '',
          r.handle_method || '', r.created_at || ''
        )
        added++
      }
    })
    run()
    console.log('[sync:pull-reminders] Added:', added, 'Skipped:', skipped)
    return { success: true, count: added, skipped }
  })

  ipcMain.handle('sync:get-last-sync', () => {
    return localStorage_get('last_full_sync') || ''
  })

  ipcMain.handle('sync:set-last-sync', (_event, timestamp: string) => {
    localStorage_set('last_full_sync', timestamp)
    return { success: true }
  })
}

// Simple settings-based storage for sync timestamps
function localStorage_get(key: string): string {
  try {
    const db = getDatabase()
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any
    return row?.value || ''
  } catch { return '' }
}

function localStorage_set(key: string, value: string): void {
  try {
    const db = getDatabase()
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
  } catch { /* ignore */ }
}
