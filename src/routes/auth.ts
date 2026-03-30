// 인증 API 라우트 (이메일/소셜 로그인)
import { Hono } from 'hono'
import { signJWT, verifyPassword, hashPassword, generateId } from '../utils/jwt'
import type { Env } from '../types'

const auth = new Hono<{ Bindings: Env }>()

// ============ 이메일 회원가입 ============
auth.post('/register', async (c) => {
  const { name, email, phone, password, userType, marketingAgreed } = await c.req.json()

  if (!name || !email || !password) {
    return c.json({ error: '필수 정보를 입력해주세요.' }, 400)
  }
  if (password.length < 8) {
    return c.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, 400)
  }
  if (!['customer', 'station_owner'].includes(userType || 'customer')) {
    return c.json({ error: '잘못된 회원 유형입니다.' }, 400)
  }
  // 모든 회원 전화번호 필수
  const phoneDigits = (phone || '').replace(/\D/g, '')
  if (phoneDigits.length < 10) {
    return c.json({ error: '올바른 휴대폰 번호를 입력해주세요.' }, 400)
  }
  const phoneFormatted = phoneDigits.length === 11
    ? `${phoneDigits.slice(0,3)}-${phoneDigits.slice(3,7)}-${phoneDigits.slice(7)}`
    : `${phoneDigits.slice(0,3)}-${phoneDigits.slice(3,6)}-${phoneDigits.slice(6)}`

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) {
    return c.json({ error: '이미 사용 중인 이메일입니다.' }, 400)
  }

  const passwordHash = await hashPassword(password)
  const result = await c.env.DB.prepare(
    `INSERT INTO users (email, name, phone, password_hash, user_type, marketing_agreed) VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(email, name, phoneFormatted, passwordHash, userType || 'customer', marketingAgreed ? 1 : 0).run()

  const userId = result.meta.last_row_id as number
  const token = await signJWT(
    { userId, email, name, userType: userType || 'customer' },
    c.env.JWT_SECRET || 'dev-secret-key'
  )

  return c.json({
    token,
    user: { id: userId, email, name, phone: phoneFormatted, userType: userType || 'customer' }
  }, 201)
})

// ============ 이메일 로그인 ============
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password) {
    return c.json({ error: '이메일과 비밀번호를 입력해주세요.' }, 400)
  }

  const user = await c.env.DB.prepare(
    `SELECT id, email, name, phone, password_hash, user_type, is_active FROM users WHERE email = ? AND social_provider IS NULL`
  ).bind(email).first<any>()

  if (!user || !user.password_hash) {
    return c.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401)
  }
  if (!user.is_active) {
    return c.json({ error: '비활성화된 계정입니다.' }, 401)
  }

  // 어드민 초기 비밀번호 처리 (임시)
  let valid = false
  if (user.password_hash.startsWith('$2')) {
    // bcrypt 형식 - 초기 어드민 계정은 별도 처리
    if (email === 'admin@ev-wash.com' && password === 'admin1234') {
      valid = true
      // pbkdf2로 업데이트
      const newHash = await hashPassword(password)
      await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .bind(newHash, user.id).run()
    }
  } else {
    valid = await verifyPassword(password, user.password_hash)
  }

  if (!valid) {
    return c.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401)
  }

  const token = await signJWT(
    { userId: user.id, email: user.email, name: user.name, userType: user.user_type },
    c.env.JWT_SECRET || 'dev-secret-key'
  )

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, phone: user.phone, userType: user.user_type }
  })
})

// ============ 카카오 소셜 로그인 ============
auth.get('/kakao/callback', async (c) => {
  const code = c.req.query('code')
  if (!code) return c.html('<script>window.close();</script>')

  try {
    // 액세스 토큰 발급
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: c.env.KAKAO_CLIENT_ID || '',
        client_secret: c.env.KAKAO_CLIENT_SECRET || '',
        redirect_uri: `${c.env.APP_URL}/api/auth/kakao/callback`,
        code,
      }),
    })
    const tokenData = await tokenRes.json<any>()
    if (!tokenData.access_token) throw new Error('No access token')

    // 사용자 정보 조회
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const userData = await userRes.json<any>()

    const socialId = String(userData.id)
    const email = userData.kakao_account?.email || null
    const name = userData.kakao_account?.profile?.nickname || `카카오사용자${socialId.slice(-4)}`

    const result = await upsertSocialUser(c.env.DB, 'kakao', socialId, email, name)
    const token = await signJWT(
      { userId: result.id, email: result.email, name: result.name, userType: result.user_type },
      c.env.JWT_SECRET || 'dev-secret-key'
    )

    return c.html(`
      <script>
        window.opener?.postMessage({
          type: 'social_login',
          token: '${token}',
          user: ${JSON.stringify({ id: result.id, email: result.email, name: result.name, userType: result.user_type })}
        }, '*');
        window.close();
      </script>
    `)
  } catch (err) {
    console.error('[Kakao Auth]', err)
    return c.html('<script>alert("카카오 로그인에 실패했습니다."); window.close();</script>')
  }
})

// ============ 네이버 소셜 로그인 ============
auth.get('/naver/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state')
  if (!code) return c.html('<script>window.close();</script>')

  try {
    const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: c.env.NAVER_CLIENT_ID || '',
        client_secret: c.env.NAVER_CLIENT_SECRET || '',
        redirect_uri: `${c.env.APP_URL}/api/auth/naver/callback`,
        code,
        state: state || '',
      }),
    })
    const tokenData = await tokenRes.json<any>()
    if (!tokenData.access_token) throw new Error('No access token')

    const userRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const userData = await userRes.json<any>()
    const profile = userData.response

    const socialId = String(profile.id)
    const email = profile.email || null
    const name = profile.name || profile.nickname || `네이버사용자${socialId.slice(-4)}`

    const result = await upsertSocialUser(c.env.DB, 'naver', socialId, email, name)
    const token = await signJWT(
      { userId: result.id, email: result.email, name: result.name, userType: result.user_type },
      c.env.JWT_SECRET || 'dev-secret-key'
    )

    return c.html(`
      <script>
        window.opener?.postMessage({
          type: 'social_login',
          token: '${token}',
          user: ${JSON.stringify({ id: result.id, email: result.email, name: result.name, userType: result.user_type })}
        }, '*');
        window.close();
      </script>
    `)
  } catch (err) {
    console.error('[Naver Auth]', err)
    return c.html('<script>alert("네이버 로그인에 실패했습니다."); window.close();</script>')
  }
})

// ============ 헬퍼 ============
async function upsertSocialUser(
  db: D1Database,
  provider: string,
  socialId: string,
  email: string | null,
  name: string
) {
  let user = await db.prepare(
    'SELECT id, email, name, user_type FROM users WHERE social_provider = ? AND social_id = ?'
  ).bind(provider, socialId).first<any>()

  if (!user) {
    const result = await db.prepare(
      `INSERT INTO users (email, name, social_provider, social_id, user_type) VALUES (?, ?, ?, ?, 'customer')`
    ).bind(email, name, provider, socialId).run()
    user = { id: result.meta.last_row_id, email, name, user_type: 'customer' }
  }
  return user
}

export default auth
