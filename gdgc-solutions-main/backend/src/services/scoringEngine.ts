import { SourceSignal, HashSignal, MetadataSignal, DeepfakeSignal, ReverseImageSignal, FactCheckSignal, VerificationResult, VerificationStatus, MediaType } from '../types'
import { v4 as uuidv4 } from 'uuid'

const NEUTRAL_BASE = 15

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }

function deriveStatus(score: number): VerificationStatus {
  if (score >= 70) return 'Verified'
  if (score >= 40) return 'Suspicious'
  return 'Fake'
}

function deriveMetadataStatus(meta: MetadataSignal): 'Clean' | 'Partial' | 'Altered' {
  if (meta.verdict === 'present') return 'Clean'
  if (meta.verdict === 'absent') return 'Partial'
  return 'Altered'
}

function buildRecommendation(status: VerificationStatus, signals: VerificationResult['signals']): string {
  if (status === 'Verified') return 'Content appears authentic across all verification signals. Safe to share with confidence.'
  if (status === 'Fake') {
    const reasons: string[] = []
    if (signals.deepfake?.verdict === 'likely_manipulated') reasons.push('strong AI/deepfake signals detected')
    if (signals.reverseImage?.verdict === 'manipulated_copy_found') reasons.push('known manipulated copy found online')
    if (signals.hash.verdict === 'match_manipulated') reasons.push('matches known manipulated reference')
    if (signals.source.verdict === 'unknown') reasons.push('unverified source')
    return `High risk — ${reasons.join('; ')}. Do not share without thorough independent verification.`
  }
  if (signals.deepfake?.verdict === 'possibly_manipulated') return 'Possible manipulation signals detected. Verify with additional sources before sharing.'
  if (signals.source.verdict === 'verified') return 'Source is trusted but content could not be fully verified. Treat with moderate caution.'
  return 'Source and content could not be fully verified. Independently confirm before sharing.'
}

export function computeVerificationResult(
  userId: string,
  mediaType: MediaType,
  source: SourceSignal,
  hash: HashSignal,
  metadata: MetadataSignal,
  deepfake?: DeepfakeSignal,
  reverseImage?: ReverseImageSignal,
  factCheck?: FactCheckSignal,
  fileName?: string,
  fileSize?: number,
  submittedUrl?: string,
): VerificationResult {
  // 1. Calculate Base Score
  let score = NEUTRAL_BASE + source.score + hash.score
  
  // 1b. Fact-Check Boost (HUGE PRIORITY)
  if (factCheck?.verdict === 'confirmed') {
    score += 50
    console.log('[Scoring] Event CONFIRMED by Fact-Check. Adding +50 points.')
  } else if (factCheck?.verdict === 'contradicted') {
    score -= 50
  }
  
  // 2. Metadata Boost
  if (metadata.verdict === 'present') score += 40
  else if (metadata.verdict === 'anomaly') score -= 30

  // 3. Media-Specific Signals
  if (deepfake) score += deepfake.score
  if (reverseImage) score += reverseImage.score

  // 4. PRODUCTION OVERRIDES (Precision Logic)
  let isCriticallyFailed = false
  
  // If Bitmind says deepfake, but Gemini says it's a real sports event, we reduce the penalty
  const isFactConfirmed = factCheck?.verdict === 'confirmed'
  
  if (deepfake?.verdict === 'likely_manipulated') {
    if (isFactConfirmed) {
      console.log('[Scoring] Deepfake signal detected, but Fact-Check confirmed the event. Reducing penalty.')
      score = Math.max(score, 45) // Boost to 'Suspicious' instead of 'Fake'
    } else {
      isCriticallyFailed = true
    }
  }

  if (hash.verdict === 'match_manipulated') isCriticallyFailed = true
  if (reverseImage?.verdict === 'manipulated_copy_found') isCriticallyFailed = true

  if (isCriticallyFailed) {
    score = Math.min(score, 25) // Cap at 25% (Fake)
  }

  const trustScore = clamp(score, 0, 100)
  const status = deriveStatus(trustScore)

  console.log(`[ProductionScoring] Result:${status} Score:${trustScore} (CriticalFail:${isCriticallyFailed})`)

  // Map to the exact metrics the ResultPage.jsx expects
  const authenticity = trustScore
  const sourceMatch = source.verdict === 'verified' ? clamp(70 + source.score, 0, 100) : clamp(20 + hash.score, 0, 100)
  const tamperRisk = deepfake
    ? clamp(deepfake.details.fakeScore ? deepfake.details.fakeScore * 100 : (100 - trustScore), 0, 100)
    : clamp(100 - trustScore, 0, 100)
  const aiProbability = deepfake?.details.fakeScore
    ? Math.round(deepfake.details.fakeScore * 100)
    : status === 'Fake' ? clamp(100 - trustScore + 20, 0, 100) : clamp(100 - trustScore, 5, 100)
  const metadataStatus = deriveMetadataStatus(metadata)

  const signals: VerificationResult['signals'] = { source, hash, metadata, deepfake, reverseImage, factCheck }
  const recommendation = buildRecommendation(status, signals)

  return {
    id: uuidv4(),
    userId,
    status,
    trustScore,
    mediaType,
    fileName,
    fileSize,
    submittedUrl,
    metrics: { authenticity, sourceMatch, tamperRisk, aiProbability, metadataStatus },
    signals,
    recommendation,
    createdAt: new Date().toISOString(),
  }
}
