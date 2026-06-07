import sharp from 'sharp'
import { supabase } from '../config/supabase'
import { HashSignal, MetadataSignal } from '../types'

// ── pHash ─────────────────────────────────────────────────────────────────────

async function generatePHash(buffer: Buffer): Promise<string> {
  const { data } = await sharp(buffer).resize(8, 8, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true })
  const pixels = Array.from(data)
  const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length
  const bits = pixels.map(p => (p >= avg ? '1' : '0')).join('')
  return bits.match(/.{4}/g)!.map(b => parseInt(b, 2).toString(16)).join('')
}

function hammingDistance(h1: string, h2: string): number {
  let d = 0
  for (let i = 0; i < Math.min(h1.length, h2.length); i++) {
    const xor = parseInt(h1[i], 16) ^ parseInt(h2[i], 16)
    d += xor.toString(2).split('1').length - 1
  }
  return d
}

export async function checkContentHash(buffer: Buffer): Promise<HashSignal> {
  try {
    const inputHash = await generatePHash(buffer)
    const { data: hashes } = await supabase.from('reference_hashes').select('label, phash, is_manipulated')
    let best: { label: string; distance: number; isManipulated: boolean } | null = null

    for (const ref of hashes ?? []) {
      const d = hammingDistance(inputHash, ref.phash)
      if (!best || d < best.distance) best = { label: ref.label, distance: d, isManipulated: ref.is_manipulated }
    }

    if (best && best.distance <= 10) {
      if (best.isManipulated) return { signal: 'content_fingerprint', score: -30, verdict: 'match_manipulated', reason: `Matches known manipulated clip: "${best.label}"`, matchedLabel: best.label }
      return { signal: 'content_fingerprint', score: 30, verdict: 'match_authentic', reason: `Matches known authentic clip: "${best.label}"`, matchedLabel: best.label }
    }

    return { signal: 'content_fingerprint', score: 0, verdict: 'no_match', reason: 'No match found in reference database' }
  } catch (err: any) {
    return { signal: 'content_fingerprint', score: 0, verdict: 'no_match', reason: `Hash check failed: ${err.message}` }
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function inspectMetadata(buffer: Buffer): Promise<MetadataSignal> {
  const flags: string[] = []
  try {
    const meta = await sharp(buffer).metadata()
    if (!meta.exif) flags.push('no_exif')
    if (!['jpeg', 'png', 'webp', 'gif'].includes(meta.format ?? '')) flags.push('unexpected_format')
    if ((meta.width ?? 0) < 100 || (meta.height ?? 0) < 100) flags.push('suspicious_dimensions')
    if (meta.density && (meta.density < 50 || meta.density > 1200)) flags.push('abnormal_density')

    if (flags.length === 0 && meta.exif) return { signal: 'metadata_analysis', score: 15, verdict: 'present', reason: 'Metadata present and consistent', flags }
    if (flags.includes('no_exif') && flags.length === 1) return { signal: 'metadata_analysis', score: -10, verdict: 'absent', reason: 'EXIF data missing — common in re-uploaded content', flags }
    return { signal: 'metadata_analysis', score: flags.length >= 2 ? -20 : -10, verdict: 'anomaly', reason: `Anomalies: ${flags.join(', ')}`, flags }
  } catch {
    return { signal: 'metadata_analysis', score: 0, verdict: 'absent', reason: 'Could not read metadata (non-image or corrupt file)', flags }
  }
}
