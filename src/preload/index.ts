import { contextBridge, ipcRenderer } from 'electron'

// Full IPC API for local SQLite operations
const localApi = {
  customer: {
    list: (params: any) => ipcRenderer.invoke('customer:list', params),
    get: (id: number) => ipcRenderer.invoke('customer:get', id),
    create: (input: any) => ipcRenderer.invoke('customer:create', input),
    update: (id: number, input: any) => ipcRenderer.invoke('customer:update', id, input),
    delete: (id: number) => ipcRenderer.invoke('customer:delete', id),
    platforms: () => ipcRenderer.invoke('customer:platforms'),
    categories: () => ipcRenderer.invoke('customer:categories'),
    reminders: (customerId: number) => ipcRenderer.invoke('customer:reminders', customerId),
  },
  dashboard: {
    stats: (userId?: number) => ipcRenderer.invoke('dashboard:stats', userId),
  },
  reminders: {
    active: (userId?: number) => ipcRenderer.invoke('reminders:active', userId),
    all: (userId?: number) => ipcRenderer.invoke('reminders:all', userId),
    done: (id: number, handledBy: string, handleMethod: string) => ipcRenderer.invoke('reminders:done', id, handledBy, handleMethod),
    postpone: (id: number, newDate: string, reason: string) => ipcRenderer.invoke('reminders:postpone', id, newDate, reason),
    reremind: (id: number, newDate: string, reason: string) => ipcRenderer.invoke('reminders:reremind', id, newDate, reason),
    delete: (id: number) => ipcRenderer.invoke('reminders:delete', id),
  },
  users: {
    login: (username: string, password: string) => ipcRenderer.invoke('users:login', username, password),
    list: () => ipcRenderer.invoke('users:list'),
    create: (username: string, password: string, displayName: string, role: string, permissions: string, platformName: string) =>
      ipcRenderer.invoke('users:create', username, password, displayName, role, permissions, platformName),
    update: (id: number, displayName: string, password: string | null, permissions: string, platformName: string) =>
      ipcRenderer.invoke('users:update', id, displayName, password, permissions, platformName),
    delete: (id: number) => ipcRenderer.invoke('users:delete', id),
  },
  platforms: {
    list: () => ipcRenderer.invoke('platforms:list'),
    add: (name: string) => ipcRenderer.invoke('platforms:add', name),
    delete: (id: number) => ipcRenderer.invoke('platforms:delete', id),
  },
  categories: {
    list: () => ipcRenderer.invoke('categories:list'),
    add: (name: string) => ipcRenderer.invoke('categories:add', name),
    delete: (id: number) => ipcRenderer.invoke('categories:delete', id),
  },
  transfer: {
    customers: (ids: number[], targetPlatform: string) => ipcRenderer.invoke('customers:transfer', ids, targetPlatform),
  },
  columns: {
    list: (tableName?: string) => ipcRenderer.invoke('columns:list', tableName),
    add: (input: any) => ipcRenderer.invoke('columns:add', input),
    update: (id: number, displayName: string) => ipcRenderer.invoke('columns:update', id, displayName),
    delete: (id: number) => ipcRenderer.invoke('columns:delete', id),
  },
  excel: {
    selectFile: () => ipcRenderer.invoke('excel:selectFile'),
    readHeaders: (filePath: string) => ipcRenderer.invoke('excel:readHeaders', filePath),
    importData: (filePath: string, mapping: any) => ipcRenderer.invoke('excel:import', filePath, mapping),
  },
  backup: {
    database: () => ipcRenderer.invoke('backup:database'),
    restore: () => ipcRenderer.invoke('backup:restore'),
    excelAll: () => ipcRenderer.invoke('backup:excel-all'),
    excelUser: (userId: number, userName: string) => ipcRenderer.invoke('backup:excel-user', userId, userName),
    autoSetup: (dir: string, hours: number) => ipcRenderer.invoke('backup:auto-setup', dir, hours),
    autoStop: () => ipcRenderer.invoke('backup:auto-stop'),
    autoGet: () => ipcRenderer.invoke('backup:auto-get'),
    selectDir: () => ipcRenderer.invoke('backup:select-dir'),
  },
}

// Expose local IPC API
contextBridge.exposeInMainWorld('__localApi', localApi)

// Legacy IPC (for backward compat)
contextBridge.exposeInMainWorld('__ipc', {
  excel: localApi.excel,
  backup: localApi.backup,
})

// Updater
contextBridge.exposeInMainWorld('__updater', {
  check: () => ipcRenderer.invoke('updater:check'),
  download: () => ipcRenderer.invoke('updater:download'),
  install: () => ipcRenderer.invoke('updater:install'),
  onUpdateAvailable: (callback: any) => ipcRenderer.on('update-available', (_e, info) => callback(info)),
  onProgress: (callback: any) => ipcRenderer.on('update-progress', (_e, info) => callback(info)),
  onUpdateDownloaded: (callback: any) => ipcRenderer.on('update-downloaded', () => callback()),
})
