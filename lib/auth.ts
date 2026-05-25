import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import type { UserRole } from '@/models/User'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-only-secret-change-in-production',
)

export const AUTH_COOKIE = 'lionshop_session'
const ALG = 'HS256'

export interface SessionPayload {
  sub: string        // user id
  username: string
  name: string
  role: UserRole
  [key: string]: unknown  // jose payload requires index signature
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
    .setExpirationTime('7d')
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
