import { Router } from 'express'
import { authMiddleware, adminOnly, currentPwdVer, AuthRequest } from '../middleware/auth'
import { bus, AppEvent } from '../events'

const router = Router()

/**
 * GET /api/events  (SSE)
 *
 * Server-Sent Events stream of admin-visible activity. Admin-only.
 *
 * The client connects once and receives every mutation event until the
 * connection drops. A comment heartbeat every 25 seconds keeps proxies
 * (Caddy, etc.) from timing out the connection.
 */
router.get('/', authMiddleware, adminOnly, async (req: AuthRequest, res) => {
  // SSE headers — disable buffering in the proxy + keep connection alive.
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders?.()

  // Initial handshake so the client knows we're live.
  res.write(`event: hello\ndata: ${JSON.stringify({
    userId: req.user?.id,
    at: Date.now(),
  })}\n\n`)

  const onEvent = (ev: AppEvent) => {
    try {
      // SSE frame: `event:` sets the type, `data:` carries the payload.
      res.write(`event: ${ev.kind}\ndata: ${JSON.stringify(ev)}\n\n`)
    } catch { /* socket probably closed; cleanup below handles it */ }
  }
  bus.on('event', onEvent)

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n') } catch { /* closed */ }
  }, 25_000)

  // Long-lived SSE connections pre-date password rotations; snapshot the
  // user's pwdVer at connect time and re-check every 60s — if it changes
  // (password was rotated elsewhere) kick the stream so the client has to
  // reconnect with a fresh token.
  const connectVer = req.user?.id != null ? await currentPwdVer(req.user.id) : null
  const cleanup = () => {
    clearInterval(heartbeat)
    clearInterval(pwdWatcher)
    bus.off('event', onEvent)
    try { res.end() } catch { /* already ended */ }
  }
  const pwdWatcher = setInterval(async () => {
    if (req.user?.id == null) return
    const live = await currentPwdVer(req.user.id)
    if (live == null || live !== connectVer) cleanup()
  }, 60_000)

  req.on('close', cleanup)
  req.on('error', cleanup)
})

export default router
