import { execFile } from 'child_process'
import { promisify } from 'util'
import axios from 'axios'

const execFileAsync = promisify(execFile)

const SOCIAL_PATTERNS = [
  /instagram\.com/,
  /tiktok\.com/,
  /twitter\.com|x\.com/,
  /facebook\.com/,
  /youtube\.com|youtu\.be/,
  /reddit\.com/,
]

export function isSocialMediaUrl(url: string): boolean {
  return SOCIAL_PATTERNS.some(p => p.test(url))
}

export interface ExtractedMedia {
  directUrl: string
  title?: string
  platform: string
  mediaType: 'video' | 'image'
}

// Helper to run yt-dlp either as a standalone command or via python module
async function runYtDlp(args: string[]): Promise<{ stdout: string }> {
  try {
    return await execFileAsync('yt-dlp', args, { timeout: 30000 })
  } catch (err: any) {
    // If standalone yt-dlp fails, try running as python module (common for pip installs on Windows)
    try {
      return await execFileAsync('python', ['-m', 'yt_dlp', ...args], { timeout: 30000 })
    } catch {
      throw err // Throw the original error if both fail
    }
  }
}

export async function extractSocialMediaUrl(url: string): Promise<ExtractedMedia | null> {
  const platform = detectPlatform(url)

  try {
    // Use yt-dlp to get the direct media URL (no download)
    const { stdout } = await runYtDlp([
      '--get-url',
      '--format', 'best[height<=720]/best',
      '--no-playlist',
      url,
    ])

    const directUrl = stdout.trim().split('\n')[0]
    if (!directUrl || !directUrl.startsWith('http')) return null

    return { directUrl, platform, mediaType: 'video' }
  } catch {
    // yt-dlp not installed or URL not supported — try oEmbed for images
    return tryOEmbed(url, platform)
  }
}

async function tryOEmbed(url: string, platform: string): Promise<ExtractedMedia | null> {
  try {
    // Instagram oEmbed
    if (platform === 'Instagram') {
      const { data } = await axios.get(`https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`, { timeout: 5000 })
      if (data?.thumbnail_url) return { directUrl: data.thumbnail_url, title: data.title, platform, mediaType: 'image' }
    }
    return null
  } catch { return null }
}

function detectPlatform(url: string): string {
  if (/instagram/.test(url)) return 'Instagram'
  if (/tiktok/.test(url)) return 'TikTok'
  if (/twitter|x\.com/.test(url)) return 'X (Twitter)'
  if (/facebook/.test(url)) return 'Facebook'
  if (/youtube|youtu\.be/.test(url)) return 'YouTube'
  if (/reddit/.test(url)) return 'Reddit'
  return 'Unknown'
}

// Install check — warn on startup if yt-dlp is missing
export async function checkYtDlpInstalled(): Promise<boolean> {
  try {
    await runYtDlp(['--version'])
    return true
  } catch {
    console.warn('⚠️  yt-dlp not found — social media URL extraction will be limited.')
    console.warn('    Install: pip install yt-dlp  OR  brew install yt-dlp')
    return false
  }
}
