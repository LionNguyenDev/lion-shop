import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import type { UserRole } from '@/models/User'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-only-secret-change-in-production',
)

export const AUTH_COOKIE = 'lionshop_session'
const ALG = 'HS256'

/** Session lifetime — sliding: renewed by middleware while the user keeps using the app */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days (seconds)
/** Re-issue the token once it is older than this */
const SESSION_RENEW_AFTER = 60 * 60 * 24 // 1 day (seconds)

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path:     '/',
  maxAge:   SESSION_MAX_AGE,
  secure:   process.env.NODE_ENV === 'production',
}

export interface SessionPayload {
  sub: string        // user id
  username: string
  name: string
  role: UserRole
  [key: string]: unknown  // jose payload requires index signature
}

/** Roles allowed to use the TikTok stats tool (/tiktok) */
export const TIKTOK_ROLES: UserRole[] = ['friend', 'admin']

export function canUseTikTok(role: UserRole | undefined): boolean {
  return !!role && TIKTOK_ROLES.includes(role)
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(SECRET)
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as SessionPayload
  } catch {
    return null
  }
}

/** True when a valid session was issued long enough ago that it should be re-signed */
export function shouldRenewSession(session: SessionPayload): boolean {
  const iat = typeof session.iat === 'number' ? session.iat : 0
  return Date.now() / 1000 - iat > SESSION_RENEW_AFTER
}
