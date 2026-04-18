import { ipcMain } from 'electron'
import { loginUser, listUsers, createUser, updateUser, deleteUser, listPlatforms, addPlatform, deletePlatform, listCategories, addCategory, deleteCategory, listMinistries, addMinistry, deleteMinistry, transferCustomers } from '../database/users'

export function registerUsersIPC(): void {
  ipcMain.handle('users:login', (_event, username: string, password: string) => loginUser(username, password))
  ipcMain.handle('users:list', () => listUsers())

  ipcMain.handle('users:create', (_event, username: string, password: string, displayName: string, role: string, permissions: string, platformName: string) => {
    try {
      return createUser(username, password, displayName, role, permissions, platformName || '')
    } catch (err: any) {
      return { error: err.message }
    }
  })

  ipcMain.handle('users:update', (_event, id: number, displayName: string, password: string | null, permissions: string, platformName: string) => {
    return updateUser(id, displayName, password, permissions, platformName || '')
  })

  ipcMain.handle('users:delete', (_event, id: number) => {
    deleteUser(id)
    return { success: true }
  })

  // Platforms
  ipcMain.handle('platforms:list', () => listPlatforms())
  ipcMain.handle('platforms:add', (_event, name: string) => {
    try { addPlatform(name); return { success: true } }
    catch (err: any) { return { error: err.message } }
  })
  ipcMain.handle('platforms:delete', (_event, id: number) => {
    deletePlatform(id)
    return { success: true }
  })

  // Categories
  ipcMain.handle('categories:list', () => listCategories())
  ipcMain.handle('categories:add', (_event, name: string) => {
    try { addCategory(name); return { success: true } }
    catch (err: any) { return { error: err.message } }
  })
  ipcMain.handle('categories:delete', (_event, id: number) => {
    deleteCategory(id)
    return { success: true }
  })

  // Ministries
  ipcMain.handle('ministries:list', () => listMinistries())
  ipcMain.handle('ministries:add', (_event, name: string) => {
    try { addMinistry(name); return { success: true } }
    catch (err: any) { return { error: err.message } }
  })
  ipcMain.handle('ministries:delete', (_event, id: number) => {
    deleteMinistry(id)
    return { success: true }
  })

  // Transfer
  ipcMain.handle('customers:transfer', (_event, customerIds: number[], targetPlatform: string) => {
    transferCustomers(customerIds, targetPlatform)
    return { success: true }
  })
}
