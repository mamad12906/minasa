import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDB } from './db'
import authRoutes from './routes/auth'
import customerRoutes from './routes/customers'
import reminderRoutes from './routes/reminders'
import userRoutes from './routes/users'
import platformRoutes from './routes/platforms'
import categoryRoutes from './routes/categories'
import ministryRoutes from './routes/ministries'
import dashboardRoutes from './routes/dashboard'
import mobileUpdateRoutes from './routes/mobile-update'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const API_KEY = process.env.API_KEY || ''

app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '50mb' }))

// API Key protection - all /api/* routes require it
app.use('/api', (req, res, next) => {
  if (!API_KEY) { return res.status(500).json({ error: 'API_KEY not configured on server' }) }
  const clientKey = req.headers['x-api-key']
  if (clientKey !== API_KEY) { return res.status(403).json({ error: 'مفتاح API غير صالح' }) }
  next()
})

// Rate limiting - simple in-memory
const rateLimits = new Map<string, { count: number; reset: number }>()
app.use('/api', (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const limit = rateLimits.get(ip)
  if (limit && now < limit.reset) {
    if (limit.count >= 200) {
      return res.status(429).json({ error: 'طلبات كثيرة، حاول لاحقاً' })
    }
    limit.count++
  } else {
    rateLimits.set(ip, { count: 1, reset: now + 60000 })
  }
  next()
})

// Health check (no API key needed)
app.get('/', (_req, res) => res.json({ status: 'ok' }))
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Mobile update - public (app needs it before login)
app.use('/api/mobile', mobileUpdateRoutes)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/platforms', platformRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/ministries', ministryRoutes)
app.use('/api/dashboard', dashboardRoutes)

async function start() {
  await initDB()
  app.listen(PORT, () => {
    console.log(`Minasa API running on port ${PORT}`)
  })
}

start().catch(console.error)
