import axios, { AxiosError } from 'axios'
import FormData from 'form-data'
import { DeepfakeSignal } from '../types'

const API_KEY = process.env.BITMIND_API_KEY!
const BASE = 'https://api.bitmind.ai/oracle/v1/34'
const HEADERS = { Authorization: `Bearer ${API_KEY}`, 'x-bitmind-application': 'oracle-api' }

function mapVerdict(isAi: boolean, confidence: number): DeepfakeSignal['verdict'] {
  if (!isAi && confidence >= 0.75) return 'likely_authentic'
  if (isAi && confidence >= 0.75) return 'likely_manipulated'
  return 'possibly_manipulated'
}

function verdictToScore(v: DeepfakeSignal['verdict']): number {
  return { likely_authentic: 20, possibly_manipulated: -15, likely_manipulated: -40, unknown: 0 }[v]
}

function handleError(err: unknown): DeepfakeSignal {
  const e = err as AxiosError<any>
  const status = e.response?.status
  let reason = `Bitmind error: ${e.message}`
  if (status === 401) reason = 'Bitmind API key invalid'
  if (status === 429) reason = 'Bitmind rate limit — try again shortly'
  if (status === 413) reason = 'File too large for Bitmind (max 10MB direct)'
  return { signal: 'deepfake_analysis', score: 0, verdict: 'unknown', reason, flags: [], details: {} }
}

function parseImageResponse(data: any): DeepfakeSignal {
  const isAi: boolean = data.isAi ?? data.is_ai ?? false
  const confidence: number = data.confidence ?? 0.5
  const fakeScore = data.fake_score ?? data.fakeScore ?? (isAi ? confidence : 1 - confidence)
  const realScore = data.real_score ?? data.realScore ?? (isAi ? 1 - confidence : confidence)
  const verdict = mapVerdict(isAi, confidence)
  const flags: string[] = []
  if (fakeScore > 0.8) flags.push('high_fake_confidence')
  if (realScore < 0.2) flags.push('low_real_confidence')
  if (isAi && fakeScore > 0.95) flags.push('near_certain_ai_generated')

  return {
    signal: 'deepfake_analysis', score: verdictToScore(verdict), verdict,
    reason: isAi
      ? `Bitmind: AI-generated/manipulated image (${Math.round(confidence * 100)}% confidence)`
      : `Bitmind: Authentic image (${Math.round(confidence * 100)}% confidence)`,
    flags,
    details: { isAi, confidence: +confidence.toFixed(3), fakeScore: +fakeScore.toFixed(3), realScore: +realScore.toFixed(3) },
  }
}

function parseVideoResponse(data: any): DeepfakeSignal {
  const isAi: boolean = data.isAi ?? data.is_ai ?? false
  const confidence: number = data.confidence ?? 0.5
  const totalFrames: number = data.total_frames ?? data.totalFrames ?? 0
  const fakeFrames: number = data.fake_frames ?? data.fakeFrames ?? 0
  const realFrames: number = data.real_frames ?? data.realFrames ?? 0
  const fakePct = totalFrames > 0 ? fakeFrames / totalFrames : 0
  const verdict = mapVerdict(isAi, confidence)
  const flags: string[] = []
  if (fakePct > 0.5) flags.push(`${Math.round(fakePct * 100)}%_frames_ai`)
  if (fakePct > 0.8) flags.push('majority_frames_manipulated')

  return {
    signal: 'deepfake_analysis', score: verdictToScore(verdict), verdict,
    reason: isAi
      ? `Bitmind: ${fakeFrames}/${totalFrames} video frames flagged as AI (${Math.round(confidence * 100)}% confidence)`
      : `Bitmind: Video verified authentic — ${realFrames}/${totalFrames} real frames`,
    flags,
    details: { isAi, confidence: +confidence.toFixed(3), totalFrames, fakeFrames, realFrames, fakeFramePercent: +fakePct.toFixed(3) },
  }
}

export async function analyseImageBuffer(buffer: Buffer, filename: string): Promise<DeepfakeSignal> {
  try {
    const form = new FormData()
    form.append('image', buffer, { filename, contentType: 'image/jpeg' })
    form.append('rich', 'true')
    const { data } = await axios.post(`${BASE}/detect-image`, form, { headers: { ...HEADERS, ...form.getHeaders() }, timeout: 30000 })
    return parseImageResponse(data)
  } catch (err) { return handleError(err) }
}

export async function analyseImageUrl(imageUrl: string): Promise<DeepfakeSignal> {
  try {
    const { data } = await axios.post(`${BASE}/detect-image`, { image: imageUrl, rich: true }, { headers: { ...HEADERS, 'Content-Type': 'application/json' }, timeout: 30000 })
    return parseImageResponse(data)
  } catch (err) { return handleError(err) }
}

export async function analyseVideoBuffer(buffer: Buffer, filename: string): Promise<DeepfakeSignal> {
  if (buffer.length <= 10 * 1024 * 1024) {
    try {
      const form = new FormData()
      form.append('video', buffer, { filename, contentType: 'video/mp4' })
      form.append('rich', 'true')
      const { data } = await axios.post(`${BASE}/detect-video`, form, { headers: { ...HEADERS, ...form.getHeaders() }, timeout: 120000 })
      return parseVideoResponse(data)
    } catch (err) { return handleError(err) }
  }

  // Large video: presigned S3 flow
  try {
    const presigned = await axios.post(`${BASE}/get-video-upload-url`, { filename, contentType: 'video/mp4' }, { headers: { ...HEADERS, 'Content-Type': 'application/json' }, timeout: 10000 })
    const { url: s3Url, fields, video_url: videoUrl } = presigned.data
    const s3Form = new FormData()
    Object.entries(fields as Record<string, string>).forEach(([k, v]) => s3Form.append(k, v))
    s3Form.append('file', buffer, { filename, contentType: 'video/mp4' })
    await axios.post(s3Url, s3Form, { headers: s3Form.getHeaders(), timeout: 180000, maxContentLength: 200 * 1024 * 1024 })
    const { data } = await axios.post(`${BASE}/detect-video`, { video: videoUrl, rich: true }, { headers: { ...HEADERS, 'Content-Type': 'application/json' }, timeout: 180000 })
    return parseVideoResponse(data)
  } catch (err) { return handleError(err) }
}
