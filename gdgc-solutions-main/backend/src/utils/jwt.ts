import crypto from 'crypto'
import { JWTPayload } from '../types'

const SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this'
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function parseExpiry(exp: string): number {
  const match = exp.match(/^(\d+)([smhd])$/)
  if (!match) return 7 * 24 * 3600
  const val = parseInt(match[1])
  const unit = match[2]
  const multiplier: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 }
  return val * multiplier[unit]
}

export function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = base64url(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + parseExpiry(EXPIRES_IN),
  }))
  const sig = base64url(
    crypto.createHmac('sha256', SECRET).update(`${header}.${fullPayload}`).digest()
  )
  return `${header}.${fullPayload}.${sig}`
}

export function verifyJWT(token: string): JWTPayload {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token format')
  const [header, payload, sig] = parts
  const expectedSig = base64url(
    crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest()
  )
  if (sig !== expectedSig) throw new Error('Invalid token signature')
  const decoded = JSON.parse(Buffer.from(payload, 'base64').toString()) as JWTPayload
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired')
  return decoded
}
