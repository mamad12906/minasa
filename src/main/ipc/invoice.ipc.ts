import { ipcMain } from 'electron'
import {
  listInvoices, getInvoice, createInvoice, updateInvoice,
  deleteInvoice, getInvoicePayments, createPayment, deletePayment,
  getDashboardStats
} from '../database/invoices'

export function registerInvoiceIPC(): void {
  ipcMain.handle('invoice:list', (_event, params) => {
    return listInvoices(params)
  })

  ipcMain.handle('invoice:get', (_event, id: number) => {
    return getInvoice(id)
  })

  ipcMain.handle('invoice:create', (_event, input) => {
    return createInvoice(input)
  })

  ipcMain.handle('invoice:update', (_event, id: number, input) => {
    return updateInvoice(id, input)
  })

  ipcMain.handle('invoice:delete', (_event, id: number) => {
    deleteInvoice(id)
    return { success: true }
  })

  ipcMain.handle('invoice:payments', (_event, invoiceId: number) => {
    return getInvoicePayments(invoiceId)
  })

  ipcMain.handle('payment:create', (_event, input) => {
    return createPayment(input)
  })

  ipcMain.handle('payment:delete', (_event, id: number) => {
    deletePayment(id)
    return { success: true }
  })

  ipcMain.handle('dashboard:stats', () => {
    return getDashboardStats()
  })
}
