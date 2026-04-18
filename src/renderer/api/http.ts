// Hybrid API: Online (server) + Offline (local SQLite)

let BASE_URL = localStorage.getItem('minasa_server_url') || ''
let AUTH_TOKEN = localStorage.getItem('minasa_token') || ''
let API_KEY = localStorage.getItem('minasa_api_key') || ''
let IS_ONLINE = true

// Load persistent config on startup (survives updates)
export async function loadPersistentConfig() {
  try {
    const config = await (window as any).__config?.get()
    if (config) {
      if (config.server_url) { BASE_URL = config.server_url; localStorage.setItem('minasa_server_url', BASE_URL) }
      if (config.api_key) { API_KEY = config.api_key; localStorage.setItem('minasa_api_key', API_KEY) }
    }
  } catch (err) { console.error('[loadPersistentConfig] Failed to load config:', err) }
}

export function setApiKey(key: string) {
  API_KEY = key; localStorage.setItem('minasa_api_key', key)
  ;(window as any).__config?.set('api_key', key)
}
export function getApiKey() { return API_KEY }
export function setServerUrl(url: string) {
  BASE_URL = url.replace(/\/+$/, ''); localStorage.setItem('minasa_server_url', BASE_URL)
  ;(window as any).__config?.set('server_url', BASE_URL)
}
export function getServerUrl() { return BASE_URL }
export function setToken(token: string) { AUTH_TOKEN = token; localStorage.setItem('minasa_token', token) }
export function clearToken() { AUTH_TOKEN = ''; localStorage.removeItem('minasa_token') }
export function getToken() { return AUTH_TOKEN }
export function isOnline() { return IS_ONLINE }

// Load config immediately
setTimeout(() => loadPersistentConfig(), 100)

// ===== Server HTTP Requests =====
async function serverRequest(method: string, path: string, body?: any) {
  if (!BASE_URL) throw new Error('No server URL')
  const url = `${BASE_URL}${path}`
  const opts: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      ...(API_KEY ? { 'x-api-key': API_KEY } : {})
    }
  }
  if (body && method !== 'GET') opts.body = JSON.stringify(body)
  const res = await fetch(url, opts)
  if (res.status === 401) { clearToken(); window.location.reload(); throw new Error('Unauthorized') }
  return res.json()
}

function serverGet(path: string, params?: Record<string, any>) {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v != null && v !== '' && v !== undefined).map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return serverRequest('GET', path + qs)
}

// ===== Local API (via IPC) =====
const local = () => (window as any).__localApi
const hasLocal = () => !!(window as any).__localApi

// Direct IPC (always available - registered in index.ts, no SQLite dependency)
const ipc2 = () => (window as any).__ipc2

// ===== Connection Check =====
async function checkConnection(): Promise<boolean> {
  if (!BASE_URL) { IS_ONLINE = false; return false }
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 3000)
    await fetch(`${BASE_URL}/api/platforms`, {
      signal: controller.signal,
      headers: {
        ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
        ...(API_KEY ? { 'x-api-key': API_KEY } : {})
      }
    })
    IS_ONLINE = true
    return true
  } catch (err) {
    console.error('[checkConnection] Server unreachable:', err)
    IS_ONLINE = false
    return false
  }
}

// Check connectivity periodically (cleanup on page unload / visibility hidden / explicit dispose)
let connectivityInterval: any = null
let initialCheckTimeout: any = null

export function startConnectivityCheck() {
  if (connectivityInterval) return
  connectivityInterval = setInterval(async () => {
    const wasOffline = !IS_ONLINE
    await checkConnection()
    if (wasOffline && IS_ONLINE) {
      const ipc2 = (window as any).__ipc2
      if (ipc2?.syncPushAll) ipc2.syncPushAll(BASE_URL, AUTH_TOKEN, API_KEY).catch(() => {})
    }
  }, 15000)
}

// Explicit disposer - usable from tests and from any cleanup path
export function disposeConnectivityCheck() {
  if (connectivityInterval) { clearInterval(connectivityInterval); connectivityInterval = null }
  if (initialCheckTimeout) { clearTimeout(initialCheckTimeout); initialCheckTimeout = null }
}

startConnectivityCheck()
initialCheckTimeout = setTimeout(() => { checkConnection(); initialCheckTimeout = null }, 2000)

