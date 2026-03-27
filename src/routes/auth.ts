import { Hono } from 'hono';
import { signJWT, hashPassword, verifyPassword } from '../utils/auth';
import type { Env } from '../types';

const auth = new Hono<{ Bindings: Env }>();

// POST /api/auth/register - 회원가입
auth.post('/register', async (c) => {
  try {
    const { name, email, phone, password, userType = 'customer' } = await c.req.json();

    if (!name || !email || !password) {
      return c.json({ error: '이름, 이메일, 비밀번호는 필수입니다.' }, 400);
    }

    if (!['customer', 'station_owner'].includes(userType)) {
      return c.json({ error: '유효하지 않은 사용자 유형입니다.' }, 400);
    }

    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
      return c.json({ error: '이미 사용 중인 이메일입니다.' }, 409);
    }

    const passwordHash = await hashPassword(password);
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, name, phone, password_hash, user_type) VALUES (?, ?, ?, ?, ?)'
    ).bind(email, name, phone || null, passwordHash, userType).run();

    const userId = result.meta.last_row_id as number;
    const token = await signJWT(
      { userId, email, userType, name },
      c.env.JWT_SECRET || 'dev-secret-key'
    );

    return c.json({ token, user: { id: userId, name, email, phone, userType } }, 201);
  } catch (e: any) {
    return c.json({ error: e.message || '서버 오류가 발생했습니다.' }, 500);
  }
});

// POST /api/auth/login - 로그인
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: '이메일과 비밀번호를 입력해주세요.' }, 400);
    }

    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    ).bind(email).first<any>();

    if (!user) {
      return c.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);
    }

    // 관리자 테스트용 (개발 단계)
    let isValid = false;
    if (user.user_type === 'admin' && password === 'Admin1234!') {
      isValid = true;
    } else {
      isValid = await verifyPassword(password, user.password_hash || '');
    }

    if (!isValid) {
      return c.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 401);
    }

    const token = await signJWT(
      { userId: user.id, email: user.email, userType: user.user_type, name: user.name },
      c.env.JWT_SECRET || 'dev-secret-key'
    );

    return c.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.user_type
      }
    });
  } catch (e: any) {
    return c.json({ error: e.message || '서버 오류가 발생했습니다.' }, 500);
  }
});

// GET /api/auth/kakao/callback - 카카오 콜백
auth.get('/kakao/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) return c.redirect('/login?error=kakao_failed');

  try {
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: c.env.KAKAO_API_KEY || '',
        redirect_uri: c.env.KAKAO_REDIRECT_URI || '',
        code,
      }),
    });

    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) return c.redirect('/login?error=kakao_token_failed');

    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const kakaoUser = await userRes.json() as any;
    const kakaoId = String(kakaoUser.id);
    const kakaoEmail = kakaoUser.kakao_account?.email;
    const kakaoName = kakaoUser.kakao_account?.profile?.nickname || '카카오사용자';

    let user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE social_provider = ? AND social_id = ?'
    ).bind('kakao', kakaoId).first<any>();

    if (!user) {
      const result = await c.env.DB.prepare(
        'INSERT INTO users (email, name, social_provider, social_id, user_type) VALUES (?, ?, ?, ?, ?)'
      ).bind(kakaoEmail || null, kakaoName, 'kakao', kakaoId, 'customer').run();

      user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
        .bind(result.meta.last_row_id).first<any>();
    }

    const token = await signJWT(
      { userId: user.id, email: user.email || '', userType: user.user_type, name: user.name },
      c.env.JWT_SECRET || 'dev-secret-key'
    );

    // 클라이언트로 토큰 전달
    return c.html(`
      <script>
        window.opener?.postMessage({ type: 'social_login', token: '${token}', user: ${JSON.stringify({ id: user.id, name: user.name, email: user.email, userType: user.user_type })} }, '*');
        window.close();
      </script>
      <p>로그인 중...</p>
    `);
  } catch {
    return c.redirect('/login?error=kakao_error');
  }
});

// GET /api/auth/naver/callback - 네이버 콜백
auth.get('/naver/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  if (!code) return c.redirect('/login?error=naver_failed');

  try {
    const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: c.env.NAVER_CLIENT_ID || '',
        client_secret: c.env.NAVER_CLIENT_SECRET || '',
        redirect_uri: c.env.NAVER_REDIRECT_URI || '',
        code,
        state: state || '',
      }),
    });

    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) return c.redirect('/login?error=naver_token_failed');

    const userRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const naverData = await userRes.json() as any;
    const naverUser = naverData.response;
    const naverId = naverUser.id;
    const naverEmail = naverUser.email;
    const naverName = naverUser.name || '네이버사용자';
    const naverPhone = naverUser.mobile?.replace(/-/g, '');

    let user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE social_provider = ? AND social_id = ?'
    ).bind('naver', naverId).first<any>();

    if (!user) {
      const result = await c.env.DB.prepare(
        'INSERT INTO users (email, name, phone, social_provider, social_id, user_type) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(naverEmail || null, naverName, naverPhone || null, 'naver', naverId, 'customer').run();

      user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
        .bind(result.meta.last_row_id).first<any>();
    }

    const token = await signJWT(
      { userId: user.id, email: user.email || '', userType: user.user_type, name: user.name },
      c.env.JWT_SECRET || 'dev-secret-key'
    );

    return c.html(`
      <script>
        window.opener?.postMessage({ type: 'social_login', token: '${token}', user: ${JSON.stringify({ id: user.id, name: user.name, email: user.email, userType: user.user_type })} }, '*');
        window.close();
      </script>
      <p>로그인 중...</p>
    `);
  } catch {
    return c.redirect('/login?error=naver_error');
  }
});

// GET /api/auth/me - 내 정보
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: '인증 필요' }, 401);

  const { verifyJWT } = await import('../utils/auth');
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET || 'dev-secret-key');
  if (!payload) return c.json({ error: '유효하지 않은 토큰' }, 401);

  const user = await c.env.DB.prepare('SELECT id, name, email, phone, user_type, created_at FROM users WHERE id = ?')
    .bind(payload.userId).first<any>();

  return c.json({ user });
});

export default auth;
