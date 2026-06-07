import axios from 'axios'
import { FactCheckSignal } from '../types'

const API_KEY = process.env.GOOGLE_SEARCH_API_KEY!
const CX = process.env.GOOGLE_SEARCH_CX!

interface SearchItem {
  title: string
  link: string
  displayLink: string
  snippet: string
}

async function googleSearch(query: string, num = 5): Promise<SearchItem[]> {
  if (!API_KEY || !CX) return []
  try {
    const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: { key: API_KEY, cx: CX, q: query, num },
      timeout: 8000,
    })
    return (data.items ?? []) as SearchItem[]
  } catch { return [] }
}

export async function sportsFactCheck(
  fileName: string,
  mediaType: string,
  submittedUrl?: string
): Promise<FactCheckSignal> {
  if (!API_KEY || !CX) {
    return {
      signal: 'sports_fact_check', score: 0, verdict: 'skipped',
      reason: 'Google Search API not configured — fact check skipped',
      relatedArticles: [],
    }
  }

  try {
    // Build a search query from the filename / URL context
    const context = submittedUrl
      ? new URL(submittedUrl).hostname.replace('www.', '')
      : fileName.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')

    const query = `sports ${context} authentic verification site:reuters.com OR site:apnews.com OR site:bbc.com OR site:espn.com`
    const results = await googleSearch(query, 5)

    if (!results.length) {
      return {
        signal: 'sports_fact_check', score: 0, verdict: 'unconfirmed',
        reason: 'No related news articles found to cross-reference',
        relatedArticles: [],
      }
    }

    const relatedArticles = results.map(r => ({
      title: r.title,
      url: r.link,
      source: r.displayLink,
      snippet: r.snippet,
    }))

    // If trusted news sources covered the same event, boost score
    const TRUSTED_DOMAINS = ['reuters.com','apnews.com','bbc.com','espn.com','nba.com','nfl.com']
    const trustedCount = relatedArticles.filter(a => TRUSTED_DOMAINS.some(d => a.source.includes(d))).length

    if (trustedCount >= 2) {
      return { signal: 'sports_fact_check', score: 15, verdict: 'confirmed', reason: `${trustedCount} trusted news sources confirm this event`, relatedArticles }
    }

    return { signal: 'sports_fact_check', score: 5, verdict: 'unconfirmed', reason: 'Related articles found but event not independently confirmed by multiple sources', relatedArticles }
  } catch (err: any) {
    return { signal: 'sports_fact_check', score: 0, verdict: 'skipped', reason: `Fact check error: ${err.message}`, relatedArticles: [] }
  }
}

// "Did you mean this?" — used in the result page related news panel
export async function getRelatedNews(query: string): Promise<SearchItem[]> {
  return googleSearch(`sports ${query}`, 5)
}
