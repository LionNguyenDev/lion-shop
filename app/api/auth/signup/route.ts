import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db'
import User from '@/models/User'
import { AUTH_COOKIE, hashPassword, signSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name     = body.name?.trim()
    const username = body.username?.trim().toLowerCase()
    const password = body.password

    if (!name || !username || !password)
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    if (username.length < 3)
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
    if (password.length < 6)
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

    await dbConnect()

    const existing = await User.findOne({ username })
    if (existing)
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })

    // First user becomes admin; subsequent default to user
    const userCount = await User.countDocuments()
    const role = userCount === 0 ? 'admin' : 'user'

    const hashed = await hashPassword(password)
    const user = await User.create({ name, username, password: hashed, role })

    const token = await signSession({
      sub:      user._id.toString(),
      username: user.username,
      name:     user.name,
      role:     user.role,
    })

    const res = NextResponse.json({
      user: { id: user._id, username: user.username, name: user.name, role: user.role },
    })
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      path:     '/',
      maxAge:   60 * 60 * 24 * 7,
      secure:   process.env.NODE_ENV === 'production',
    })
    return res
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sign-up failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
