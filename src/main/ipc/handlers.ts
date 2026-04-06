import { ipcMain, Notification, BrowserWindow } from 'electron'
import { registerCustomerIPC } from './customer.ipc'
import { registerExcelIPC } from './excel.ipc'
import { registerColumnsIPC } from './columns.ipc'
import { registerUsersIPC } from './users.ipc'
import { getDashboardStats } from '../database/invoices'
import { getDatabase } from '../database/connection'
import { logAudit, getAuditLog } from '../database/audit'
import { getActiveReminders } from '../database/customers'

export function registerAllIPC(): void {
  registerCustomerIPC()
  registerExcelIPC()
  registerColumnsIPC()
  registerUsersIPC()

  ipcMain.handle('dashboard:stats', (_event, userId?: number) => {
    return getDashboardStats(userId)
  })

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
    const insert = db.transaction(() => {
      for (const c of customers) {
        // Use INSERT OR REPLACE to handle duplicates
        db.prepare(`
          INSERT OR REPLACE INTO customers (id, platform_name, full_name, mother_name, phone_number, card_number, category, ministry_name, status_note, months_count, notes, user_id, reminder_date, reminder_text, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          c.id, c.platform_name || '', c.full_name || '', c.mother_name || '',
          c.phone_number || '', c.card_number || '', c.category || '',
          c.ministry_name || '', c.status_note || '', c.months_count || 0,
          c.notes || '', c.user_id || 0, c.reminder_date || '', c.reminder_text || '',
          c.created_at || '', c.updated_at || ''
        )
      }
    })
    insert()
    return { success: true, count: customers.length }
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
    const insert = db.transaction(() => {
      for (const r of reminders) {
        db.prepare(`
          INSERT OR REPLACE INTO reminders (id, customer_id, reminder_date, reminder_text, is_done, handled_by, handled_at, is_postponed, postpone_reason, original_date, handle_method, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          r.id, r.customer_id, r.reminder_date || '', r.reminder_text || '',
          r.is_done || 0, r.handled_by || '', r.handled_at || '',
          r.is_postponed || 0, r.postpone_reason || '', r.original_date || '',
          r.handle_method || '', r.created_at || ''
        )
      }
    })
    insert()
    return { success: true, count: reminders.length }
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
