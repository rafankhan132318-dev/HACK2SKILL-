import { Request, Response } from 'express'
import axios from 'axios'
import { supabase } from '../config/supabase'
import { deductCredits } from '../services/creditService'
import { checkSourceCredibility } from '../services/sourceChecker'
import { checkContentHash, inspectMetadata } from '../services/mediaAnalyser'
import { analyseImageBuffer, analyseImageUrl, analyseVideoBuffer } from '../services/bitmindService'
import { reverseImageSearch } from '../services/reverseImageSearch'
import { sportsFactCheck } from '../services/factCheckService'
import { computeVerificationResult } from '../services/scoringEngine'
import { isSocialMediaUrl, extractSocialMediaUrl } from '../services/socialExtractor'
import { MediaType } from '../types'

const VERIFY_COST = parseInt(process.env.VERIFY_CREDIT_COST || '1')

function detectMediaType(file?: Express.Multer.File, url?: string): MediaType {
  if (file) {
    if (file.mimetype.startsWith('video/')) return 'video'
    if (file.mimetype.startsWith('image/')) return 'image'
    return 'article'
  }
  if (url) {
    const lower = url.toLowerCase()
    if (/\.(mp4|mov|avi|webm|mkv)(\?|$)/.test(lower)) return 'video'
    if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/.test(lower)) return 'image'
    if (/instagram|tiktok|youtube|twitter|x\.com|facebook/.test(lower)) return 'video'
  }
  return 'url'
}

export async function handleVerify(req: Request, res: Response) {
  const file = req.file
  const url = req.body?.url as string | undefined
  const selectedType = req.body?.type as MediaType | undefined

  if (!file && !url) {
    return res.status(400).json({ error: 'invalid_input', message: 'Provide a URL or upload a file.' })
  }

  if (url) {
    try { new URL(url) } catch { return res.status(400).json({ error: 'invalid_url', message: 'Invalid URL format.' }) }
  }

  // Deduct credits first
  const { success, newBalance } = await deductCredits(req.user!.id, VERIFY_COST, 'verify', { url, fileName: file?.originalname })
  if (!success) {
    return res.status(402).json({ error: 'insufficient_credits', message: `Not enough credits. Need ${VERIFY_COST}, have ${req.user!.credits}.`, credits: req.user!.credits })
  }

  let mediaType: MediaType = selectedType ?? detectMediaType(file, url)
  let mediaBuffer: Buffer | null = null
  let filename = file?.originalname ?? 'media'
  let resolvedUrl = url

  try {
    // ── Handle social media URLs (Instagram, TikTok, YouTube, etc.) ──────────
    if (url && isSocialMediaUrl(url)) {
      const extracted = await extractSocialMediaUrl(url)
      if (extracted) {
        resolvedUrl = extracted.directUrl
        mediaType = extracted.mediaType
        // Fetch buffer from direct URL
        try {
          const response = await axios.get(extracted.directUrl, { responseType: 'arraybuffer', timeout: 20000, maxContentLength: 150 * 1024 * 1024 })
          mediaBuffer = Buffer.from(response.data)
        } catch { /* non-fatal */ }
      }
    }

    // ── Use uploaded file buffer ──────────────────────────────────────────────
    if (file) {
      mediaBuffer = file.buffer
    } else if (!mediaBuffer && resolvedUrl && (mediaType === 'image' || mediaType === 'video')) {
      try {
        const response = await axios.get(resolvedUrl, { responseType: 'arraybuffer', timeout: 15000, maxContentLength: 100 * 1024 * 1024 })
        mediaBuffer = Buffer.from(response.data)
        filename = resolvedUrl.split('/').pop()?.split('?')[0] ?? 'media'
      } catch { /* non-fatal */ }
    }

    // ── Run all signals in parallel ───────────────────────────────────────────
    const [sourceResult, hashResult, metadataResult] = await Promise.all([
      resolvedUrl ? checkSourceCredibility(resolvedUrl)
        : Promise.resolve({ signal: 'source_credibility' as const, score: 0, verdict: 'unknown' as const, reason: 'Direct upload — no URL' }),
      mediaBuffer ? checkContentHash(mediaBuffer)
        : Promise.resolve({ signal: 'content_fingerprint' as const, score: 0, verdict: 'no_match' as const, reason: 'No buffer for hashing' }),
      mediaBuffer ? inspectMetadata(mediaBuffer)
        : Promise.resolve({ signal: 'metadata_analysis' as const, score: 0, verdict: 'absent' as const, reason: 'No buffer for metadata', flags: [] }),
    ])

    // ── Media-specific signals ────────────────────────────────────────────────
    let deepfakeResult = undefined
    let reverseImageResult = undefined
    let factCheckResult = undefined

    if (mediaType === 'image' || mediaType === 'screenshot') {
      const [deepfake, reverse, factCheck] = await Promise.all([
        mediaBuffer
          ? analyseImageBuffer(mediaBuffer, filename)
          : resolvedUrl ? analyseImageUrl(resolvedUrl) : Promise.resolve(undefined),
        resolvedUrl ? reverseImageSearch(resolvedUrl) : Promise.resolve(undefined),
        sportsFactCheck(filename, mediaType, resolvedUrl),
      ])
      deepfakeResult = deepfake
      reverseImageResult = reverse
      factCheckResult = factCheck
    }

    if (mediaType === 'video') {
      const [deepfake, factCheck] = await Promise.all([
        mediaBuffer ? analyseVideoBuffer(mediaBuffer, filename) : Promise.resolve(undefined),
        sportsFactCheck(filename, mediaType, resolvedUrl),
      ])
      deepfakeResult = deepfake
      factCheckResult = factCheck
    }

    if (mediaType === 'url' || mediaType === 'article') {
      factCheckResult = await sportsFactCheck(filename, mediaType, resolvedUrl)
    }

    // ── Compute final score ───────────────────────────────────────────────────
    const result = computeVerificationResult(
      req.user!.id, mediaType,
      sourceResult, hashResult, metadataResult,
      deepfakeResult, reverseImageResult, factCheckResult,
      filename, file?.size ?? mediaBuffer?.length,
      resolvedUrl,
    )

    // ── Persist to DB ─────────────────────────────────────────────────────────
    const { error: dbError } = await supabase.from('verifications').insert({
      id: result.id,
      user_id: result.userId,
      status: result.status,
      trust_score: result.trustScore,
      media_type: result.mediaType,
      file_name: result.fileName,
      file_size: result.fileSize,
      submitted_url: result.submittedUrl,
      metrics: result.metrics,
      signals: result.signals,
      recommendation: result.recommendation,
      credits_used: VERIFY_COST,
    })

    if (dbError) {
      console.error('❌ Database Save Error:', dbError.message, dbError.details)
    } else {
      console.log('✅ Verification saved to database.')
    }

    return res.status(200).json({
      success: true,
      creditsRemaining: newBalance,
      data: result,
    })
  } catch (err: any) {
    console.error('Verify error:', err)
    // Refund credit on hard failure
    await supabase.from('users').update({ credits: req.user!.credits }).eq('id', req.user!.id)
    return res.status(500).json({ error: 'processing_error', message: 'Verification failed. Credit refunded.' })
  }
}

// ── Get single verification ───────────────────────────────────────────────────

export async function getVerification(req: Request, res: Response) {
  const { id } = req.params
  const { data, error } = await supabase.from('verifications').select('*').eq('id', id).eq('user_id', req.user!.id).single()
  if (error || !data) return res.status(404).json({ error: 'not_found', message: 'Verification not found' })
  return res.json({ success: true, data })
}
