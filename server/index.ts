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
import dashboardRoutes from './routes/dashboard'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Health check
app.get('/', (_req, res) => res.json({ status: 'ok', name: 'Minasa API' }))
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/platforms', platformRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/dashboard', dashboardRoutes)

async function start() {
  await initDB()
  app.listen(PORT, () => {
    console.log(`Minasa API server running on port ${PORT}`)
  })
}

start().catch(console.error)
