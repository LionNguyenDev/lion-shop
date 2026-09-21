import dbConnect from '@/lib/db'
import { TIKTOK_CACHE_TTL } from '@/lib/types'
import TikTokStat from '@/models/TikTokStat'

export interface TikTokStats {
  videoId: string
  title: string       // only photo posts have a title; '' for regular videos
  description: string // the caption, hashtags included; '' when there is none
  followers: number
  views: number
  likes: number
  comments: number
  favorites: number
  shares: number
  cached: boolean
}

/**
 * Error with a user-facing (Vietnamese) message and an HTTP status for the API.
 * `blocked` marks failures that look like TikTok refusing us (captcha, bounce, timeout)
 * rather than a problem with the link itself — the client stops the run on a streak of these.
 */
export class TikTokError extends Error {
  constructor(message: string, public status = 502, public blocked = false) {
    super(message)
  }
}

const SHORT_HOSTS   = ['vt.tiktok.com', 'vm.tiktok.com']
const ALLOWED_HOSTS = ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', ...SHORT_HOSTS]
const VIDEO_ID_RE   = /\/(?:video|photo)\/(\d+)/
const DATA_RE       = /<script[^>]+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
}

/** Validates the input is a TikTok URL — also prevents the server fetching arbitrary hosts */
export function parseTikTokUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    throw new TikTokError('Link không hợp lệ', 400)
  }
  if (url.protocol !== 'https:' || !ALLOWED_HOSTS.includes(url.hostname)) {
    throw new TikTokError('Chỉ hỗ trợ link TikTok', 400)
  }
  // Full links must point at a video; short links are resolved by following the redirect
  if (!SHORT_HOSTS.includes(url.hostname) && !VIDEO_ID_RE.test(url.pathname)) {
    throw new TikTokError('Link không phải link video TikTok', 400)
  }
  return url
}

function toNumber(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

async function fetchFromTikTok(url: URL): Promise<Omit<TikTokStats, 'cached'>> {
  let res: Response
  try {
    res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(10_000) })
  } catch (error) {
    console.warn('[tiktok] fetch failed', JSON.stringify({ url: url.href, error: String(error) }))
    throw new TikTokError('Không kết nối được tới TikTok, thử lại sau', 504, true)
  }

  // Short links redirect to the full URL — make sure we still ended up on TikTok
  const finalUrl = new URL(res.url)
  if (!finalUrl.hostname.endsWith('tiktok.com')) {
    throw new TikTokError('Link không trỏ tới video TikTok', 400)
  }
  const html = await res.text()
  // Enough context in Vercel logs to tell a captcha page from a redirect or an empty shell
  const logBlocked = (reason: string) =>
    console.warn(`[tiktok] ${reason}`, JSON.stringify({
      url:      url.href,
      finalUrl: res.url,
      status:   res.status,
      htmlSize: html.length,
      title:    html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1]?.slice(0, 100),
    }))

  const videoId = finalUrl.pathname.match(VIDEO_ID_RE)?.[1]
  if (!videoId) {
    // A short link that goes nowhere is just a bad link; a full video link bounced to home/login means we're blocked
    if (SHORT_HOSTS.includes(url.hostname)) {
      throw new TikTokError('Link rút gọn không hợp lệ hoặc đã hết hạn', 404)
    }
    logBlocked('redirected away from video')
    throw new TikTokError('Không tìm thấy video trong link', 503, true)
  }

  const raw = html.match(DATA_RE)?.[1]
  if (!raw) {
    logBlocked('no data script (captcha?)')
    throw new TikTokError('TikTok đang chặn request, thử lại sau ít phút', 503, true)
  }

  let detail
  try {
    detail = JSON.parse(raw)?.__DEFAULT_SCOPE__?.['webapp.video-detail']
  } catch {
    throw new TikTokError('Không đọc được dữ liệu TikTok')
  }

  const item = detail?.itemInfo?.itemStruct
  if (!item) {
    // statusCode != 0 means deleted / private / region-locked
    if (detail?.statusCode) {
      console.warn('[tiktok] video unavailable', JSON.stringify({ url: url.href, statusCode: detail.statusCode }))
      throw new TikTokError('Video không tồn tại hoặc đang ở chế độ riêng tư', 404)
    }
    logBlocked('no video detail in data')
    throw new TikTokError('TikTok đang chặn request, thử lại sau ít phút', 503, true)
  }

  // statsV2 / authorStatsV2 hold exact values as strings; stats / authorStats are the older numeric shape
  const s = { ...item.stats, ...item.statsV2 }
  const a = { ...item.authorStats, ...item.authorStatsV2 }
  return {
    videoId,
    title:       typeof item.imagePost?.title === 'string' ? item.imagePost.title.trim() : '',
    description: typeof item.desc === 'string' ? item.desc.trim() : '',
    followers: toNumber(a.followerCount),
    views:     toNumber(s.playCount),
    likes:     toNumber(s.diggCount),
    comments:  toNumber(s.commentCount),
    favorites: toNumber(s.collectCount),
    shares:    toNumber(s.shareCount),
  }
}

export async function getTikTokStats(rawUrl: string): Promise<TikTokStats> {
  const url = parseTikTokUrl(rawUrl)
  await dbConnect()

  // Full links carry the video id, so we can serve from cache without hitting TikTok
  const knownId = url.pathname.match(VIDEO_ID_RE)?.[1]
  if (knownId) {
    const hit = await TikTokStat.findOne({
      videoId:   knownId,
      fetchedAt: { $gt: new Date(Date.now() - TIKTOK_CACHE_TTL * 1000) },
      // Entries cached before these fields were tracked count as a miss
      followers:   { $exists: true },
      description: { $exists: true },
    }).lean()
    if (hit) {
      const { videoId, title, description, followers, views, likes, comments, favorites, shares } = hit
      return { videoId, title, description, followers, views, likes, comments, favorites, shares, cached: true }
    }
  }

  const stats = await fetchFromTikTok(url)
  await TikTokStat.updateOne(
    { videoId: stats.videoId },
    { $set: { ...stats, fetchedAt: new Date() } },
    { upsert: true },
  )
  return { ...stats, cached: false }
}
