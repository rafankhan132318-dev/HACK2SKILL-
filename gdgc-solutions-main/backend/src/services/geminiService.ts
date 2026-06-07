import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { VerificationResult, ChatMessage } from '../types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

function buildSystemContext(result: VerificationResult): string {
  return `You are SpoProof's AI assistant. You help users understand the authenticity verification result of a sports media file.

VERIFICATION RESULT:
- File: ${result.fileName ?? result.submittedUrl ?? 'Unknown'}
- Status: ${result.status}
- Trust Score: ${result.trustScore}/100
- Media Type: ${result.mediaType}
- Analyzed at: ${result.createdAt}

METRICS:
- Authenticity: ${result.metrics.authenticity}%
- Source Match: ${result.metrics.sourceMatch}%
- Tamper Risk: ${result.metrics.tamperRisk}%
- AI Probability: ${result.metrics.aiProbability}%
- Metadata: ${result.metrics.metadataStatus}

SIGNAL BREAKDOWN:
- Source Credibility: ${result.signals.source.verdict} (${result.signals.source.reason})
- Content Hash: ${result.signals.hash.verdict} (${result.signals.hash.reason})
- Metadata: ${result.signals.metadata.verdict} (${result.signals.metadata.reason})
${result.signals.deepfake ? `- Deepfake Analysis: ${result.signals.deepfake.verdict} (${result.signals.deepfake.reason})` : ''}
${result.signals.reverseImage ? `- Reverse Image: ${result.signals.reverseImage.verdict} (${result.signals.reverseImage.reason})` : ''}
${result.signals.factCheck ? `- Sports Fact Check: ${result.signals.factCheck.verdict} (${result.signals.factCheck.reason})` : ''}

RECOMMENDATION: ${result.recommendation}

Answer questions about this result clearly and concisely. If asked about things unrelated to this verification, politely redirect the conversation back to the analysis. Do not make up information beyond what's in the verification data.`
}

export async function chatWithGemini(
  result: VerificationResult,
  userMessage: string,
  history: ChatMessage[]
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash', // Updated for your 2.0 key
    systemInstruction: buildSystemContext(result),
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
  })

  const chat = model.startChat({
    history: history
      .filter(m => m.role === 'user' || m.role === 'model')
      .map(m => ({
        role: m.role as 'user' | 'model',
        parts: [{ text: m.content }],
      })),
    generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
  })

  try {
    const response = await chat.sendMessage(userMessage)
    return response.response.text()
  } catch (err: any) {
    console.log('Gemini Error:', err.status, err.message)
    // Fallback if 2.0 is not available or returns 404
    if (err.status === 404 || err.message?.includes('404') || err.message?.includes('not found')) {
      console.log('Gemini 2.0 not available, falling back to Gemini Pro...')
      const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-pro' })
      const fallbackResponse = await fallbackModel.generateContent(`CONTEXT: ${buildSystemContext(result)}\n\nUSER MESSAGE: ${userMessage}`)
      return fallbackResponse.response.text()
    }
    throw err
  }
}
