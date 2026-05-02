import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { initDB, pool } from './db'
import authRoutes from './routes/auth'
import customerRoutes from './routes/customers'
import invoiceRoutes from './routes/invoices'
import reminderRoutes from './routes/reminders'
import userRoutes from './routes/users'
import platformRoutes from './routes/platforms'
import categoryRoutes from './routes/categories'
import ministryRoutes from './routes/ministries'
import auditRoutes from './routes/audit'
import eventsRoutes from './routes/events'
import dashboardRoutes from './routes/dashboard'
import mobileUpdateRoutes from './routes/mobile-update'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const API_KEY = process.env.API_KEY || ''

// Trust the reverse proxy (Caddy) so req.protocol reflects the original scheme (https).
app.set('trust proxy', 1)

// Security headers — contentSecurityPolicy off because Caddy strips it anyway
// for the JSON API and there's no HTML we render server-side.
app.use(helmet({ contentSecurityPolicy: false }))

// CORS allowlist from env (comma-separated). If ALLOWED_ORIGINS unset, fall back
// to reflecting the request origin — same behaviour as before. Desktop/mobile
// clients send no Origin header, so they're unaffected either way.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    if (allowedOrigins.length === 0) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('CORS: origin not allowed'))
  },
  credentials: true,
}))
// 1 MB is plenty for any legitimate API payload. The old 50 MB cap left the
// server exposed to trivial memory-exhaustion — any single unauthenticated
// request pre-auth could have filled a request buffer.
app.use(express.json({ limit: '1mb' }))

// API Key protection - all /api/* routes require it.
// Supports multiple valid keys (comma-separated in env) for rotation without downtime.
const validApiKeys = API_KEY.split(',').map(k => k.trim()).filter(Boolean)
app.use('/api', (req, res, next) => {
  if (validApiKeys.length === 0) { return res.status(500).json({ error: 'API_KEY not configured on server' }) }
  const clientKey = req.headers['x-api-key'] as string | undefined
  if (!clientKey || !validApiKeys.includes(clientKey)) { return res.status(403).json({ error: 'مفتاح API غير صالح' }) }
  next()
})

// Rate limiting - simple in-memory. A periodic sweep prunes stale entries
// so the map can't grow unbounded over long uptimes. A hard cap also evicts
// the oldest entry on insert so a burst of unique IPs between sweeps can't
// blow up memory before the sweep fires.
const RATE_LIMITS_MAX_KEYS = 10_000
const rateLimits = new Map<string, { count: number; reset: number }>()
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 200
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimits) {
    if (entry.reset < now) rateLimits.delete(ip)
  }
}, RATE_WINDOW_MS * 5).unref()

app.use('/api', (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const limit = rateLimits.get(ip)
  if (limit && now < limit.reset) {
    if (limit.count >= RATE_MAX) {
      return res.status(429).json({ error: 'طلبات كثيرة، حاول لاحقاً' })
    }
    limit.count++
  } else {
    // Eviction: if the map exceeds its cap, drop the oldest key (Map
    // iteration order is insertion order). Cheap O(1) without sorting.
    if (rateLimits.size >= RATE_LIMITS_MAX_KEYS) {
      const oldest = rateLimits.keys().next().value
      if (oldest != null) rateLimits.delete(oldest)
    }
    rateLimits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS })
  }
  next()
})

// Stricter per-IP bucket for destructive writes — DELETE + admin reset-password
// + bulk endpoints. Keeps an attacker with a valid API key + token from
// grinding thousands of mutations in a burst even if the generic limiter
// above hasn't tripped yet.
const destructiveLimits = new Map<string, { count: number; reset: number }>()
const DESTRUCTIVE_WINDOW_MS = 60_000
const DESTRUCTIVE_MAX = 20
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of destructiveLimits) {
    if (entry.reset < now) destructiveLimits.delete(ip)
  }
}, DESTRUCTIVE_WINDOW_MS * 5).unref()

app.use('/api', (req, res, next) => {
  const destructive = req.method === 'DELETE'
    || (req.method === 'POST' && /\/reset-password/.test(req.path))
    || (req.method === 'POST' && /\/transfer/.test(req.path))
  if (!destructive) return next()
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const limit = destructiveLimits.get(ip)
  if (limit && now < limit.reset) {
    if (limit.count >= DESTRUCTIVE_MAX) {
      return res.status(429).json({ error: 'طلبات حذف كثيرة، حاول بعد دقيقة' })
    }
    limit.count++
  } else {
    if (destructiveLimits.size >= RATE_LIMITS_MAX_KEYS) {
      const oldest = destructiveLimits.keys().next().value
      if (oldest != null) destructiveLimits.delete(oldest)
    }
    destructiveLimits.set(ip, { count: 1, reset: now + DESTRUCTIVE_WINDOW_MS })
  }
  next()
})

// Per-target-user limiter for password resets — separate from the per-IP
// destructive bucket. Prevents an admin (or stolen admin token) from
// cycling a single user's password rapidly to lock them out or generate
// noise. Hourly window, 3 resets per target user.
const PWRESET_WINDOW_MS = 60 * 60_000
const PWRESET_MAX = 3
const pwResetByUser = new Map<string, { count: number; reset: number }>()
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of pwResetByUser) {
    if (v.reset < now) pwResetByUser.delete(k)
  }
}, PWRESET_WINDOW_MS).unref()

app.use('/api/users', (req, res, next) => {
  // Match POST /api/users/:id/reset-password and pull `:id` from the path.
  const m = req.method === 'POST' && /^\/(\d+)\/reset-password\/?$/.exec(req.path)
  if (!m) return next()
  const userId = m[1]
  const now = Date.now()
  const e = pwResetByUser.get(userId)
  if (e && now < e.reset) {
    if (e.count >= PWRESET_MAX) {
      return res.status(429).json({ error: 'تم إعادة تعيين كلمة المرور لهذا المستخدم بكثرة، حاول بعد ساعة' })
    }
    e.count++
  } else {
    pwResetByUser.set(userId, { count: 1, reset: now + PWRESET_WINDOW_MS })
  }
  next()
})

// Health checks. `/` is the cheap liveness probe; `/health` actually
// pings PostgreSQL so a load balancer or pm2 restart loop can detect a
// dead pool — common failure mode that the old static `{status:'ok'}`
// hid completely.
app.get('/', (_req, res) => res.json({ status: 'ok' }))
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', db: 'ok' })
  } catch (e: any) {
    console.error('[health] DB probe failed:', e.message)
    res.status(503).json({ status: 'degraded', db: 'down' })
  }
})

// Mobile update - public (app needs it before login)
app.use('/api/mobile', mobileUpdateRoutes)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/platforms', platformRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/ministries', ministryRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/dashboard', dashboardRoutes)

async function start() {
  await initDB()
  const server = app.listen(PORT, () => {
    console.log(`Minasa API running on port ${PORT}`)
  })

  // Graceful shutdown — pm2 sends SIGINT first, SIGKILL after a grace
  // window. We give in-flight requests up to 8s to finish, then close the
  // pg pool so its connections aren't left hanging from PostgreSQL's POV.
  // Without this, a restart could leak idle clients in the pool until
  // their idle_in_transaction_session_timeout fires.
  let shuttingDown = false
  const shutdown = async (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`[${signal}] shutting down...`)
    server.close(async () => {
      try { await pool.end() } catch (e) { console.error('[shutdown] pool.end:', (e as Error).message) }
      console.log('[shutdown] done')
      process.exit(0)
    })
    setTimeout(() => {
      console.error('[shutdown] grace window elapsed, forcing exit')
      process.exit(1)
    }, 8000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

start().catch(console.error)
