// Hybrid API: Online (server) + Offline (local SQLite) with sync queue

let BASE_URL = localStorage.getItem('minasa_server_url') || ''
let AUTH_TOKEN = localStorage.getItem('minasa_token') || ''
let API_KEY = localStorage.getItem('minasa_api_key') || ''
let IS_ONLINE = true

// Load persistent config on startup (survives updates)
export async function loadPersistentConfig() {
  try {
    const config = await (window as any).__config?.get()
    if (config) {
      if (config.server_url && !BASE_URL) { BASE_URL = config.server_url; localStorage.setItem('minasa_server_url', BASE_URL) }
      if (config.api_key && !API_KEY) { API_KEY = config.api_key; localStorage.setItem('minasa_api_key', API_KEY) }
      // Always prefer persistent config
      if (config.server_url) { BASE_URL = config.server_url; localStorage.setItem('minasa_server_url', BASE_URL) }
      if (config.api_key) { API_KEY = config.api_key; localStorage.setItem('minasa_api_key', API_KEY) }
    }
  } catch {}
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

// ===== Sync Queue =====
interface SyncItem {
  id: string
  method: string
  path: string
  body?: any
  timestamp: number
}

function getSyncQueue(): SyncItem[] {
  try { return JSON.parse(localStorage.getItem('minasa_sync_queue') || '[]') } catch { return [] }
}

function saveSyncQueue(queue: SyncItem[]) {
  localStorage.setItem('minasa_sync_queue', JSON.stringify(queue))
  window.dispatchEvent(new CustomEvent('sync-queue-changed', { detail: queue.length }))
}

function addToSyncQueue(method: string, path: string, body?: any) {
  const queue = getSyncQueue()
  queue.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), method, path, body, timestamp: Date.now() })
  saveSyncQueue(queue)
}

export function getSyncQueueCount(): number { return getSyncQueue().length }

// Process sync queue when back online
export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getSyncQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0
  const remaining: SyncItem[] = []

  for (const item of queue) {
    try {
      await serverRequest(item.method, item.path, item.body)
      synced++
    } catch {
      failed++
      remaining.push(item)
    }
  }

  saveSyncQueue(remaining)
  return { synced, failed }
}

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
  } catch {
    IS_ONLINE = false
    return false
  }
}

// Check connectivity periodically
setInterval(async () => {
  const wasOffline = !IS_ONLINE
  await checkConnection()
  if (wasOffline && IS_ONLINE) {
    // Back online! Try to sync
    const result = await processSyncQueue()
    if (result.synced > 0) {
      window.dispatchEvent(new CustomEvent('sync-completed', { detail: result }))
    }
  }
}, 15000)

// Initial check
setTimeout(() => checkConnection(), 2000)

// ===== Full Sync: Pull server data to local DB =====
let IS_SYNCING = false
export function isSyncing() { return IS_SYNCING }

export async function pullFromServer(): Promise<{ success: boolean; details: string }> {
  if (!IS_ONLINE || !BASE_URL || !hasLocal()) return { success: false, details: 'غير متصل أو القاعدة المحلية غير متوفرة' }
  if (IS_SYNCING) return { success: false, details: 'المزامنة قيد التنفيذ' }

  const sync = (window as any).__syncApi
  if (!sync) return { success: false, details: 'واجهة المزامنة غير متوفرة' }

  IS_SYNCING = true
  window.dispatchEvent(new CustomEvent('sync-status', { detail: 'syncing' }))

  try {
    const results: string[] = []

    // Pull users
    try {
      const users = await serverGet('/api/users')
      if (Array.isArray(users) && users.length > 0) {
        await sync.pullUsers(users)
        results.push(`${users.length} مستخدم`)
      }
    } catch { /* skip */ }

    // Pull platforms
    try {
      const platforms = await serverGet('/api/platforms')
      if (Array.isArray(platforms) && platforms.length > 0) {
        await sync.pullPlatforms(platforms)
        results.push(`${platforms.length} منصة`)
      }
    } catch { /* skip */ }

    // Pull categories
    try {
      const categories = await serverGet('/api/categories')
      if (Array.isArray(categories) && categories.length > 0) {
        await sync.pullCategories(categories)
        results.push(`${categories.length} صنف`)
      }
    } catch { /* skip */ }

    // Pull customers (paginated - get all)
    try {
      let page = 1
      let totalCustomers = 0
      while (true) {
        const res = await serverGet('/api/customers', { page, pageSize: 500 })
        if (!res || !res.data || res.data.length === 0) break
        await sync.pullCustomers(res.data)
        totalCustomers += res.data.length
        if (totalCustomers >= (res.total || 0)) break
        page++
      }
      if (totalCustomers > 0) results.push(`${totalCustomers} زبون`)
    } catch { /* skip */ }

    // Pull reminders
    try {
      const reminders = await serverGet('/api/reminders/all')
      if (Array.isArray(reminders) && reminders.length > 0) {
        await sync.pullReminders(reminders)
        results.push(`${reminders.length} تذكير`)
      }
    } catch { /* skip */ }

    // Save sync timestamp
    localStorage.setItem('minasa_last_sync', new Date().toISOString())

    IS_SYNCING = false
    window.dispatchEvent(new CustomEvent('sync-status', { detail: 'done' }))

    if (results.length > 0) {
      return { success: true, details: `تم مزامنة: ${results.join('، ')}` }
    }
    return { success: true, details: 'لا توجد بيانات جديدة' }
  } catch (err: any) {
    IS_SYNCING = false
    window.dispatchEvent(new CustomEvent('sync-status', { detail: 'error' }))
    return { success: false, details: `خطأ: ${err.message}` }
  }
}

