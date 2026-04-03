// HTTP API client that replaces IPC calls
// This connects to the Express server instead of Electron main process

let BASE_URL = localStorage.getItem('minasa_server_url') || ''
let AUTH_TOKEN = localStorage.getItem('minasa_token') || ''
let API_KEY = localStorage.getItem('minasa_api_key') || ''

export function setApiKey(key: string) {
  API_KEY = key
  localStorage.setItem('minasa_api_key', key)
}

export function getApiKey() { return API_KEY }

export function setServerUrl(url: string) {
  BASE_URL = url.replace(/\/+$/, '')
  localStorage.setItem('minasa_server_url', BASE_URL)
}

export function getServerUrl() { return BASE_URL }

export function setToken(token: string) {
  AUTH_TOKEN = token
  localStorage.setItem('minasa_token', token)
}

export function clearToken() {
  AUTH_TOKEN = ''
  localStorage.removeItem('minasa_token')
}

export function getToken() { return AUTH_TOKEN }

async function request(method: string, path: string, body?: any) {
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
  if (res.status === 401) {
    clearToken()
    window.location.reload()
    throw new Error('غير مصرح')
  }
  return res.json()
}

function get(path: string, params?: Record<string, any>) {
  const qs = params ? '?' + new URLSearchParams(
    Object.entries(params).filter(([_, v]) => v != null && v !== '' && v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString() : ''
  return request('GET', path + qs)
}

function post(path: string, body?: any) { return request('POST', path, body) }
function put(path: string, body?: any) { return request('PUT', path, body) }
function del(path: string) { return request('DELETE', path) }

// === API that matches the old window.api interface ===

export const api = {
  customer: {
    list: (params: any) => get('/api/customers', params),
    get: (id: number) => get(`/api/customers/${id}`),
    create: (input: any) => post('/api/customers', input),
    update: (id: number, input: any) => put(`/api/customers/${id}`, input),
    delete: (id: number) => del(`/api/customers/${id}`),
    platforms: () => get('/api/customers/meta/platforms'),
    categories: () => get('/api/customers/meta/categories'),
    reminders: (customerId: number) => get(`/api/customers/${customerId}/reminders`)
  },

  dashboard: {
    stats: () => get('/api/dashboard/stats')
  },

  excel: {
    // These still use IPC (file dialogs need main process)
    selectFile: () => (window as any).__ipc?.excel?.selectFile?.() || Promise.resolve(null),
    readHeaders: (filePath: string) => (window as any).__ipc?.excel?.readHeaders?.(filePath) || Promise.resolve([]),
    importData: (filePath: string, mapping: any) => (window as any).__ipc?.excel?.importData?.(filePath, mapping) || Promise.resolve({ success: 0, failed: 0, errors: ['غير متاح في الوضع الأونلاين'] }),
    exportCustomers: () => Promise.resolve(null)
  },

  backup: {
    database: () => (window as any).__ipc?.backup?.database?.() || Promise.resolve(null),
    restore: () => (window as any).__ipc?.backup?.restore?.() || Promise.resolve(null),
    excelAll: () => (window as any).__ipc?.backup?.excelAll?.() || Promise.resolve(null),
    excelUser: (userId: number, userName: string) => (window as any).__ipc?.backup?.excelUser?.(userId, userName) || Promise.resolve(null),
    autoSetup: (dir: string, hours: number) => (window as any).__ipc?.backup?.autoSetup?.(dir, hours) || Promise.resolve({ success: false }),
    autoStop: () => (window as any).__ipc?.backup?.autoStop?.() || Promise.resolve({ success: false }),
    autoGet: () => (window as any).__ipc?.backup?.autoGet?.() || Promise.resolve({ dir: '', hours: 0 }),
    selectDir: () => (window as any).__ipc?.backup?.selectDir?.() || Promise.resolve(null)
  },

  reminders: {
    active: () => get('/api/reminders/active'),
    all: () => get('/api/reminders/all'),
    done: (id: number, handledBy: string, handleMethod: string) => post(`/api/reminders/${id}/done`, { handled_by: handledBy, handle_method: handleMethod }),
    postpone: (id: number, newDate: string, reason: string) => post(`/api/reminders/${id}/postpone`, { new_date: newDate, reason }),
    reremind: (id: number, newDate: string, reason: string) => post(`/api/reminders/${id}/reremind`, { new_date: newDate, reason }),
    delete: (id: number) => del(`/api/reminders/${id}`)
  },

  columns: {
    list: () => Promise.resolve([]),
    add: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({ success: true })
  },

  users: {
    login: async (username: string, password: string) => {
      const res = await post('/api/auth/login', { username, password })
      if (res.token) setToken(res.token)
      return res.user || null
    },
    list: () => get('/api/users'),
    create: (username: string, password: string, displayName: string, role: string, permissions: string, platformName: string) =>
      post('/api/users', { username, password, display_name: displayName, role, permissions, platform_name: platformName }),
    update: (id: number, displayName: string, password: string | null, permissions: string, platformName: string) =>
      put(`/api/users/${id}`, { display_name: displayName, password, permissions, platform_name: platformName }),
    delete: (id: number) => del(`/api/users/${id}`)
  },

  platforms: {
    list: () => get('/api/platforms'),
    add: (name: string) => post('/api/platforms', { name }),
    delete: (id: number) => del(`/api/platforms/${id}`)
  },

  categories: {
    list: () => get('/api/categories'),
    add: (name: string) => post('/api/categories', { name }),
    delete: (id: number) => del(`/api/categories/${id}`)
  },

  transfer: {
    customers: (ids: number[], targetPlatform: string) => post('/api/customers/transfer', { customerIds: ids, targetPlatform })
  }
}
