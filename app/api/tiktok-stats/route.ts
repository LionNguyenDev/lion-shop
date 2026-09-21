import { NextResponse } from 'next/server'
import { requireTikTokUser } from '@/lib/tiktokAccess'
import { getTikTokStats, TikTokError } from '@/lib/services/tiktokService'

export const maxDuration = 20

export async function GET(request: Request) {
  const auth = await requireTikTokUser()
  if ('response' in auth) return auth.response

  const url = new URL(request.url).searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Thiếu link TikTok' }, { status: 400 })
  }

  try {
    const stats = await getTikTokStats(url)
    return NextResponse.json(stats)
  } catch (error) {
    if (error instanceof TikTokError) {
      return NextResponse.json({ error: error.message, blocked: error.blocked }, { status: error.status })
    }
    return NextResponse.json({ error: 'Không lấy được số liệu' }, { status: 500 })
  }
}
