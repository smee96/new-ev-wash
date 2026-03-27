import { Hono } from 'hono';
import { requireAuth, requireRole } from '../middleware/auth';
import { generateQRData } from '../utils/auth';
import { sendEmail, applicationEmailTemplate } from '../utils/email';
import type { Env } from '../types';

const admin = new Hono<{ Bindings: Env }>();

// 모든 어드민 라우트에 인증 적용
admin.use('/*', requireAuth, requireRole('admin'));

// GET /api/admin/stats - 대시보드 통계
admin.get('/stats', async (c) => {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.substring(0, 7) + '-01';

  const [userStats, stationStats, couponStats, settlementStats] = await Promise.all([
    c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN user_type = 'customer' THEN 1 ELSE 0 END) as customers,
        SUM(CASE WHEN user_type = 'station_owner' THEN 1 ELSE 0 END) as owners,
        SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) as today_new
      FROM users WHERE is_active = 1
    `).bind(today).first<any>(),

    c.env.DB.prepare(`
      SELECT COUNT(*) as total,
        (SELECT COUNT(*) FROM gas_station_applications WHERE status = 'pending') as pending
      FROM gas_stations WHERE is_active = 1
    `).first<any>(),

    c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_usages,
        COALESCE(SUM(c.discount_price), 0) as total_amount,
        COUNT(CASE WHEN DATE(cu.used_at) = ? THEN 1 END) as today_usages,
        COALESCE(SUM(CASE WHEN DATE(cu.used_at) >= ? THEN c.discount_price ELSE 0 END), 0) as month_amount
      FROM coupon_usages cu
      JOIN coupons c ON cu.coupon_id = c.id
    `).bind(today, monthStart).first<any>(),

    c.env.DB.prepare(`
      SELECT 
        COUNT(*) as pending_count,
        COALESCE(SUM(settlement_amount), 0) as pending_amount
      FROM settlements WHERE status = 'pending'
    `).first<any>(),
  ]);

  return c.json({
    users: userStats,
    stations: stationStats,
    coupons: couponStats,
    settlements: settlementStats,
  });
});

