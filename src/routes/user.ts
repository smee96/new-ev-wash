import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { hashPassword, verifyPassword } from '../utils/auth';
import { sendEmail, csEmailTemplate } from '../utils/email';
import type { Env } from '../types';

const user = new Hono<{ Bindings: Env }>();

// GET /api/user/profile
user.get('/profile', requireAuth, async (c) => {
  const me = c.get('user') as any;
  const u = await c.env.DB.prepare(
    'SELECT id, name, email, phone, user_type, social_provider, created_at FROM users WHERE id = ?'
  ).bind(me.userId).first<any>();
  return c.json({ user: u });
});

// PUT /api/user/profile - 프로필 수정
user.put('/profile', requireAuth, async (c) => {
  const me = c.get('user') as any;
  const { name, phone } = await c.req.json();

  await c.env.DB.prepare(
    'UPDATE users SET name = ?, phone = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(name, phone, me.userId).run();

  return c.json({ success: true });
});

// POST /api/user/change-password - 비밀번호 변경
user.post('/change-password', requireAuth, async (c) => {
  try {
    const me = c.get('user') as any;
    const { currentPassword, newPassword } = await c.req.json();

    const u = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(me.userId).first<any>();
    if (!u?.password_hash) return c.json({ error: '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.' }, 400);

    const isValid = await verifyPassword(currentPassword, u.password_hash);
    if (!isValid) return c.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, 401);

    if (newPassword.length < 8) return c.json({ error: '비밀번호는 8자 이상이어야 합니다.' }, 400);

    const newHash = await hashPassword(newPassword);
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, me.userId).run();

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// POST /api/user/cs - CS 문의
user.post('/cs', requireAuth, async (c) => {
  try {
    const me = c.get('user') as any;
    const { type, message } = await c.req.json();

    const u = await c.env.DB.prepare('SELECT name, email FROM users WHERE id = ?').bind(me.userId).first<any>();

    if (c.env.RESEND_API_KEY) {
      await sendEmail({
        to: c.env.CS_EMAIL || 'bensmee96@gmail.com',
        subject: `[EV-Wash CS] ${type || '일반문의'} - ${u?.name}`,
        html: csEmailTemplate({
          customerName: u?.name || '알 수 없음',
          customerEmail: u?.email || '',
          message,
          type: type || '일반문의',
        }),
      }, c.env.RESEND_API_KEY);
    }

    return c.json({ success: true, message: '문의가 접수되었습니다.' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// POST /api/user/cs/anonymous - 비로그인 CS 문의
user.post('/cs/anonymous', async (c) => {
  try {
    const { name, email, type, message } = await c.req.json();

    if (c.env.RESEND_API_KEY) {
      await sendEmail({
        to: c.env.CS_EMAIL || 'bensmee96@gmail.com',
        subject: `[EV-Wash CS] ${type || '일반문의'} - ${name}`,
        html: csEmailTemplate({
          customerName: name || '비회원',
          customerEmail: email || '',
          message,
          type: type || '일반문의',
        }),
      }, c.env.RESEND_API_KEY);
    }

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default user;
