import axios from 'axios'
import { ReverseImageSignal } from '../types'

const API_KEY = process.env.ZENSERP_API_KEY!
const TRUSTED = ['espn.com','nba.com','nfl.com','fifa.com','uefa.com','bbc.com','reuters.com','apnews.com','skysports.com','cbssports.com','foxsports.com','theathletic.com','si.com','premierleague.com']
const MANIPULATION_KEYWORDS = ['fake','edited','manipulated','photoshop','deepfake','altered','fabricated']

function isTrusted(url: string): boolean {
  try { const h = new URL(url).hostname.replace('www.',''); return TRUSTED.some(d => h.includes(d)) }
  catch { return false }
}

export async function reverseImageSearch(imageUrl: string): Promise<ReverseImageSignal> {
  try {
    const { data } = await axios.get('https://app.zenserp.com/api/v2/reverse_image_search', {
      params: { apikey: API_KEY, url: imageUrl },
      timeout: 10000,
    })

    const results = data?.image_results ?? []
    if (!results.length) return { signal: 'reverse_image_search', score: 0, verdict: 'no_results', reason: 'No web matches found', matchCount: 0, topMatches: [] }

    const topMatches = results.slice(0, 5).map((r: any) => ({ title: r.title ?? '', link: r.link ?? '', source: r.source ?? '' }))
    const trustedMatches = topMatches.filter((m: any) => isTrusted(m.link))
    const hasManipulation = topMatches.some((m: any) => MANIPULATION_KEYWORDS.some(kw => (m.title + m.source).toLowerCase().includes(kw)))

    if (hasManipulation) return { signal: 'reverse_image_search', score: -25, verdict: 'manipulated_copy_found', reason: 'Search results suggest this is a manipulated copy', matchCount: results.length, topMatches }
    if (trustedMatches.length > 0) return { signal: 'reverse_image_search', score: 20, verdict: 'original_found', reason: `Original found on trusted source: ${trustedMatches[0].source}`, matchCount: results.length, topMatches }
    return { signal: 'reverse_image_search', score: 5, verdict: 'original_found', reason: `Found ${results.length} web matches — no trusted origin confirmed`, matchCount: results.length, topMatches }
  } catch (err: any) {
    return { signal: 'reverse_image_search', score: 0, verdict: 'error', reason: `Reverse image search failed: ${err.message}`, matchCount: 0, topMatches: [] }
  }
}
