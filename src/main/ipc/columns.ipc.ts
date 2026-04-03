import { ipcMain } from 'electron'
import { listCustomColumns, addCustomColumn, updateCustomColumn, deleteCustomColumn } from '../database/columns'

export function registerColumnsIPC(): void {
  ipcMain.handle('columns:list', (_event, tableName?: string) => {
    return listCustomColumns(tableName)
  })

  ipcMain.handle('columns:add', (_event, input: any) => {
    return addCustomColumn(input)
  })

  ipcMain.handle('columns:update', (_event, id: number, display_name: string) => {
    return updateCustomColumn(id, display_name)
  })

  ipcMain.handle('columns:delete', (_event, id: number) => {
    deleteCustomColumn(id)
    return { success: true }
  })
}
