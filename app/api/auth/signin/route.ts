import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import { AUTH_COOKIE, SESSION_COOKIE_OPTIONS, signSession, verifyPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const username = body.username?.trim().toLowerCase()
    const password = body.password

    if (!username || !password)
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })

    await dbConnect()
    const user = await User.findOne({ username })
    if (!user)
      return NextResponse.json({ error: 'User name or password is incorrect' }, { status: 401 })

    const ok = await verifyPassword(password, user.password)
    if (!ok)
      return NextResponse.json({ error: 'User name or password is incorrect' }, { status: 401 })

    const token = await signSession({
      sub:      user._id.toString(),
      username: user.username,
      name:     user.name,
      role:     user.role,
    })

    const res = NextResponse.json({
      user: { id: user._id, username: user.username, name: user.name, role: user.role },
    })
    res.cookies.set(AUTH_COOKIE, token, SESSION_COOKIE_OPTIONS)
    return res
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sign-in failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
