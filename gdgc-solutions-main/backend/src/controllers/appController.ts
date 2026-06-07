import { Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { v4 as uuidv4 } from 'uuid'

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

export async function getDashboard(req: Request, res: Response) {
  const userId = req.user!.id

  const [verifs, fakes, recent] = await Promise.all([
    supabase.from('verifications').select('trust_score, status, created_at').eq('user_id', userId),
    supabase.from('verifications').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'Fake'),
    supabase.from('verifications').select('id, file_name, media_type, status, trust_score, created_at')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
  ])

  const allVerifs = verifs.data ?? []
  const total = allVerifs.length
  const fakeCount = fakes.count ?? 0
  const avgTrust = total > 0 ? Math.round(allVerifs.reduce((s, v) => s + v.trust_score, 0) / total) : 0

  const stats = {
    totalVerifications: total,
    fakeContentFound: fakeCount,
    avgTrustScore: avgTrust,
    credits: req.user!.credits,
    trends: { verifications: 12.5, fakeContent: -3.2, trustScore: 1.8, users: 8.1 },
  }

  const recentActivity = (recent.data ?? []).map(v => ({
    id: v.id,
    name: v.file_name ?? 'URL submission',
    type: v.media_type.charAt(0).toUpperCase() + v.media_type.slice(1),
    status: v.status,
    score: v.trust_score,
    date: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }))

  return res.json({ success: true, stats, recentActivity })
}

// ── REPORTS ───────────────────────────────────────────────────────────────────

export async function getReports(req: Request, res: Response) {
  const { status, search, page = '1', limit = '20' } = req.query
  let query = supabase
    .from('verifications')
    .select('id, file_name, submitted_url, media_type, status, trust_score, created_at')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })

  if (status && status !== 'All') query = query.eq('status', status)
  if (search) query = query.ilike('file_name', `%${search}%`)

  const pageNum = parseInt(page as string)
  const pageSize = parseInt(limit as string)
  query = query.range((pageNum - 1) * pageSize, pageNum * pageSize - 1)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: 'db_error', message: error.message })

  const reports = (data ?? []).map(v => ({
    id: v.id,
    file: v.file_name ?? v.submitted_url ?? 'Unknown',
    type: v.media_type.charAt(0).toUpperCase() + v.media_type.slice(1),
    status: v.status,
    score: v.trust_score,
    date: new Date(v.created_at).toISOString().split('T')[0],
  }))

  return res.json({ success: true, data: reports, total: count ?? reports.length, page: pageNum, limit: pageSize })
}

export async function downloadReport(req: Request, res: Response) {
  const { id } = req.params
  const { data, error } = await supabase.from('verifications').select('*').eq('id', id).eq('user_id', req.user!.id).single()
  if (error || !data) return res.status(404).json({ error: 'not_found' })

  // Return structured JSON report (frontend can render to PDF)
  const report = {
    reportId: `RPT-${data.id.split('-')[0].toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    platform: 'SpoProof',
    verification: {
      id: data.id,
      status: data.status,
      trustScore: data.trust_score,
      mediaType: data.media_type,
      fileName: data.file_name,
      submittedUrl: data.submitted_url,
      analyzedAt: data.created_at,
      metrics: data.metrics,
      signals: data.signals,
      recommendation: data.recommendation,
    },
  }

  res.setHeader('Content-Disposition', `attachment; filename="spoproof-report-${data.id}.json"`)
  res.setHeader('Content-Type', 'application/json')
  return res.json(report)
}

// ── CERTIFICATES ──────────────────────────────────────────────────────────────

export async function getCertificates(req: Request, res: Response) {
  const { data } = await supabase.from('certificates').select('*').eq('user_id', req.user!.id).order('issued_at', { ascending: false })
  return res.json({ success: true, data: data ?? [] })
}

export async function generateCertificate(req: Request, res: Response) {
  const { verificationId } = req.body
  if (!verificationId) return res.status(400).json({ error: 'missing_verification_id' })

  const { data: verif } = await supabase.from('verifications').select('*').eq('id', verificationId).eq('user_id', req.user!.id).single()
  if (!verif) return res.status(404).json({ error: 'verification_not_found' })
  if (verif.status !== 'Verified') return res.status(400).json({ error: 'not_verified', message: 'Certificates can only be issued for Verified media.' })

  const certId = `CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(3, '0')}`
  const { data: cert, error } = await supabase.from('certificates').insert({
    id: uuidv4(), cert_id: certId, verification_id: verificationId,
    user_id: req.user!.id, asset: verif.file_name ?? verif.submitted_url ?? 'Unknown',
    owner: req.user!.organization ?? req.user!.name,
  }).select().single()

  if (error) return res.status(500).json({ error: 'cert_failed', message: error.message })
  return res.status(201).json({ success: true, data: cert })
}

export async function downloadCertificate(req: Request, res: Response) {
  const { id } = req.params
  const { data } = await supabase.from('certificates').select('*').eq('id', id).eq('user_id', req.user!.id).single()
  if (!data) return res.status(404).json({ error: 'not_found' })
  res.setHeader('Content-Disposition', `attachment; filename="${data.cert_id}.json"`)
  res.setHeader('Content-Type', 'application/json')
  return res.json({ certificate: data, platform: 'SpoProof', verifiedAt: data.issued_at })
}

// ── ALERTS ────────────────────────────────────────────────────────────────────

export async function getAlerts(req: Request, res: Response) {
  const { data } = await supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(50)
  return res.json({ success: true, data: data ?? [] })
}

export async function markAlertRead(req: Request, res: Response) {
  const { id } = req.params
  await supabase.from('alerts').update({ is_read: true }).eq('id', id)
  return res.json({ success: true })
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────

export async function getSettings(req: Request, res: Response) {
  const { data } = await supabase.from('user_settings').select('*').eq('user_id', req.user!.id).single()
  return res.json({ success: true, data: data ?? {} })
}

export async function updateSettings(req: Request, res: Response) {
  const settings = req.body
  const { data, error } = await supabase.from('user_settings')
    .upsert({ user_id: req.user!.id, ...settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select().single()
  if (error) return res.status(500).json({ error: 'update_failed', message: error.message })
  return res.json({ success: true, data })
}

export async function updatePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'missing_fields' })
  const { error } = await supabase.auth.admin.updateUserById(req.user!.id, { password: newPassword })
  if (error) return res.status(400).json({ error: 'update_failed', message: error.message })
  return res.json({ success: true, message: 'Password updated' })
}

// ── CREDITS ───────────────────────────────────────────────────────────────────

export async function getCreditsInfo(req: Request, res: Response) {
  const { data: history } = await supabase.from('credit_ledger').select('*').eq('user_id', req.user!.id).order('created_at', { ascending: false }).limit(20)
  return res.json({ success: true, credits: req.user!.credits, plan: req.user!.plan, history: history ?? [] })
}
