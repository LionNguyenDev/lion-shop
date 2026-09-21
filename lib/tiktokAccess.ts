import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AUTH_COOKIE, canUseTikTok, verifySession } from '@/lib/auth'
import dbConnect from '@/lib/db'
import User from '@/models/User'

/**
 * Guards the TikTok API routes. Returns the user id, or a ready-made error response.
 * The role is read from the DB, not the 7-day JWT, so removing "friend" takes effect immediately.
 */
export async function requireTikTokUser(): Promise<{ userId: string } | { response: NextResponse }> {
  // Middleware already redirects anonymous users; this guards the API itself
  const store   = await cookies()
  const token   = store.get(AUTH_COOKIE)?.value
  const session = token ? await verifySession(token) : null
  if (!session) {
    return { response: NextResponse.json({ error: 'Vui lòng đăng nhập lại' }, { status: 401 }) }
  }

  await dbConnect()
  const user = await User.findById(session.sub, { role: 1 }).lean()
  if (!user || !canUseTikTok(user.role)) {
    return {
      response: NextResponse.json({ error: 'Tài khoản chưa được cấp quyền dùng tính năng này' }, { status: 403 }),
    }
  }
  return { userId: session.sub }
}
