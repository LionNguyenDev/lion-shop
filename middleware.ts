import { NextResponse, type NextRequest } from 'next/server'
import { AUTH_COOKIE, canUseTikTok, verifySession } from '@/lib/auth'

/** Pages that are reachable only when logged out */
const PUBLIC_PATHS = ['/', '/signin', '/signup']

/** Pages that require admin role */
const ADMIN_PATHS = ['/admin', '/admin/orders', '/admin/products', '/admin/settings']

/** Pages that require a role allowed by canUseTikTok (friend / admin) */
const TIKTOK_PATHS = ['/tiktok']

/** Pages/prefixes the middleware should NOT touch */
function isAsset(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon') ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?)$/i.test(pathname)
  )
}

function matches(paths: string[], pathname: string) {
  return paths.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

function isAdminPath(pathname: string) {
  return matches(ADMIN_PATHS, pathname)
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isAsset(pathname)) return NextResponse.next()

  const token   = req.cookies.get(AUTH_COOKIE)?.value
  const session = token ? await verifySession(token) : null

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))

  // Logged in but on a public page → go to dashboard (admin) or user page (non-admin)
  if (session && isPublic) {
    if (session.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    // Non-admin logged-in users stay on public pages (don't bounce them to dashboard)
    return NextResponse.next()
  }

  // Not logged in and trying to access a protected page → go to signin
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/signin', req.url))
  }

  // Logged in but not admin, trying to access admin pages → go to home page
  if (session && session.role !== 'admin' && isAdminPath(pathname)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Logged in but without the friend (or admin) role, trying to use the TikTok tool → go to home page
  if (session && !canUseTikTok(session.role) && matches(TIKTOK_PATHS, pathname)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api/auth|favicon|.*\\..*).*)'],
}
