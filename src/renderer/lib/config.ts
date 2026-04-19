/**
 * Typed config wrapper.
 *
 * Reads and writes both localStorage (fast path, survives tab lifecycle) and
 * the persistent IPC config (survives app updates). Everything else in the
 * renderer should go through this module instead of touching localStorage.
 */

const LS_KEYS = {
  serverUrl: 'minasa_server_url',
  token: 'minasa_token',
  apiKey: 'minasa_api_key',
  theme: 'theme',
} as const

type IpcConfig = {
  get?: () => Promise<Record<string, string> | null> | Record<string, string> | null
  set?: (key: string, value: string) => Promise<void> | void
}

function ipc(): IpcConfig | null {
  return (window as any).__config ?? null
}

/**
 * Read a single string value. localStorage first, with IPC fallback.
 */
function readString(lsKey: string): string {
  try {
    return localStorage.getItem(lsKey) ?? ''
  } catch {
    return ''
  }
}

/**
 * Persist a string value to localStorage + the IPC config if available.
 */
function writeString(lsKey: string, ipcKey: string, value: string): void {
  try {
    localStorage.setItem(lsKey, value)
  } catch { /* quota / denied — skip */ }
  const i = ipc()
  if (i?.set) {
    try { void i.set(ipcKey, value) } catch { /* ignore */ }
  }
}

/**
 * Pull persisted config from IPC once at startup and seed localStorage with
 * whatever is missing (e.g. on a fresh install after an update).
 */
export async function hydrateFromIpc(): Promise<void> {
  const i = ipc()
  if (!i?.get) return
  try {
    const cfg = (await i.get()) ?? {}
    if (cfg.server_url && !readString(LS_KEYS.serverUrl)) {
      localStorage.setItem(LS_KEYS.serverUrl, cfg.server_url)
    }
    if (cfg.token && !readString(LS_KEYS.token)) {
      localStorage.setItem(LS_KEYS.token, cfg.token)
    }
    if (cfg.api_key && !readString(LS_KEYS.apiKey)) {
      localStorage.setItem(LS_KEYS.apiKey, cfg.api_key)
    }
  } catch { /* ignore */ }
}

export const appConfig = {
  getServerUrl: (): string => readString(LS_KEYS.serverUrl),
  setServerUrl: (url: string): void => writeString(LS_KEYS.serverUrl, 'server_url', url),

  getToken: (): string => readString(LS_KEYS.token),
  setToken: (token: string): void => writeString(LS_KEYS.token, 'token', token),
  clearToken: (): void => {
    try { localStorage.removeItem(LS_KEYS.token) } catch { /* ignore */ }
    const i = ipc()
    if (i?.set) { try { void i.set('token', '') } catch { /* ignore */ } }
  },

  getApiKey: (): string => readString(LS_KEYS.apiKey),
  setApiKey: (key: string): void => writeString(LS_KEYS.apiKey, 'api_key', key),

  getTheme: (): 'light' | 'dark' =>
    readString(LS_KEYS.theme) === 'dark' ? 'dark' : 'light',
  setTheme: (t: 'light' | 'dark'): void => {
    try { localStorage.setItem(LS_KEYS.theme, t) } catch { /* ignore */ }
  },
}
