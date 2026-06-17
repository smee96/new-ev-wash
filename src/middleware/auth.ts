// 인증 미들웨어
import { Context, Next } from 'hono'
import { verifyJWT, getJwtSecret } from '../utils/jwt'
import type { Env, JWTPayload } from '../types'

type AuthEnv = { Bindings: Env; Variables: { user: JWTPayload } }

export async function authMiddleware(c: Context<AuthEnv>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: '인증이 필요합니다.' }, 401)
  }
  const token = authHeader.slice(7)
  const payload = await verifyJWT(token, getJwtSecret(c.env.JWT_SECRET))
  if (!payload) {
    return c.json({ error: '유효하지 않은 토큰입니다.' }, 401)
  }
  c.set('user', payload)
  return next()
}

export function requireRole(...roles: string[]) {
  return async (c: Context<AuthEnv>, next: Next) => {
    const user = c.get('user')
    if (!user || !roles.includes(user.userType)) {
      return c.json({ error: '권한이 없습니다.' }, 403)
    }
    return next()
  }
}
