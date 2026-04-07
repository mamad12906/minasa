import { contextBridge, ipcRenderer } from 'electron'

// Safe IPC invoke - returns null/error if handler not registered
function safeInvoke(channel: string, ...args: any[]) {
  return ipcRenderer.invoke(channel, ...args).catch((err: any) => {
    console.warn(`[IPC FAIL] ${channel}:`, err.message)
    return null
  })
}

// Full IPC API for local SQLite operations
const localApi = {
  customer: {
    list: (params: any) => safeInvoke('customer:list', params),
    get: (id: number) => safeInvoke('customer:get', id),
    create: (input: any) => safeInvoke('customer:create', input),
    update: (id: number, input: any) => safeInvoke('customer:update', id, input),
    delete: (id: number) => safeInvoke('customer:delete', id),
    platforms: () => safeInvoke('customer:platforms').then(r => r || []),
    categories: () => safeInvoke('customer:categories').then(r => r || []),
    reminders: (customerId: number) => safeInvoke('customer:reminders', customerId).then(r => r || []),
    history: (customerId: number) => safeInvoke('customer:history', customerId).then(r => r || []),
  },
  dashboard: {
    stats: (userId?: number) => safeInvoke('dashboard:stats', userId),
  },
  reminders: {
    active: (userId?: number) => safeInvoke('reminders:active', userId).then(r => r || []),
    all: (userId?: number) => safeInvoke('reminders:all', userId).then(r => r || []),
    done: (id: number, handledBy: string, handleMethod: string) => safeInvoke('reminders:done', id, handledBy, handleMethod),
    postpone: (id: number, newDate: string, reason: string) => safeInvoke('reminders:postpone', id, newDate, reason),
    reremind: (id: number, newDate: string, reason: string) => safeInvoke('reminders:reremind', id, newDate, reason),
    delete: (id: number) => safeInvoke('reminders:delete', id),
  },
  users: {
    login: (username: string, password: string) => safeInvoke('users:login', username, password),
    list: () => safeInvoke('users:list').then(r => r || []),
    create: (username: string, password: string, displayName: string, role: string, permissions: string, platformName: string) =>
      safeInvoke('users:create', username, password, displayName, role, permissions, platformName),
    update: (id: number, displayName: string, password: string | null, permissions: string, platformName: string) =>
      safeInvoke('users:update', id, displayName, password, permissions, platformName),
    delete: (id: number) => safeInvoke('users:delete', id),
  },
  platforms: {
    list: () => safeInvoke('platforms:list').then(r => r || []),
    add: (name: string) => safeInvoke('platforms:add', name),
    delete: (id: number) => safeInvoke('platforms:delete', id),
  },
  categories: {
    list: () => safeInvoke('categories:list').then(r => r || []),
    add: (name: string) => safeInvoke('categories:add', name),
    delete: (id: number) => safeInvoke('categories:delete', id),
  },
  transfer: {
    customers: (ids: number[], targetPlatform: string) => safeInvoke('customers:transfer', ids, targetPlatform),
  },
  columns: {
    list: (tableName?: string) => safeInvoke('columns:list', tableName).then(r => r || []),
    add: (input: any) => safeInvoke('columns:add', input),
    update: (id: number, displayName: string) => safeInvoke('columns:update', id, displayName),
    delete: (id: number) => safeInvoke('columns:delete', id),
  },
  excel: {
    selectFile: () => safeInvoke('excel:selectFile'),
    readHeaders: (filePath: string) => safeInvoke('excel:readHeaders', filePath).then(r => r || []),
    importData: (filePath: string, mapping: any) => safeInvoke('excel:import', filePath, mapping),
  },
  backup: {
    database: () => safeInvoke('backup:database'),
    restore: () => safeInvoke('backup:restore'),
    excelAll: () => safeInvoke('backup:excel-all'),
    excelUser: (userId: number, userName: string) => safeInvoke('backup:excel-user', userId, userName),
    autoSetup: (dir: string, hours: number) => safeInvoke('backup:auto-setup', dir, hours),
    autoStop: () => safeInvoke('backup:auto-stop'),
    autoGet: () => safeInvoke('backup:auto-get').then(r => r || { dir: '', hours: 0 }),
    selectDir: () => safeInvoke('backup:select-dir'),
  },
}

