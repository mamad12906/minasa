import { ipcMain } from 'electron'
import { registerCustomerIPC } from './customer.ipc'
import { registerExcelIPC } from './excel.ipc'
import { registerColumnsIPC } from './columns.ipc'
import { registerUsersIPC } from './users.ipc'
import { getDashboardStats } from '../database/invoices'

export function registerAllIPC(): void {
  registerCustomerIPC()
  registerExcelIPC()
  registerColumnsIPC()
  registerUsersIPC()

  ipcMain.handle('dashboard:stats', (_event, userId?: number) => {
    return getDashboardStats(userId)
  })
}
