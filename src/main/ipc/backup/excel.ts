import { ipcMain, dialog } from 'electron'
import path from 'path'
import { getWin } from './shared'

export function registerExcelExport(): void {
  // Dump every customer — admin-wide export.
  ipcMain.handle('backup:excel-all', async (event) => {
    try {
      const win = getWin(event)
      const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'], title: 'اختر مكان حفظ التصدير'
      })
      if (result.canceled || result.filePaths.length === 0) return null

      const { getDatabase } = require('../../database/connection')
      const { exportToExcel } = require('../../services/excel.service')
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

  // Per-user export for the current user's customer list.
  ipcMain.handle('backup:excel-user', async (event, userId: number, userName: string) => {
    try {
      const win = getWin(event)
      const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'], title: 'اختر مكان حفظ التصدير'
      })
      if (result.canceled || result.filePaths.length === 0) return null

      const { getDatabase } = require('../../database/connection')
      const { exportToExcel } = require('../../services/excel.service')
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
}
