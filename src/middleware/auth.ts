import { Context, Next } from 'hono';
import { verifyJWT } from '../utils/auth';
import type { Env, JWTPayload, UserType } from '../types';

export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '인증이 필요합니다.' }, 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET || 'dev-secret-key');

  if (!payload) {
    return c.json({ error: '유효하지 않은 토큰입니다.' }, 401);
  }

  c.set('user', payload);
  await next();
}

export function requireRole(...roles: UserType[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user') as JWTPayload;
    if (!user || !roles.includes(user.userType)) {
      return c.json({ error: '권한이 없습니다.' }, 403);
    }
    await next();
  };
}
