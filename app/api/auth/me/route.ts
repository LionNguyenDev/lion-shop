import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { AUTH_COOKIE, verifySession } from '@/lib/auth'

export async function GET() {
  const store = await cookies()
  const token = store.get(AUTH_COOKIE)?.value
  if (!token) return NextResponse.json({ user: null })

  const session = await verifySession(token)
  if (!session) return NextResponse.json({ user: null })

  return NextResponse.json({
    user: {
      id:       session.sub,
      username: session.username,
      name:     session.name,
      role:     session.role,
    },
  })
}