// Cleanup on page unload (Electron window close / refresh)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', disposeConnectivityCheck)
  // Also cleanup when the document is hidden (tab switch / minimize) - interval
  // will be restarted when the page becomes visible again.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      disposeConnectivityCheck()
    } else if (document.visibilityState === 'visible') {
      startConnectivityCheck()
    }
  })
}

// ===== Hybrid API: try server, fallback to local =====

async function hybridRead(serverFn: () => Promise<any>, localFn: () => Promise<any>) {
  // If online, try server first (always has latest data)
  if (IS_ONLINE && BASE_URL) {
    try { return await serverFn() } catch (err) { console.error('[hybridRead] Server request failed:', err); IS_ONLINE = false }
  }
  // Offline: fallback to local
  if (hasLocal()) {
    try {
      const localResult = await localFn()
      if (localResult != null) return localResult
    } catch (err) { console.error('[hybridRead] Local fallback failed:', err) }
  }
  return null
}

async function hybridWrite(
  serverFn: () => Promise<any>,
  localFn: () => Promise<any>,
) {
  // Write locally first (if available)
  let localResult = null
  if (hasLocal()) {
    try { localResult = await localFn() } catch (err) { console.error('[hybridWrite] Local write failed:', err) }
  }

  // Try server
  if (IS_ONLINE && BASE_URL) {
    try { return await serverFn() }
    catch (err) { console.error('[hybridWrite] Server write failed:', err); IS_ONLINE = false }
  }

  return localResult
}