// Audit log
const auditApi = {
  log: (userId: number, userName: string, action: string, entityType: string, entityId: number, details: string) =>
    safeInvoke('audit:log', userId, userName, action, entityType, entityId, details),
  list: (params: any) => safeInvoke('audit:list', params).then(r => r || { data: [], total: 0 }),
}

// App config (persistent across updates)
const configApi = {
  get: () => safeInvoke('config:get').then(r => r || {}),
  set: (key: string, value: string) => safeInvoke('config:set', key, value),
}
contextBridge.exposeInMainWorld('__config', configApi)
contextBridge.exposeInMainWorld('__appVersion', () => safeInvoke('app:version').then(r => r || ''))

// Direct IPC for Excel/Backup/Invoice (explicit methods, no rest args)
contextBridge.exposeInMainWorld('__ipc2', {
  excelSelectFile: () => safeInvoke('excel:selectFile'),
  excelReadHeaders: (filePath: string) => safeInvoke('excel:readHeaders', filePath),
  excelImport: (filePath: string, mapping: any) => safeInvoke('excel:import', filePath, mapping),
  backupDatabase: () => safeInvoke('backup:database'),
  backupRestore: () => safeInvoke('backup:restore'),
  backupExcelAll: () => safeInvoke('backup:excel-all'),
  backupExcelUser: (userId: number, userName: string) => safeInvoke('backup:excel-user', userId, userName),
  backupAutoSetup: (dir: string, hours: number) => safeInvoke('backup:auto-setup', dir, hours),
  backupAutoStop: () => safeInvoke('backup:auto-stop'),
  backupAutoGet: () => safeInvoke('backup:auto-get'),
  backupSelectDir: () => safeInvoke('backup:select-dir'),
  invoiceList: (params: any) => safeInvoke('invoice:list', params),
  invoiceCreate: (input: any) => safeInvoke('invoice:create', input),
  invoiceUpdate: (id: number, input: any) => safeInvoke('invoice:update', id, input),
  invoiceDelete: (id: number) => safeInvoke('invoice:delete', id),
  invoicePayments: (id: number) => safeInvoke('invoice:payments', id),
  paymentCreate: (input: any) => safeInvoke('payment:create', input),
  paymentDelete: (id: number) => safeInvoke('payment:delete', id),
  syncPushAll: (serverUrl: string, token: string, apiKey: string) => safeInvoke('sync:push-all-to-server', serverUrl, token, apiKey),
  dbDeleteAllCustomers: (serverUrl: string, token: string, apiKey: string) => safeInvoke('db:delete-all-customers', serverUrl, token, apiKey),
  dbDeleteUserCustomers: (userId: number, serverUrl: string, token: string, apiKey: string) => safeInvoke('db:delete-user-customers', userId, serverUrl, token, apiKey),
})

// Expose local IPC API
contextBridge.exposeInMainWorld('__localApi', localApi)
contextBridge.exposeInMainWorld('__auditApi', auditApi)

// Updater
contextBridge.exposeInMainWorld('__updater', {
  check: () => ipcRenderer.invoke('updater:check'),
  download: () => ipcRenderer.invoke('updater:download'),
  install: () => ipcRenderer.invoke('updater:install'),
  onUpdateAvailable: (callback: any) => ipcRenderer.on('update-available', (_e, info) => callback(info)),
  onProgress: (callback: any) => ipcRenderer.on('update-progress', (_e, info) => callback(info)),
  onUpdateDownloaded: (callback: any) => ipcRenderer.on('update-downloaded', () => callback()),
  onSyncProgress: (callback: any) => ipcRenderer.on('sync-progress', (_e, info) => callback(info)),
})