export function getLastSyncTime(): string {
  return localStorage.getItem('minasa_last_sync') || ''
}

// ===== Hybrid API: try server, fallback to local =====

async function hybridRead(serverFn: () => Promise<any>, localFn: () => Promise<any>) {
  // Try server first
  if (IS_ONLINE && BASE_URL) {
    try { return await serverFn() } catch { IS_ONLINE = false }
  }
  // Fallback to local
  if (hasLocal()) {
    try { return await localFn() } catch { /* local failed too */ }
  }
  return null
}

async function hybridWrite(
  serverFn: () => Promise<any>,
  localFn: () => Promise<any>,
  syncInfo?: { method: string; path: string; body?: any }
) {
  // Write locally first (if available)
  let localResult = null
  if (hasLocal()) {
    try { localResult = await localFn() } catch { /* ignore local failure */ }
  }

  // Try server
  if (IS_ONLINE && BASE_URL) {
    try {
      const serverResult = await serverFn()
      return serverResult
    } catch {
      IS_ONLINE = false
      if (syncInfo) addToSyncQueue(syncInfo.method, syncInfo.path, syncInfo.body)
    }
  } else if (syncInfo && BASE_URL) {
    addToSyncQueue(syncInfo.method, syncInfo.path, syncInfo.body)
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
      { method: 'POST', path: '/api/customers', body: input }
    ),
    update: (id: number, input: any) => hybridWrite(
      () => serverRequest('PUT', `/api/customers/${id}`, input),
      () => local().customer.update(id, input),
      { method: 'PUT', path: `/api/customers/${id}`, body: input }
    ),
    delete: (id: number) => hybridWrite(
      () => serverRequest('DELETE', `/api/customers/${id}`),
      () => local().customer.delete(id),
      { method: 'DELETE', path: `/api/customers/${id}` }
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
      { method: 'POST', path: `/api/reminders/${id}/done`, body: { handled_by: handledBy, handle_method: handleMethod } }
    ),
    postpone: (id: number, newDate: string, reason: string) => hybridWrite(
      () => serverRequest('POST', `/api/reminders/${id}/postpone`, { new_date: newDate, reason }),
      () => local().reminders.postpone(id, newDate, reason),
      { method: 'POST', path: `/api/reminders/${id}/postpone`, body: { new_date: newDate, reason } }
    ),
    reremind: (id: number, newDate: string, reason: string) => hybridWrite(
      () => serverRequest('POST', `/api/reminders/${id}/reremind`, { new_date: newDate, reason }),
      () => local().reminders.reremind(id, newDate, reason),
      { method: 'POST', path: `/api/reminders/${id}/reremind`, body: { new_date: newDate, reason } }
    ),
    delete: (id: number) => hybridWrite(
      () => serverRequest('DELETE', `/api/reminders/${id}`),
      () => local().reminders.delete(id),
      { method: 'DELETE', path: `/api/reminders/${id}` }
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
          // Auto-sync after successful server login
          setTimeout(() => pullFromServer(), 1000)
          return res.user || null
        } catch { IS_ONLINE = false }
      }
      // Fallback to local login
      return local().users.login(username, password)
    },
    list: () => hybridRead(() => serverGet('/api/users'), () => local().users.list()),
    create: (username: string, password: string, displayName: string, role: string, permissions: string, platformName: string) =>
      hybridWrite(
        () => serverRequest('POST', '/api/users', { username, password, display_name: displayName, role, permissions, platform_name: platformName }),
        () => local().users.create(username, password, displayName, role, permissions, platformName),
        { method: 'POST', path: '/api/users', body: { username, password, display_name: displayName, role, permissions, platform_name: platformName } }
      ),
    update: (id: number, displayName: string, password: string | null, permissions: string, platformName: string) =>
      hybridWrite(
        () => serverRequest('PUT', `/api/users/${id}`, { display_name: displayName, password, permissions, platform_name: platformName }),
        () => local().users.update(id, displayName, password, permissions, platformName),
        { method: 'PUT', path: `/api/users/${id}`, body: { display_name: displayName, password, permissions, platform_name: platformName } }
      ),
    delete: (id: number) => hybridWrite(
      () => serverRequest('DELETE', `/api/users/${id}`),
      () => local().users.delete(id),
      { method: 'DELETE', path: `/api/users/${id}` }
    ),
  },

  platforms: {
    list: () => hybridRead(() => serverGet('/api/platforms'), () => local().platforms.list()),
    add: (name: string) => hybridWrite(
      () => serverRequest('POST', '/api/platforms', { name }),
      () => local().platforms.add(name),
      { method: 'POST', path: '/api/platforms', body: { name } }
    ),
    delete: (id: number) => hybridWrite(
      () => serverRequest('DELETE', `/api/platforms/${id}`),
      () => local().platforms.delete(id),
      { method: 'DELETE', path: `/api/platforms/${id}` }
    ),
  },

  categories: {
    list: () => hybridRead(() => serverGet('/api/categories'), () => local().categories.list()),
    add: (name: string) => hybridWrite(
      () => serverRequest('POST', '/api/categories', { name }),
      () => local().categories.add(name),
      { method: 'POST', path: '/api/categories', body: { name } }
    ),
    delete: (id: number) => hybridWrite(
      () => serverRequest('DELETE', `/api/categories/${id}`),
      () => local().categories.delete(id),
      { method: 'DELETE', path: `/api/categories/${id}` }
    ),
  },

  transfer: {
    customers: (ids: number[], targetPlatform: string) => hybridWrite(
      () => serverRequest('POST', '/api/customers/transfer', { customerIds: ids, targetPlatform }),
      () => local().transfer.customers(ids, targetPlatform),
      { method: 'POST', path: '/api/customers/transfer', body: { customerIds: ids, targetPlatform } }
    ),
  },

  columns: {
    list: (tableName?: string) => local().columns.list(tableName),
    add: (input: any) => local().columns.add(input),
    update: (id: number, displayName: string) => local().columns.update(id, displayName),
    delete: (id: number) => local().columns.delete(id),
  },

  excel: {
    selectFile: () => hasLocal() ? local().excel.selectFile() : Promise.resolve(null),
    readHeaders: (filePath: string) => hasLocal() ? local().excel.readHeaders(filePath) : Promise.resolve([]),
    importData: (filePath: string, mapping: any) => hasLocal() ? local().excel.importData(filePath, mapping) : Promise.resolve({ success: 0, failed: 0, errors: ['القاعدة المحلية غير متوفرة'] }),
  },

  backup: {
    database: () => hasLocal() ? local().backup.database() : Promise.resolve(null),
    restore: () => hasLocal() ? local().backup.restore() : Promise.resolve(null),
    excelAll: () => hasLocal() ? local().backup.excelAll() : Promise.resolve(null),
    excelUser: (userId: number, userName: string) => hasLocal() ? local().backup.excelUser(userId, userName) : Promise.resolve(null),
    autoSetup: (dir: string, hours: number) => hasLocal() ? local().backup.autoSetup(dir, hours) : Promise.resolve({ success: false }),
    autoStop: () => hasLocal() ? local().backup.autoStop() : Promise.resolve({ success: false }),
    autoGet: () => hasLocal() ? local().backup.autoGet() : Promise.resolve({ dir: '', hours: 0 }),
    selectDir: () => hasLocal() ? local().backup.selectDir() : Promise.resolve(null),
  },
}