// GET /api/admin/applications - 주유소 등록 신청 목록
admin.get('/applications', async (c) => {
  const status = c.req.query('status') || '';
  const page = parseInt(c.req.query('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let whereClause = '';
  let bindings: any[] = [];
  if (status) {
    whereClause = 'WHERE a.status = ?';
    bindings = [status];
  }

  const { results } = await c.env.DB.prepare(`
    SELECT a.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
    FROM gas_station_applications a
    JOIN users u ON a.owner_id = u.id
    ${whereClause}
    ORDER BY a.applied_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all();

  const total = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM gas_station_applications a ${whereClause}
  `).bind(...bindings).first<any>();

  return c.json({ applications: results, total: total?.count || 0, page, limit });
});

// GET /api/admin/applications/:id - 신청 상세
admin.get('/applications/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const app = await c.env.DB.prepare(`
    SELECT a.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
    FROM gas_station_applications a
    JOIN users u ON a.owner_id = u.id
    WHERE a.id = ?
  `).bind(id).first<any>();

  if (!app) return c.json({ error: '신청을 찾을 수 없습니다.' }, 404);
  return c.json({ application: app });
});

// POST /api/admin/applications/:id/review - 신청 승인/거절
admin.post('/applications/:id/review', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const adminUser = c.get('user') as any;
    const { status, rejectionReason } = await c.req.json();

    if (!['approved', 'rejected'].includes(status)) {
      return c.json({ error: '유효하지 않은 상태입니다.' }, 400);
    }

    const app = await c.env.DB.prepare(`
      SELECT a.*, u.email as owner_email, u.name as owner_name
      FROM gas_station_applications a
      JOIN users u ON a.owner_id = u.id
      WHERE a.id = ? AND a.status = 'pending'
    `).bind(id).first<any>();

    if (!app) return c.json({ error: '신청을 찾을 수 없거나 이미 처리되었습니다.' }, 404);

    await c.env.DB.prepare(`
      UPDATE gas_station_applications 
      SET status = ?, rejection_reason = ?, reviewed_at = datetime('now'), reviewed_by = ?
      WHERE id = ?
    `).bind(status, rejectionReason || null, adminUser.userId, id).run();

    if (status === 'approved') {
      // 주유소 생성
      const qrCode = generateQRData(app.owner_id);
      const result = await c.env.DB.prepare(`
        INSERT INTO gas_stations 
        (owner_id, station_name, address, latitude, longitude, phone, car_wash_type, business_registration, bank_name, bank_account, bank_holder, qr_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        app.owner_id, app.station_name, app.address, app.latitude, app.longitude,
        app.phone, app.car_wash_type, app.business_registration,
        app.bank_name, app.bank_account, app.bank_holder, qrCode
      ).run();

      // QR 코드 업데이트 (stationId 포함)
      const stationId = result.meta.last_row_id as number;
      const finalQrCode = `evwash:${stationId}:${Date.now()}:${Math.random().toString(36).substring(2, 8)}`;
      await c.env.DB.prepare('UPDATE gas_stations SET qr_code = ? WHERE id = ?')
        .bind(finalQrCode, stationId).run();
    }

    // 이메일 발송
    if (app.owner_email && c.env.RESEND_API_KEY) {
      const { sendEmail, applicationEmailTemplate } = await import('../utils/email');
      await sendEmail({
        to: app.owner_email,
        subject: `[EV-Wash] 주유소 등록 ${status === 'approved' ? '승인' : '거절'} 안내`,
        html: applicationEmailTemplate({
          ownerName: app.owner_name,
          stationName: app.station_name,
          status,
          reason: rejectionReason,
        }),
      }, c.env.RESEND_API_KEY);
    }

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /api/admin/stations - 주유소 목록
admin.get('/stations', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  const keyword = c.req.query('keyword') || '';

  let whereClause = 'WHERE gs.is_active = 1';
  let bindings: any[] = [];
  if (keyword) {
    whereClause += ' AND (gs.station_name LIKE ? OR gs.address LIKE ?)';
    bindings = [`%${keyword}%`, `%${keyword}%`];
  }

  const { results } = await c.env.DB.prepare(`
    SELECT gs.*, u.name as owner_name, u.email as owner_email,
      (SELECT COUNT(*) FROM coupons WHERE station_id = gs.id AND is_active = 1) as active_coupons,
      (SELECT COUNT(*) FROM coupon_usages WHERE station_id = gs.id) as total_usages
    FROM gas_stations gs
    JOIN users u ON gs.owner_id = u.id
    ${whereClause}
    ORDER BY gs.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all();

  const total = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM gas_stations gs ${whereClause}
  `).bind(...bindings).first<any>();

  return c.json({ stations: results, total: total?.count || 0, page, limit });
});

// DELETE /api/admin/stations/:id - 주유소 비활성화
admin.delete('/stations/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  await c.env.DB.prepare('UPDATE gas_stations SET is_active = 0 WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// GET /api/admin/users - 사용자 목록
admin.get('/users', async (c) => {
  const userType = c.req.query('userType') || '';
  const page = parseInt(c.req.query('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let whereClause = 'WHERE is_active = 1';
  let bindings: any[] = [];
  if (userType) {
    whereClause += ' AND user_type = ?';
    bindings = [userType];
  }

  const { results } = await c.env.DB.prepare(`
    SELECT id, name, email, phone, user_type, social_provider, created_at
    FROM users ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all();

  const total = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM users ${whereClause}
  `).bind(...bindings).first<any>();

  return c.json({ users: results, total: total?.count || 0, page, limit });
});

// DELETE /api/admin/users/:id - 사용자 비활성화
admin.delete('/users/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  await c.env.DB.prepare('UPDATE users SET is_active = 0 WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// GET /api/admin/payments - 결제 내역
admin.get('/payments', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  const startDate = c.req.query('startDate') || '';
  const endDate = c.req.query('endDate') || '';
  const status = c.req.query('status') || '';

  let whereClause = 'WHERE 1=1';
  let bindings: any[] = [];
  if (startDate) { whereClause += ' AND DATE(cp.purchased_at) >= ?'; bindings.push(startDate); }
  if (endDate) { whereClause += ' AND DATE(cp.purchased_at) <= ?'; bindings.push(endDate); }
  if (status) { whereClause += ' AND cp.payment_status = ?'; bindings.push(status); }

  const { results } = await c.env.DB.prepare(`
    SELECT cp.*, u.name as customer_name, gs.station_name, c.title as coupon_title
    FROM coupon_purchases cp
    JOIN users u ON cp.customer_id = u.id
    JOIN gas_stations gs ON cp.station_id = gs.id
    JOIN coupons c ON cp.coupon_id = c.id
    ${whereClause}
    ORDER BY cp.purchased_at DESC
    LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all();

  const total = await c.env.DB.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(cp.total_amount), 0) as total_amount
    FROM coupon_purchases cp ${whereClause}
  `).bind(...bindings).first<any>();

  return c.json({ payments: results, total: total?.count || 0, totalAmount: total?.total_amount || 0, page, limit });
});

// GET /api/admin/settlement - 정산 목록
admin.get('/settlement', async (c) => {
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];

  // 당일 사용 내역 기준으로 정산 데이터 생성
  const { results } = await c.env.DB.prepare(`
    SELECT 
      gs.id as station_id, gs.station_name, gs.bank_name, gs.bank_account, gs.bank_holder,
      COUNT(cu.id) as usage_count,
      COALESCE(SUM(c.discount_price), 0) as total_amount,
      s.id as settlement_id, s.status, s.settlement_amount, s.platform_fee, s.platform_fee_rate
    FROM gas_stations gs
    LEFT JOIN coupon_usages cu ON cu.station_id = gs.id AND DATE(cu.used_at) = ?
    LEFT JOIN coupons c ON cu.coupon_id = c.id
    LEFT JOIN settlements s ON s.station_id = gs.id AND s.settlement_date = ?
    WHERE gs.is_active = 1
    GROUP BY gs.id
    HAVING usage_count > 0 OR s.id IS NOT NULL
    ORDER BY total_amount DESC
  `).bind(date, date).all();

  const feeRate = await c.env.DB.prepare(
    "SELECT setting_value FROM platform_settings WHERE setting_key = 'platform_fee_rate'"
  ).first<any>();
  const rate = parseFloat(feeRate?.setting_value || '0.15');

  return c.json({ settlements: results, date, feeRate: rate });
});

// POST /api/admin/settlement/process - 정산 처리
admin.post('/settlement/process', async (c) => {
  try {
    const adminUser = c.get('user') as any;
    const { stationId, settlementDate } = await c.req.json();

    const feeRateSetting = await c.env.DB.prepare(
      "SELECT setting_value FROM platform_settings WHERE setting_key = 'platform_fee_rate'"
    ).first<any>();
    const feeRate = parseFloat(feeRateSetting?.setting_value || '0.15');

    // 해당 날짜 사용 내역 집계
    const usageData = await c.env.DB.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(c.discount_price), 0) as total_amount
      FROM coupon_usages cu
      JOIN coupons c ON cu.coupon_id = c.id
      WHERE cu.station_id = ? AND DATE(cu.used_at) = ?
    `).bind(stationId, settlementDate).first<any>();

    const totalAmount = usageData?.total_amount || 0;
    const platformFee = Math.floor(totalAmount * feeRate);
    const settlementAmount = totalAmount - platformFee;

    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO settlements 
      (station_id, settlement_date, total_used_count, total_used_amount, platform_fee_rate, platform_fee, settlement_amount, status, processed_at, processed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'), ?)
    `).bind(stationId, settlementDate, usageData?.count || 0, totalAmount, feeRate, platformFee, settlementAmount, adminUser.userId).run();

    return c.json({ success: true, settlementAmount, platformFee });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// POST /api/admin/settlement/process-all - 전체 정산 처리
admin.post('/settlement/process-all', async (c) => {
  try {
    const adminUser = c.get('user') as any;
    const { settlementDate } = await c.req.json();

    const feeRateSetting = await c.env.DB.prepare(
      "SELECT setting_value FROM platform_settings WHERE setting_key = 'platform_fee_rate'"
    ).first<any>();
    const feeRate = parseFloat(feeRateSetting?.setting_value || '0.15');

    const { results: stations } = await c.env.DB.prepare(`
      SELECT DISTINCT cu.station_id
      FROM coupon_usages cu
      WHERE DATE(cu.used_at) = ?
        AND NOT EXISTS (
          SELECT 1 FROM settlements s 
          WHERE s.station_id = cu.station_id AND s.settlement_date = ? AND s.status = 'completed'
        )
    `).bind(settlementDate, settlementDate).all();

    let processed = 0;
    for (const s of stations as any[]) {
      const usageData = await c.env.DB.prepare(`
        SELECT COUNT(*) as count, COALESCE(SUM(c.discount_price), 0) as total_amount
        FROM coupon_usages cu
        JOIN coupons c ON cu.coupon_id = c.id
        WHERE cu.station_id = ? AND DATE(cu.used_at) = ?
      `).bind(s.station_id, settlementDate).first<any>();

      const totalAmount = usageData?.total_amount || 0;
      const platformFee = Math.floor(totalAmount * feeRate);

      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO settlements 
        (station_id, settlement_date, total_used_count, total_used_amount, platform_fee_rate, platform_fee, settlement_amount, status, processed_at, processed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'), ?)
      `).bind(s.station_id, settlementDate, usageData?.count || 0, totalAmount, feeRate, platformFee, totalAmount - platformFee, adminUser.userId).run();

      processed++;
    }

    return c.json({ success: true, processed });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /api/admin/coupons - 전체 쿠폰 목록
admin.get('/coupons', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT c.*, gs.station_name,
      (SELECT COUNT(*) FROM coupon_usages WHERE coupon_id = c.id) as total_usages
    FROM coupons c
    JOIN gas_stations gs ON c.station_id = gs.id
    ORDER BY c.created_at DESC
  `).all();
  return c.json({ coupons: results });
});

// GET /api/admin/settings - 플랫폼 설정 조회
admin.get('/settings', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM platform_settings ORDER BY setting_key').all();
  return c.json({ settings: results });
});

// PUT /api/admin/settings/:key - 설정 수정
admin.put('/settings/:key', async (c) => {
  const key = c.req.param('key');
  const adminUser = c.get('user') as any;
  const { value } = await c.req.json();

  await c.env.DB.prepare(
    'UPDATE platform_settings SET setting_value = ?, updated_at = datetime(\'now\'), updated_by = ? WHERE setting_key = ?'
  ).bind(value, adminUser.userId, key).run();

  return c.json({ success: true });
});

// POST /api/admin/cancel-payment - 관리자 강제 취소
admin.post('/cancel-payment', async (c) => {
  try {
    const adminUser = c.get('user') as any;
    const { purchaseId, cancelReason } = await c.req.json();

    const purchase = await c.env.DB.prepare(
      'SELECT * FROM coupon_purchases WHERE id = ? AND payment_status = ?'
    ).bind(purchaseId, 'completed').first<any>();

    if (!purchase) return c.json({ error: '구매 내역을 찾을 수 없습니다.' }, 404);

    const cancelQuantity = purchase.quantity - purchase.used_quantity;
    const refundAmount = purchase.unit_price * cancelQuantity;

    if (purchase.payment_key) {
      const secretKey = c.env.TOSS_SECRET_KEY || 'test_sk_placeholder';
      const authHeader = `Basic ${btoa(secretKey + ':')}`;

      await fetch(`https://api.tosspayments.com/v1/payments/${purchase.payment_key}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelReason: cancelReason || '관리자 취소', cancelAmount: refundAmount }),
      });
    }

    await c.env.DB.prepare('UPDATE coupon_purchases SET payment_status = ?, quantity = used_quantity WHERE id = ?')
      .bind('refunded', purchaseId).run();

    await c.env.DB.prepare(`
      INSERT INTO cancellations (purchase_id, customer_id, cancel_quantity, refund_amount, cancel_fee, cancel_reason, status, completed_at)
      VALUES (?, ?, ?, ?, 0, ?, 'completed', datetime('now'))
    `).bind(purchaseId, purchase.customer_id, cancelQuantity, refundAmount, cancelReason || '관리자 취소').run();

    return c.json({ success: true, refundAmount });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /api/admin/r2/:key - R2 파일 다운로드 (서류 확인용)
admin.get('/r2/:key{.+}', async (c) => {
  const key = c.req.param('key');
  if (!c.env.R2) return c.json({ error: 'R2 not configured' }, 500);

  const object = await c.env.R2.get(key);
  if (!object) return c.json({ error: 'File not found' }, 404);

  return new Response(object.body, {
    headers: { 'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream' }
  });
});

export default admin;