// ===== Exported API =====
export const api = {
  customer: {
    list: (params: any) => hybridRead(
      () => serverGet('/api/customers', params),
      () => local().customer.list(params)
    ),
    get: (id: number) => hybridRead(
      () => serverGet(`/api/customers/${id}`),
      () => local().customer.get(id)
    ),
    create: (input: any) => hybridWrite(
      () => serverRequest('POST', '/api/customers', input),
      () => local().customer.create(input),
    ),
    update: (id: number, input: any) => hybridWrite(
      () => serverRequest('PUT', `/api/customers/${id}`, input),
      () => local().customer.update(id, input),
    ),
    delete: (id: number) => hybridWrite(
      () => serverRequest('DELETE', `/api/customers/${id}`),
      () => local().customer.delete(id),
    ),
    platforms: () => hybridRead(
      () => serverGet('/api/customers/meta/platforms'),
      () => local().customer.platforms()
    ),
    categories: () => hybridRead(
      () => serverGet('/api/customers/meta/categories'),
      () => local().customer.categories()
    ),
    reminders: (customerId: number) => hybridRead(
      () => serverGet(`/api/customers/${customerId}/reminders`),
      () => local().customer.reminders(customerId)
    ),
  },

  dashboard: {
    stats: (userId?: number) => hybridRead(
      () => serverGet('/api/dashboard/stats', userId ? { userId } : undefined),
      () => local().dashboard.stats(userId)
    ),
  },

  reminders: {
    active: (userId?: number) => hybridRead(
      () => serverGet('/api/reminders/active', userId ? { userId } : undefined),
      () => local().reminders.active(userId)
    ),
    all: (userId?: number) => hybridRead(
      () => serverGet('/api/reminders/all', userId ? { userId } : undefined),
      () => local().reminders.all(userId)
    ),
    done: (id: number, handledBy: string, handleMethod: string) => hybridWrite(
      () => serverRequest('POST', `/api/reminders/${id}/done`, { handled_by: handledBy, handle_method: handleMethod }),
      () => local().reminders.done(id, handledBy, handleMethod),
    ),
    postpone: (id: number, newDate: string, reason: string) => hybridWrite(
      () => serverRequest('POST', `/api/reminders/${id}/postpone`, { new_date: newDate, reason }),
      () => local().reminders.postpone(id, newDate, reason),
    ),
    reremind: (id: number, newDate: string, reason: string) => hybridWrite(
      () => serverRequest('POST', `/api/reminders/${id}/reremind`, { new_date: newDate, reason }),
      () => local().reminders.reremind(id, newDate, reason),
    ),
    delete: (id: number) => hybridWrite(
      () => serverRequest('DELETE', `/api/reminders/${id}`),
      () => local().reminders.delete(id),
    ),
  },

  users: {
    login: async (username: string, password: string) => {
      // Try server login first
      if (BASE_URL) {
        try {
          const res = await serverRequest('POST', '/api/auth/login', { username, password })
          if (res.token) setToken(res.token)
          IS_ONLINE = true
          // Auto push local-only customers to server after login
          setTimeout(() => {
            const ipc2 = (window as any).__ipc2
            if (ipc2?.syncPushAll) {
              ipc2.syncPushAll(BASE_URL, AUTH_TOKEN, API_KEY).then((r: any) => {
                // auto-sync complete
              })
            }
          }, 3000)
          return res.user || null
        } catch (err) { console.error('[login] Server login failed:', err); IS_ONLINE = false }
      }
      // Fallback to local login
      return local().users.login(username, password)
    },
    list: () => hybridRead(() => serverGet('/api/users'), () => local().users.list()),
    create: (username: string, password: string, displayName: string, role: string, permissions: string, platformName: string) =>
      hybridWrite(
        () => serverRequest('POST', '/api/users', { username, password, display_name: displayName, role, permissions, platform_name: platformName }),
        () => local().users.create(username, password, displayName, role, permissions, platformName),
      ),
    update: (id: number, displayName: string, password: string | null, permissions: string, platformName: string) =>
      hybridWrite(
        () => serverRequest('PUT', `/api/users/${id}`, { display_name: displayName, password, permissions, platform_name: platformName }),
        () => local().users.update(id, displayName, password, permissions, platformName),
      ),
    delete: (id: number) => hybridWrite(
      () => serverRequest('DELETE', `/api/users/${id}`),
      () => local().users.delete(id),
    ),
  },

  platforms: {
    list: () => hybridRead(() => serverGet('/api/platforms'), () => local().platforms.list()),
    add: (name: string) => hybridWrite(
      () => serverRequest('POST', '/api/platforms', { name }),
      () => local().platforms.add(name),
    ),
    delete: (id: number) => hybridWrite(
      () => serverRequest('DELETE', `/api/platforms/${id}`),
      () => local().platforms.delete(id),
    ),
  },

  categories: {
    list: () => hybridRead(() => serverGet('/api/categories'), () => local().categories.list()),
    add: (name: string) => hybridWrite(
      () => serverRequest('POST', '/api/categories', { name }),
      () => local().categories.add(name),
    ),
    delete: (id: number) => hybridWrite(
      () => serverRequest('DELETE', `/api/categories/${id}`),
      () => local().categories.delete(id),
    ),
  },

  ministries: {
    list: () => hybridRead(() => serverGet('/api/ministries'), () => local().ministries.list()),
    add: (name: string) => hybridWrite(
      () => serverRequest('POST', '/api/ministries', { name }),
      () => local().ministries.add(name),
    ),
    delete: (id: number) => hybridWrite(
      () => serverRequest('DELETE', `/api/ministries/${id}`),
      () => local().ministries.delete(id),
    ),
  },

  transfer: {
    customers: (ids: number[], targetPlatform: string) => hybridWrite(
      () => serverRequest('POST', '/api/customers/transfer', { customerIds: ids, targetPlatform }),
      () => local().transfer.customers(ids, targetPlatform),
    ),
  },

  columns: {
    list: (tableName?: string) => local().columns.list(tableName),
    add: (input: any) => local().columns.add(input),
    update: (id: number, displayName: string) => local().columns.update(id, displayName),
    delete: (id: number) => local().columns.delete(id),
  },

  excel: {
    selectFile: () => ipc2()?.excelSelectFile() || Promise.resolve(null),
    readHeaders: (filePath: string) => ipc2()?.excelReadHeaders(filePath) || Promise.resolve(null),
    importData: (filePath: string, mapping: any) => (ipc2()?.excelImport(filePath, mapping) || Promise.resolve(null)).then((r: any) => r || { success: 0, failed: 0, errors: ['فشل'] }),
  },

  backup: {
    database: () => ipc2()?.backupDatabase() || Promise.resolve(null),
    restore: () => ipc2()?.backupRestore() || Promise.resolve(null),
    excelAll: () => ipc2()?.backupExcelAll() || Promise.resolve(null),
    excelUser: (userId: number, userName: string) => ipc2()?.backupExcelUser(userId, userName) || Promise.resolve(null),
    autoSetup: (dir: string, hours: number) => ipc2()?.backupAutoSetup(dir, hours) || Promise.resolve({ success: false }),
    autoStop: () => ipc2()?.backupAutoStop() || Promise.resolve({ success: false }),
    autoGet: () => (ipc2()?.backupAutoGet() || Promise.resolve(null)).then((r: any) => r || { dir: '', hours: 0 }),
    selectDir: () => ipc2()?.backupSelectDir() || Promise.resolve(null),
  },
}
