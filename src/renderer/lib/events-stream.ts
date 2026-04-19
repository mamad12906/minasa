/**
 * Typed client for the server's `/api/events` SSE stream.
 *
 * EventSource doesn't allow custom headers, so authentication goes via
 * querystring (`token` + `apiKey`). That's fine — the URL never leaves the
 * renderer process and HTTPS hides it from the wire.
 */

export type AppEventKind =
  | 'customer.created' | 'customer.updated' | 'customer.deleted'
  | 'reminder.created' | 'reminder.updated' | 'reminder.deleted' | 'reminder.done'
  | 'invoice.created'  | 'invoice.updated'  | 'invoice.deleted'
  | 'ministry.created' | 'ministry.deleted'
  | 'category.created' | 'category.deleted'
  | 'platform.created' | 'platform.deleted'
  | 'user.created'     | 'user.updated'     | 'user.deleted' | 'user.password_reset'
  | 'auth.login'       | 'auth.login_failed'

export interface AppEvent {
  kind: AppEventKind
  actor?: { id: number; username: string } | null
  entity_id?: number | null
  entity_name?: string
  details?: string
  at: number
}

type Listener = (e: AppEvent) => void

const KINDS: AppEventKind[] = [
  'customer.created', 'customer.updated', 'customer.deleted',
  'reminder.created', 'reminder.updated', 'reminder.deleted', 'reminder.done',
  'invoice.created',  'invoice.updated',  'invoice.deleted',
  'ministry.created', 'ministry.deleted',
  'category.created', 'category.deleted',
  'platform.created', 'platform.deleted',
  'user.created', 'user.updated', 'user.deleted', 'user.password_reset',
  'auth.login', 'auth.login_failed',
]

class EventsStream {
  private es: EventSource | null = null
  private listeners = new Set<Listener>()
  private connectedFlag = false
  private onConnChange = new Set<(connected: boolean) => void>()
  private reconnectTimer: any = null

  /** True when the SSE channel is currently open. */
  get connected(): boolean { return this.connectedFlag }

  /**
   * Connect (or reconnect) with the given credentials. Safe to call again
   * with refreshed creds; the previous connection is closed first.
   */
  connect(serverUrl: string, token: string, apiKey: string): void {
    if (!serverUrl || !token || !apiKey) return
    this.disconnect()

    const url = `${serverUrl.replace(/\/+$/, '')}/api/events?token=${encodeURIComponent(token)}&apiKey=${encodeURIComponent(apiKey)}`
    // Until the server accepts credentials via querystring we pass them via
    // headers on a polyfill. Here we rely on Electron's built-in EventSource
    // that does send a fetch with auth, but since native EventSource can't
    // set headers, we fall back to a fetch+reader loop.
    this.fetchStream(serverUrl.replace(/\/+$/, ''), token, apiKey)
    // url kept only for logging/future move back to native EventSource.
    void url
  }

  disconnect(): void {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null }
    this.es?.close()
    this.es = null
    this._abortFetch?.()
    this.setConnected(false)
  }

  /** Subscribe to every event. Returns an unsubscribe function. */
  on(l: Listener): () => void {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }

  /** Subscribe to connection-state changes. */
  onConnection(l: (connected: boolean) => void): () => void {
    this.onConnChange.add(l)
    // Fire immediately with current state so the UI doesn't flicker.
    try { l(this.connectedFlag) } catch { /* ignore */ }
    return () => this.onConnChange.delete(l)
  }

  // ─────── internals ───────
  private setConnected(v: boolean) {
    if (this.connectedFlag === v) return
    this.connectedFlag = v
    for (const l of this.onConnChange) { try { l(v) } catch { /* ignore */ } }
  }

  private _abortFetch: (() => void) | null = null

  /**
   * Manual SSE reader — lets us send `Authorization` + `x-api-key` headers,
   * which browser `EventSource` can't. Reconnects on drop with 3 s delay.
   */
  private async fetchStream(base: string, token: string, apiKey: string): Promise<void> {
    const controller = new AbortController()
    this._abortFetch = () => controller.abort()
    try {
      const res = await fetch(`${base}/api/events`, {
        headers: {
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${token}`,
          'x-api-key': apiKey,
        },
        signal: controller.signal,
      })
      if (!res.ok || !res.body) throw new Error(`events stream ${res.status}`)
      this.setConnected(true)

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        // Split on the blank-line SSE record separator.
        let idx: number
        while ((idx = buffer.indexOf('\n\n')) >= 0) {
          const record = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)
          this.handleRecord(record)
        }
      }
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return
      console.warn('[events] stream dropped:', (err as Error).message)
    } finally {
      this.setConnected(false)
      // Auto-reconnect after 3 seconds unless explicitly disconnected.
      if (this._abortFetch) {
        this.reconnectTimer = setTimeout(() => this.fetchStream(base, token, apiKey), 3000)
      }
    }
  }

  private handleRecord(record: string): void {
    // Parse `event: kind\ndata: json` records. Ignore comments (start with ':').
    if (!record.trim() || record.startsWith(':')) return
    let kind: string | null = null
    let dataLine: string | null = null
    for (const line of record.split('\n')) {
      if (line.startsWith('event:')) kind = line.slice(6).trim()
      else if (line.startsWith('data:')) dataLine = (dataLine ?? '') + line.slice(5).trim()
    }
    if (!dataLine) return
    let payload: AppEvent
    try {
      payload = JSON.parse(dataLine)
    } catch {
      return
    }
    // If no explicit kind header, fall back to the payload kind.
    if (kind && KINDS.includes(kind as AppEventKind)) payload.kind = kind as AppEventKind
    if (!payload.kind) return
    for (const l of this.listeners) {
      try { l(payload) } catch { /* swallow per-listener errors */ }
    }
  }
}

export const eventsStream = new EventsStream()
