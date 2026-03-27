// 사용자 마이페이지 API
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { hashPassword, verifyPassword } from '../utils/jwt'
import type { Env, JWTPayload } from '../types'

type AppEnv = { Bindings: Env; Variables: { user: JWTPayload } }

const user = new Hono<AppEnv>()
user.use('*', authMiddleware)

// 내 정보 조회
user.get('/me', async (c) => {
  const me = c.get('user')
  const userData = await c.env.DB.prepare(
    `SELECT id, email, name, phone, user_type, social_provider, created_at FROM users WHERE id = ?`
  ).bind(me.userId).first()

  if (!userData) return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404)
  return c.json({ user: userData })
})

// 내 정보 수정
user.patch('/me', async (c) => {
  const me = c.get('user')
  const { name, phone } = await c.req.json()

  await c.env.DB.prepare(
    `UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), updated_at = datetime('now') WHERE id = ?`
  ).bind(name ?? null, phone ?? null, me.userId).run()

  return c.json({ message: '수정되었습니다.' })
})

// 비밀번호 변경
user.post('/change-password', async (c) => {
  const me = c.get('user')
  const { current_password, new_password } = await c.req.json()

  if (!current_password || !new_password) {
    return c.json({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' }, 400)
  }
  if (new_password.length < 8) {
    return c.json({ error: '새 비밀번호는 8자 이상이어야 합니다.' }, 400)
  }

  const userData = await c.env.DB.prepare(
    `SELECT password_hash, social_provider FROM users WHERE id = ?`
  ).bind(me.userId).first<any>()

  if (userData?.social_provider) {
    return c.json({ error: '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.' }, 400)
  }

  const valid = await verifyPassword(current_password, userData?.password_hash || '')
  if (!valid) {
    return c.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, 400)
  }

  const newHash = await hashPassword(new_password)
  await c.env.DB.prepare(
    `UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(newHash, me.userId).run()

  return c.json({ message: '비밀번호가 변경되었습니다.' })
})

// 회원 탈퇴
user.delete('/me', async (c) => {
  const me = c.get('user')
  
  // 활성 쿠폰이 있으면 탈퇴 불가
  const activeCoupons = await c.env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM coupon_purchases WHERE user_id = ? AND status IN ('active', 'partial_refunded')`
  ).bind(me.userId).first<any>()
  
  if (activeCoupons?.cnt > 0) {
    return c.json({ error: `보유 쿠폰 ${activeCoupons.cnt}건을 먼저 환불 후 탈퇴 가능합니다.` }, 400)
  }

  await c.env.DB.prepare(`UPDATE users SET is_active = 0, email = NULL, name = '탈퇴한 회원', updated_at = datetime('now') WHERE id = ?`)
    .bind(me.userId).run()

  return c.json({ message: '탈퇴되었습니다.' })
})

export default user
