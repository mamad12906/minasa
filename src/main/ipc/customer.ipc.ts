import { ipcMain } from 'electron'
import {
  listCustomers, getCustomer, createCustomer, updateCustomer,
  deleteCustomer, getDistinctPlatforms, getDistinctCategories,
  getActiveReminders, getAllReminders, markReminderDone, deleteReminder,
  syncCustomerReminder, getCustomerReminders, postponeReminder, reReminder,
  createReminder
} from '../database/customers'

function addMonthsToDate(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

export function registerCustomerIPC(): void {
  ipcMain.handle('customer:list', (_event, params) => listCustomers(params))
  ipcMain.handle('customer:get', (_event, id: number) => getCustomer(id))

  ipcMain.handle('customer:create', (_event, input) => {
    const customer = createCustomer(input)

    // Manual reminder
    if (input.reminder_date && input.reminder_text) {
      syncCustomerReminder(customer.id, input.reminder_date, input.reminder_text)
    }

    // Auto-reminder: 2 months before months_count expires
    if (input.months_count && input.months_count > 2) {
      const startDate = customer.created_at.split(' ')[0] // YYYY-MM-DD
      const reminderDate = addMonthsToDate(startDate, input.months_count - 2)
      createReminder(customer.id, reminderDate, `تنبيه: باقي شهرين على انتهاء مدة ${input.months_count} شهر`)
    }

    return customer
  })

  ipcMain.handle('customer:update', (_event, id: number, input) => {
    const customer = updateCustomer(id, input)
    syncCustomerReminder(id, input.reminder_date || '', input.reminder_text || '')
    return customer
  })

  ipcMain.handle('customer:delete', (_event, id: number) => {
    deleteCustomer(id); return { success: true }
  })

  ipcMain.handle('customer:platforms', () => getDistinctPlatforms())
  ipcMain.handle('customer:categories', () => getDistinctCategories())
  ipcMain.handle('customer:reminders', (_event, customerId: number) => getCustomerReminders(customerId))

  // Reminders - filter by userId (not platform)
  ipcMain.handle('reminders:active', (_event, userId?: number) => getActiveReminders(userId))
  ipcMain.handle('reminders:all', (_event, userId?: number) => getAllReminders(userId))

  ipcMain.handle('reminders:done', (_event, id: number, handledBy: string, handleMethod: string) => {
    markReminderDone(id, handledBy || '', handleMethod || ''); return { success: true }
  })

  ipcMain.handle('reminders:postpone', (_event, id: number, newDate: string, reason: string) => {
    postponeReminder(id, newDate, reason); return { success: true }
  })

  ipcMain.handle('reminders:reremind', (_event, id: number, newDate: string, reason: string) => {
    reReminder(id, newDate, reason); return { success: true }
  })

  ipcMain.handle('reminders:delete', (_event, id: number) => {
    deleteReminder(id); return { success: true }
  })
}
