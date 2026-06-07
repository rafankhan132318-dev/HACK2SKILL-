import Redis from 'ioredis'
import dotenv from 'dotenv'
dotenv.config()

const redisUrl = process.env.REDIS_URL

// Only connect if we have a REAL external Redis URL (not localhost or empty)
export const redis = (redisUrl && !redisUrl.includes('localhost')) 
  ? new Redis(redisUrl, { 
      maxRetriesPerRequest: 0, 
      connectTimeout: 5000,
      showFriendlyErrorStack: false 
    }) 
  : null

if (redis) {
  redis.on('connect', () => console.log('✅ Redis connected'))
  redis.on('error', (err) => {
    // Silently log and ignore redis errors in production if it's just a connection issue
    if (process.env.NODE_ENV === 'production') return
    console.error('❌ Redis error:', err.message)
  })
} else {
  console.log('ℹ️  Running in Memory Mode (No Redis). Rate limiting disabled.')
}
