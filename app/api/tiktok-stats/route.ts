import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AUTH_COOKIE, canUseTikTok, verifySession } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import { getTikTokStats, TikTokError } from '@/lib/services/tiktokService'

export const maxDuration = 20

export async function GET(request: Request) {
  // Middleware already redirects anonymous users; this guards the API itself
  const store   = await cookies()
  const token   = store.get(AUTH_COOKIE)?.value
  const session = token ? await verifySession(token) : null
  if (!session) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập lại' }, { status: 401 })
  }

  // Read the role from the DB, not the 7-day JWT, so removing "friend" takes effect immediately
  await dbConnect()
  const user = await User.findById(session.sub, { role: 1 }).lean()
  if (!canUseTikTok(user?.role)) {
    return NextResponse.json({ error: 'Tài khoản chưa được cấp quyền dùng tính năng này' }, { status: 403 })
  }

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
