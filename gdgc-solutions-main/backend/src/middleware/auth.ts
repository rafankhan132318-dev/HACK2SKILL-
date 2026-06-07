import { Request, Response, NextFunction } from 'express'
import { verifyJWT } from '../utils/jwt'
import { supabase } from '../config/supabase'
import { User } from '../types'

// Extend Express request with user
declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized', message: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = verifyJWT(token)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single()

    if (error || !data) {
      return res.status(401).json({ error: 'unauthorized', message: 'User not found' })
    }

    req.user = data as User
    next()
  } catch (err: any) {
    return res.status(401).json({ error: 'unauthorized', message: err.message })
  }
}

// Middleware factory — checks user has enough credits
export function requireCredits(cost: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' })
    if (req.user.credits < cost) {
      return res.status(402).json({
        error: 'insufficient_credits',
        message: `This action costs ${cost} credit(s). You have ${req.user.credits}.`,
        credits: req.user.credits,
        required: cost,
      })
    }
    next()
  }
}
