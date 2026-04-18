import { ipcMain } from 'electron'
import {
  listCustomers, getCustomer, createCustomer, updateCustomer,
  deleteCustomer, getDistinctPlatforms, getDistinctCategories,
  getActiveReminders, getAllReminders, markReminderDone, deleteReminder,
  syncCustomerReminder, getCustomerReminders, postponeReminder, reReminder,
  createReminder
} from '../database/customers'
import { logAudit } from '../database/audit'
import { calculateReminderDate, calculateExpiryDate } from '../../shared/reminder-utils'

export function registerCustomerIPC(): void {
  ipcMain.handle('customer:list', (_event, params) => listCustomers(params))
  ipcMain.handle('customer:get', (_event, id: number) => getCustomer(id))

  ipcMain.handle('customer:create', (_event, input) => {
    const customer = createCustomer(input)
    if (input.reminder_date && input.reminder_text) {
      syncCustomerReminder(customer.id, input.reminder_date, input.reminder_text)
    }
    if (input.months_count && input.months_count > 0) {
      const startDate = customer.created_at.split(' ')[0]
      const endDate = calculateExpiryDate(startDate, input.months_count)
      const reminderDate = input.reminder_date || calculateReminderDate(startDate, input.months_count, input.reminder_before || 2)
      const reminderText = input.reminder_text || `تذكير: انتهاء المدة (${input.months_count} شهر) بتاريخ ${endDate}`
      if (reminderDate) createReminder(customer.id, reminderDate, reminderText)
    }
    logAudit(input.user_id || 0, '', 'إضافة', 'customer', customer.id, `إضافة زبون: ${customer.full_name}`)
    return customer
  })

  ipcMain.handle('customer:update', (_event, id: number, input) => {
    const old = getCustomer(id)
    const customer = updateCustomer(id, input)
    syncCustomerReminder(id, input.reminder_date || '', input.reminder_text || '')
    // Log changes
    const changes: string[] = []
    if (old) {
      if (old.full_name !== input.full_name) changes.push(`الاسم: ${old.full_name} → ${input.full_name}`)
      if (old.phone_number !== input.phone_number) changes.push(`الهاتف: ${old.phone_number} → ${input.phone_number}`)
      if (old.category !== input.category) changes.push(`الصنف: ${old.category} → ${input.category}`)
      if (old.ministry_name !== input.ministry_name) changes.push(`الوزارة: ${old.ministry_name} → ${input.ministry_name}`)
      if (old.status_note !== input.status_note) changes.push(`الحالة: ${old.status_note} → ${input.status_note}`)
      if (old.platform_name !== input.platform_name) changes.push(`المنصة: ${old.platform_name} → ${input.platform_name}`)
      if (String(old.months_count) !== String(input.months_count)) changes.push(`الأشهر: ${old.months_count} → ${input.months_count}`)
      if (old.user_id !== input.user_id) changes.push(`نقل لموظف آخر`)
    }
    logAudit(input.user_id || 0, '', 'تعديل', 'customer', id, changes.length > 0 ? changes.join(' | ') : `تعديل زبون: ${customer.full_name}`)
    return customer
  })

  ipcMain.handle('customer:delete', (_event, id: number) => {
    const old = getCustomer(id)
    deleteCustomer(id)
    logAudit(0, '', 'حذف', 'customer', id, `حذف زبون: ${old?.full_name || id}`)
    return { success: true }
  })

  // Customer edit history from audit log
  ipcMain.handle('customer:history', (_event, customerId: number) => {
    try {
      const { getDatabase } = require('../database/connection')
      const db = getDatabase()
      return db.prepare("SELECT * FROM audit_log WHERE entity_type = 'customer' AND entity_id = ? ORDER BY created_at DESC").all(customerId)
    } catch { return [] }
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
