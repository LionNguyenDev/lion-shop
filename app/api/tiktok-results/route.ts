import { NextResponse } from 'next/server'
import { requireTikTokUser } from '@/lib/tiktokAccess'
import { TIKTOK_MAX_LINKS, TIKTOK_RESULTS_TTL } from '@/lib/types'
import TikTokResultSet, { type ITikTokResultRow } from '@/models/TikTokResultSet'

const STAT_KEYS = ['views', 'likes', 'comments', 'favorites', 'shares'] as const

const expiresAt = (savedAt: Date) => new Date(savedAt.getTime() + TIKTOK_RESULTS_TTL * 1000)

/** Keeps only the fields we store; returns null if a row is malformed */
function sanitizeRow(raw: unknown): ITikTokResultRow | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.url !== 'string' || !r.url.startsWith('https://') || r.url.length > 500) return null

  // A row still loading when the tab closed is stored as pending, so it can be retried
  const status = r.status === 'loading' ? 'pending' : r.status
  if (status !== 'pending' && status !== 'done' && status !== 'error') return null

  const row: ITikTokResultRow = { url: r.url, status }
  if (status === 'done') {
    const s = r.stats as Record<string, unknown> | undefined
    if (!s || !STAT_KEYS.every((k) => Number.isFinite(s[k]))) return null
    row.stats = {
      // Optional so tables saved before these were tracked can still be re-saved
      ...(typeof s.title === 'string' && { title: s.title.slice(0, 500) }),
      ...(typeof s.description === 'string' && { description: s.description.slice(0, 5000) }),
      ...(Number.isFinite(s.followers) && { followers: Number(s.followers) }),
      views:     Number(s.views),
      likes:     Number(s.likes),
      comments:  Number(s.comments),
      favorites: Number(s.favorites),
      shares:    Number(s.shares),
    }
  }
  if (status === 'error' && typeof r.error === 'string') row.error = r.error.slice(0, 200)
  return row
}

export async function GET() {
  const auth = await requireTikTokUser()
  if ('response' in auth) return auth.response

  const set = await TikTokResultSet.findOne({ userId: auth.userId }).lean()
  // TTL deletion can lag ~1 minute, so enforce the expiry here too
  if (!set || expiresAt(set.savedAt) <= new Date()) {
    return NextResponse.json({ rows: [], expiresAt: null })
  }
  return NextResponse.json({ rows: set.rows, expiresAt: expiresAt(set.savedAt) })
}

export async function PUT(request: Request) {
  const auth = await requireTikTokUser()
  if ('response' in auth) return auth.response

  let body: { rows?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
  }
  if (!Array.isArray(body.rows) || body.rows.length > TIKTOK_MAX_LINKS) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
  }
  const rows = body.rows.map(sanitizeRow)
  if (rows.some((r) => r === null)) {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
  }

  const savedAt = new Date()
  await TikTokResultSet.updateOne(
    { userId: auth.userId },
    { $set: { rows, savedAt } },
    { upsert: true },
  )
  return NextResponse.json({ expiresAt: expiresAt(savedAt) })
}

export async function DELETE() {
  const auth = await requireTikTokUser()
  if ('response' in auth) return auth.response

  await TikTokResultSet.deleteOne({ userId: auth.userId })
  return NextResponse.json({ ok: true })
}
