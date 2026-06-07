import { Router } from 'express'
import { requireAuth, requireCredits } from '../middleware/auth'
import { verifyLimiter, geminiLimiter, authLimiter, generalLimiter } from '../middleware/rateLimiter'
import { upload } from '../middleware/upload'

import { googleRedirect, googleCallback, emailLogin, emailRegister, getMe, updateProfile } from '../controllers/authController'
import { handleVerify, getVerification } from '../controllers/verifyController'
import { handleGeminiChat } from '../controllers/geminiController'
import {
  getDashboard, getReports, downloadReport,
  getCertificates, generateCertificate, downloadCertificate,
  getAlerts, markAlertRead,
  getSettings, updateSettings, updatePassword,
  getCreditsInfo,
} from '../controllers/appController'

const router = Router()

// ── Auth ──────────────────────────────────────────────────────────────────────
router.get('/auth/google',              authLimiter, googleRedirect)
router.get('/auth/google/callback',                  googleCallback)
router.post('/auth/register',           authLimiter, emailRegister)
router.post('/auth/login',              authLimiter, emailLogin)
router.get('/auth/me',                  requireAuth, getMe)
router.patch('/auth/me',                requireAuth, updateProfile)

// ── Verify (core feature) ─────────────────────────────────────────────────────
router.post(
  '/verify',
  requireAuth,
  verifyLimiter,
  requireCredits(parseInt(process.env.VERIFY_CREDIT_COST || '1')),
  upload.single('file'),
  handleVerify,
)
router.get('/verify/:id', requireAuth, generalLimiter, getVerification)

// ── Gemini Chat ───────────────────────────────────────────────────────────────
router.post(
  '/gemini/chat',
  requireAuth,
  geminiLimiter,
  requireCredits(parseInt(process.env.GEMINI_CHAT_CREDIT_COST || '1')),
  handleGeminiChat,
)

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', requireAuth, generalLimiter, getDashboard)

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports',           requireAuth, generalLimiter, getReports)
router.get('/reports/:id/download', requireAuth, downloadReport)

// ── Certificates ──────────────────────────────────────────────────────────────
router.get('/certificates',             requireAuth, generalLimiter, getCertificates)
router.post('/certificates',            requireAuth, generateCertificate)
router.get('/certificates/:id/download', requireAuth, downloadCertificate)

// ── Alerts ────────────────────────────────────────────────────────────────────
router.get('/alerts',           requireAuth, generalLimiter, getAlerts)
router.patch('/alerts/:id/read', requireAuth, markAlertRead)

// ── Settings ──────────────────────────────────────────────────────────────────
router.get('/settings',   requireAuth, getSettings)
router.patch('/settings', requireAuth, updateSettings)
router.post('/settings/password', requireAuth, updatePassword)

// ── Credits ───────────────────────────────────────────────────────────────────
router.get('/credits', requireAuth, getCreditsInfo)

export default router
