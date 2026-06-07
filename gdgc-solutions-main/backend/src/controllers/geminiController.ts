import { Request, Response } from 'express'
import { supabase } from '../config/supabase'
import { deductCredits } from '../services/creditService'
import { chatWithGemini } from '../services/geminiService'
import { VerificationResult, ChatMessage } from '../types'

const GEMINI_COST = parseInt(process.env.GEMINI_CHAT_CREDIT_COST || '1')

export async function handleGeminiChat(req: Request, res: Response) {
  const { verificationId, message, history = [] } = req.body as {
    verificationId: string
    message: string
    history: ChatMessage[]
  }

  if (!verificationId || !message?.trim()) {
    return res.status(400).json({ error: 'invalid_input', message: 'verificationId and message are required' })
  }

  // Fetch the verification result for context
  const { data: verif, error } = await supabase
    .from('verifications').select('*').eq('id', verificationId).eq('user_id', req.user!.id).single()
  if (error || !verif) return res.status(404).json({ error: 'verification_not_found' })

  // Deduct credits
  const { success, newBalance } = await deductCredits(req.user!.id, GEMINI_COST, 'gemini_chat', { verificationId })
  if (!success) {
    return res.status(402).json({
      error: 'insufficient_credits',
      message: `Gemini chat costs ${GEMINI_COST} credit. You have ${req.user!.credits}.`,
      credits: req.user!.credits,
    })
  }

  try {
    // Map DB row to VerificationResult type
    const result: VerificationResult = {
      id: verif.id,
      userId: verif.user_id,
      status: verif.status,
      trustScore: verif.trust_score,
      mediaType: verif.media_type,
      fileName: verif.file_name,
      fileSize: verif.file_size,
      submittedUrl: verif.submitted_url,
      metrics: verif.metrics,
      signals: verif.signals,
      recommendation: verif.recommendation,
      createdAt: verif.created_at,
    }

    const reply = await chatWithGemini(result, message, history)

    return res.json({
      success: true,
      reply,
      creditsRemaining: newBalance,
    })
  } catch (err: any) {
    console.error('Gemini error:', err)
    // Refund on failure
    await supabase.from('users').update({ credits: req.user!.credits }).eq('id', req.user!.id)
    return res.status(500).json({ error: 'gemini_error', message: 'AI chat failed. Credit refunded.' })
  }
}
