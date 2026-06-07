// ── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  provider: 'google' | 'email'
  credits: number
  plan: 'free' | 'pro'
  organization?: string
  role?: string
  created_at: string
}

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

// ── Verification ──────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video' | 'screenshot' | 'article' | 'url'
export type VerificationStatus = 'Verified' | 'Suspicious' | 'Fake'

export interface SignalResult {
  signal: string
  score: number          // points contribution
  verdict: string
  reason: string
  flags?: string[]
  details?: Record<string, unknown>
}

export interface SourceSignal extends SignalResult {
  signal: 'source_credibility'
  verdict: 'verified' | 'unknown'
  sourceName?: string
}

export interface HashSignal extends SignalResult {
  signal: 'content_fingerprint'
  verdict: 'match_authentic' | 'match_manipulated' | 'no_match'
  matchedLabel?: string
}

export interface MetadataSignal extends SignalResult {
  signal: 'metadata_analysis'
  verdict: 'present' | 'absent' | 'anomaly'
  flags: string[]
}

export interface DeepfakeSignal extends SignalResult {
  signal: 'deepfake_analysis'
  verdict: 'likely_authentic' | 'possibly_manipulated' | 'likely_manipulated' | 'unknown'
  details: {
    isAi?: boolean
    confidence?: number
    fakeScore?: number
    realScore?: number
    totalFrames?: number
    fakeFrames?: number
    realFrames?: number
    fakeFramePercent?: number
  }
}

export interface ReverseImageSignal extends SignalResult {
  signal: 'reverse_image_search'
  verdict: 'original_found' | 'manipulated_copy_found' | 'no_results' | 'error'
  matchCount: number
  topMatches: { title: string; link: string; source: string }[]
}

export interface FactCheckSignal extends SignalResult {
  signal: 'sports_fact_check'
  verdict: 'confirmed' | 'unconfirmed' | 'contradicted' | 'skipped'
  relatedArticles: { title: string; url: string; source: string; snippet: string }[]
}

export interface VerificationResult {
  id: string
  userId: string
  status: VerificationStatus
  trustScore: number           // 0–100
  mediaType: MediaType
  fileName?: string
  fileSize?: number
  submittedUrl?: string
  metrics: {
    authenticity: number       // 0–100
    sourceMatch: number        // 0–100
    tamperRisk: number         // 0–100 (higher = more risk)
    aiProbability: number      // 0–100 (higher = more likely AI)
    metadataStatus: 'Clean' | 'Partial' | 'Altered'
  }
  signals: {
    source: SourceSignal
    hash: HashSignal
    metadata: MetadataSignal
    deepfake?: DeepfakeSignal
    reverseImage?: ReverseImageSignal
    factCheck?: FactCheckSignal
  }
  recommendation: string
  createdAt: string
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalVerifications: number
  fakeContentFound: number
  avgTrustScore: number
  activeUsers: number
  trends: {
    verifications: number   // % change
    fakeContent: number
    trustScore: number
    users: number
  }
}

export interface ActivityItem {
  id: string
  name: string
  type: string
  status: VerificationStatus
  score: number
  date: string
}

// ── Certificate ───────────────────────────────────────────────────────────────

export interface Certificate {
  id: string
  certId: string
  verificationId: string
  asset: string
  owner: string
  issuedAt: string
  userId: string
}

// ── Alert ─────────────────────────────────────────────────────────────────────

export interface Alert {
  id: string
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  source: string
  createdAt: string
  isRead: boolean
}

// ── Gemini Chat ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export interface GeminiChatRequest {
  verificationId: string
  message: string
  history: ChatMessage[]
}
