import { ipcMain } from 'electron'
import {
  listInvoices, getInvoice, createInvoice, updateInvoice,
  deleteInvoice, getInvoicePayments, createPayment, deletePayment
} from '../database/invoices'

export function registerInvoiceIPC(): void {
  ipcMain.handle('invoice:list', (_event, params) => listInvoices(params))
  ipcMain.handle('invoice:get', (_event, id: number) => getInvoice(id))
  ipcMain.handle('invoice:create', (_event, input) => createInvoice(input))
  ipcMain.handle('invoice:update', (_event, id: number, input) => updateInvoice(id, input))
  ipcMain.handle('invoice:delete', (_event, id: number) => { deleteInvoice(id); return { success: true } })
  ipcMain.handle('invoice:payments', (_event, invoiceId: number) => getInvoicePayments(invoiceId))
  ipcMain.handle('payment:create', (_event, input) => createPayment(input))
  ipcMain.handle('payment:delete', (_event, id: number) => { deletePayment(id); return { success: true } })
}
