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
    try { require('fs').writeFileSync(configPath, JSON.stringify(data, null, 2)) } catch (err) { console.error('[config:save] Failed to write config:', err) }
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

  // Sync handlers removed - sync now handled in index.ts
}
