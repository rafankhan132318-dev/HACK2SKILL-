import { supabase } from '../config/supabase'
import { SourceSignal } from '../types'

export async function checkSourceCredibility(inputUrl: string): Promise<SourceSignal> {
  try {
    const hostname = new URL(inputUrl).hostname.replace('www.', '')
    const { data } = await supabase
      .from('trusted_sources')
      .select('name, domain')
      .eq('is_active', true)
      .eq('domain', hostname)
      .maybeSingle()

    if (data) {
      return { signal: 'source_credibility', score: 40, verdict: 'verified', reason: `Verified source: ${data.name}`, sourceName: data.name }
    }
    return { signal: 'source_credibility', score: 0, verdict: 'unknown', reason: 'Source domain not in trusted sources list' }
  } catch {
    return { signal: 'source_credibility', score: 0, verdict: 'unknown', reason: 'Could not resolve source domain' }
  }
}
