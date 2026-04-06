import { contextBridge, ipcRenderer } from 'electron'

// Safe IPC invoke - returns null/error if handler not registered
function safeInvoke(channel: string, ...args: any[]) {
  return ipcRenderer.invoke(channel, ...args).catch((err: any) => {
    console.warn(`[IPC FAIL] ${channel}:`, err.message)
    return null
  })
}

// Debug: log all IPC calls
const debugInvoke = (channel: string, ...args: any[]) => {
  console.log(`[IPC] ${channel}`, args.length > 0 ? args[0]?.constructor?.name || typeof args[0] : '')
  return safeInvoke(channel, ...args)
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

// Sync operations
const syncApi = {
  pullCustomers: (data: any[]) => safeInvoke('sync:pull-customers', data),
  pullUsers: (data: any[]) => safeInvoke('sync:pull-users', data),
  pullPlatforms: (data: any[]) => safeInvoke('sync:pull-platforms', data),
  pullCategories: (data: any[]) => safeInvoke('sync:pull-categories', data),
  pullReminders: (data: any[]) => safeInvoke('sync:pull-reminders', data),
}

// App config (persistent across updates)
const configApi = {
  get: () => safeInvoke('config:get').then(r => r || {}),
  set: (key: string, value: string) => safeInvoke('config:set', key, value),
}
contextBridge.exposeInMainWorld('__config', configApi)
contextBridge.exposeInMainWorld('__appVersion', () => safeInvoke('app:version').then(r => r || ''))

// Direct IPC invoke (for invoice channels not in localApi)
contextBridge.exposeInMainWorld('__ipcDirect', (channel: string, ...args: any[]) => safeInvoke(channel, ...args))

// Expose local IPC API
contextBridge.exposeInMainWorld('__localApi', localApi)
contextBridge.exposeInMainWorld('__syncApi', syncApi)
contextBridge.exposeInMainWorld('__auditApi', auditApi)

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
