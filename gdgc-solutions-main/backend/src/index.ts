import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

dotenv.config()

import './config/redis'          // init Redis connection
import routes from './routes'
import { checkYtDlpInstalled } from './services/socialExtractor'

const app = express()
const PORT = process.env.PORT || 4000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: [
    'https://gdgc-solutions.vercel.app',
    process.env.FRONTEND_URL || '',
    'http://localhost:5173',
    'http://localhost:3000'
  ].filter(Boolean) as string[],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SpoProof API',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  })
})

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', routes)

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'not_found', message: 'Endpoint not found' }))

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'file_too_large', message: `File exceeds maximum size of ${process.env.MAX_FILE_SIZE_MB ?? 100}MB` })
  }
  res.status(500).json({ error: 'server_error', message: err.message ?? 'Internal server error' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🛡️  SpoProof API running on http://localhost:${PORT}`)
  console.log(`   Frontend: ${FRONTEND_URL}`)
  console.log(`   Health:   http://localhost:${PORT}/health\n`)
  await checkYtDlpInstalled()
})

export default app
