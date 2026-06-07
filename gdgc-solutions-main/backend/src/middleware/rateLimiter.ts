import { Request, Response, NextFunction } from 'express'
import { redis } from '../config/redis'

interface RateLimitConfig {
  key: string
  windowSec: number
  max: number
  blockSec?: number
}

export function createRateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Use user ID if authenticated, else hashed IP
    const userId = req.user?.id
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip ?? 'unknown'
    const identifier = userId ?? Buffer.from(ip).toString('base64')

    const blockKey = `block:${config.key}:${identifier}`
    const countKey = `rate:${config.key}:${identifier}`

    try {
      // If Redis is not available (e.g. on Render Free tier), skip rate limiting
      if (!redis) {
        return next()
      }

      // Check if blocked
      const blocked = await redis.get(blockKey)
      if (blocked) {
        const ttl = await redis.ttl(blockKey)
        res.set({ 'X-RateLimit-Limit': String(config.max), 'X-RateLimit-Remaining': '0', 'Retry-After': String(ttl) })
        return res.status(429).json({ error: 'rate_limit_exceeded', message: `Too many requests. Retry in ${ttl}s.`, retry_after: ttl })
      }

      const now = Date.now()
      const windowStart = now - config.windowSec * 1000
      const pipeline = redis.pipeline()
      pipeline.zremrangebyscore(countKey, '-inf', windowStart)
      pipeline.zadd(countKey, now, `${now}-${Math.random()}`)
      pipeline.zcard(countKey)
      pipeline.expire(countKey, config.windowSec)
      const results = await pipeline.exec()
      const count = (results?.[2]?.[1] as number) ?? 0

      const remaining = Math.max(0, config.max - count)
      res.set({ 'X-RateLimit-Limit': String(config.max), 'X-RateLimit-Remaining': String(remaining) })

      if (count > config.max) {
        if (config.blockSec) await redis.set(blockKey, '1', 'EX', config.blockSec)
        res.set('Retry-After', String(config.blockSec ?? config.windowSec))
        return res.status(429).json({ error: 'rate_limit_exceeded', message: 'Rate limit exceeded.', retry_after: config.blockSec })
      }

      next()
    } catch {
      next() // fail open
    }
  }
}

// ── Named limiters matching frontend usage ────────────────────────────────────

export const verifyLimiter = createRateLimiter({ key: 'verify', windowSec: 60, max: 5, blockSec: 60 })
export const geminiLimiter = createRateLimiter({ key: 'gemini', windowSec: 60, max: 10, blockSec: 30 })
export const authLimiter = createRateLimiter({ key: 'auth', windowSec: 300, max: 10, blockSec: 120 })
export const generalLimiter = createRateLimiter({ key: 'general', windowSec: 60, max: 60 })
