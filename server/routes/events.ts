import { Router } from 'express'
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth'
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
router.get('/', authMiddleware, adminOnly, (req: AuthRequest, res) => {
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

  const cleanup = () => {
    clearInterval(heartbeat)
    bus.off('event', onEvent)
    try { res.end() } catch { /* already ended */ }
  }
  req.on('close', cleanup)
  req.on('error', cleanup)
})

export default router
