import { Hono } from 'hono';
import { requireAuth, requireRole } from '../middleware/auth';
import { generateQRData } from '../utils/auth';
import { sendEmail, applicationEmailTemplate } from '../utils/email';
import type { Env } from '../types';

const stations = new Hono<{ Bindings: Env }>();

// =====================
// 공개 API
// =====================

// GET /api/stations/nearby - 주변 주유소 검색
stations.get('/nearby', async (c) => {
  const lat = parseFloat(c.req.query('latitude') || '0');
  const lng = parseFloat(c.req.query('longitude') || '0');
  const radius = parseFloat(c.req.query('radius') || '5'); // km
  const keyword = c.req.query('keyword') || '';

  try {
    let query: string;
    let bindings: any[];

    if (keyword) {
      // 키워드 검색
      query = `
        SELECT gs.*, u.name as owner_name,
          (SELECT COUNT(*) FROM coupons WHERE station_id = gs.id AND is_active = 1) as coupon_count
        FROM gas_stations gs
        JOIN users u ON gs.owner_id = u.id
        WHERE gs.is_active = 1 AND (gs.station_name LIKE ? OR gs.address LIKE ?)
        LIMIT 50
      `;
      bindings = [`%${keyword}%`, `%${keyword}%`];
    } else if (lat && lng) {
      // GPS 기반 검색 (Haversine formula approximation)
      query = `
        SELECT gs.*, u.name as owner_name,
          (SELECT COUNT(*) FROM coupons WHERE station_id = gs.id AND is_active = 1) as coupon_count,
          (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance
        FROM gas_stations gs
        JOIN users u ON gs.owner_id = u.id
        WHERE gs.is_active = 1 AND gs.latitude IS NOT NULL
        HAVING distance <= ?
        ORDER BY distance ASC
        LIMIT 50
      `;
      bindings = [lat, lng, lat, radius];
    } else {
      query = `
        SELECT gs.*, u.name as owner_name,
          (SELECT COUNT(*) FROM coupons WHERE station_id = gs.id AND is_active = 1) as coupon_count
        FROM gas_stations gs
        JOIN users u ON gs.owner_id = u.id
        WHERE gs.is_active = 1
        ORDER BY gs.created_at DESC
        LIMIT 50
      `;
      bindings = [];
    }

    const { results } = await c.env.DB.prepare(query).bind(...bindings).all();
    return c.json({ stations: results });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /api/stations/:stationId/info - 주유소 상세 정보
stations.get('/:stationId/info', async (c) => {
  const stationId = parseInt(c.req.param('stationId'));
  const station = await c.env.DB.prepare(
    'SELECT gs.*, u.name as owner_name FROM gas_stations gs JOIN users u ON gs.owner_id = u.id WHERE gs.id = ? AND gs.is_active = 1'
  ).bind(stationId).first<any>();

  if (!station) return c.json({ error: '주유소를 찾을 수 없습니다.' }, 404);
  return c.json({ station });
});

// GET /api/stations/:stationId/coupons - 주유소 쿠폰 목록
stations.get('/:stationId/coupons', async (c) => {
  const stationId = parseInt(c.req.param('stationId'));
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM coupons WHERE station_id = ? AND is_active = 1 ORDER BY discount_price ASC'
  ).bind(stationId).all();

  return c.json({ coupons: results });
});

// =====================
// 사장님 API
// =====================

// POST /api/owner/apply-station - 주유소 등록 신청
stations.post('/owner/apply', requireAuth, requireRole('station_owner'), async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user') as any;
    const {
      station_name, address, latitude, longitude, phone,
      car_wash_type, business_registration, bank_name, bank_account, bank_holder
    } = body;

    if (!station_name || !address || !phone || !business_registration) {
      return c.json({ error: '필수 항목을 모두 입력해주세요.' }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO gas_station_applications 
      (owner_id, station_name, address, latitude, longitude, phone, car_wash_type, business_registration, bank_name, bank_account, bank_holder)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.userId, station_name, address, latitude || null, longitude || null,
      phone, car_wash_type || 'automatic', business_registration,
      bank_name || null, bank_account || null, bank_holder || null
    ).run();

    return c.json({ success: true, applicationId: result.meta.last_row_id }, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// POST /api/owner/apply/:id/upload - 서류 업로드
stations.post('/owner/apply/:id/upload', requireAuth, requireRole('station_owner'), async (c) => {
  try {
    const appId = parseInt(c.req.param('id'));
    const user = c.get('user') as any;
    const formData = await c.req.formData();
    
    const app = await c.env.DB.prepare(
      'SELECT * FROM gas_station_applications WHERE id = ? AND owner_id = ?'
    ).bind(appId, user.userId).first<any>();
    
    if (!app) return c.json({ error: '신청 내역을 찾을 수 없습니다.' }, 404);

    const businessDoc = formData.get('business_doc') as File | null;
    const accountDoc = formData.get('account_doc') as File | null;

    let businessDocUrl = app.business_doc_url;
    let accountDocUrl = app.account_doc_url;

    if (businessDoc && c.env.R2) {
      const key = `applications/${appId}/business_${Date.now()}.${businessDoc.name.split('.').pop()}`;
      await c.env.R2.put(key, await businessDoc.arrayBuffer(), {
        httpMetadata: { contentType: businessDoc.type }
      });
      businessDocUrl = key;
    }

    if (accountDoc && c.env.R2) {
      const key = `applications/${appId}/account_${Date.now()}.${accountDoc.name.split('.').pop()}`;
      await c.env.R2.put(key, await accountDoc.arrayBuffer(), {
        httpMetadata: { contentType: accountDoc.type }
      });
      accountDocUrl = key;
    }

    await c.env.DB.prepare(
      'UPDATE gas_station_applications SET business_doc_url = ?, account_doc_url = ? WHERE id = ?'
    ).bind(businessDocUrl, accountDocUrl, appId).run();

    return c.json({ success: true, businessDocUrl, accountDocUrl });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /api/owner/applications - 내 신청 내역
stations.get('/owner/applications', requireAuth, requireRole('station_owner'), async (c) => {
  const user = c.get('user') as any;
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM gas_station_applications WHERE owner_id = ? ORDER BY applied_at DESC'
  ).bind(user.userId).all();

  return c.json({ applications: results });
});

// GET /api/owner/stations - 내 주유소 목록
stations.get('/owner/stations', requireAuth, requireRole('station_owner'), async (c) => {
  const user = c.get('user') as any;
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM gas_stations WHERE owner_id = ? AND is_active = 1 ORDER BY created_at DESC'
  ).bind(user.userId).all();

  return c.json({ stations: results });
});

// GET /api/owner/stations/:stationId/summary - 주유소 요약
stations.get('/owner/stations/:stationId/summary', requireAuth, requireRole('station_owner'), async (c) => {
  const user = c.get('user') as any;
  const stationId = parseInt(c.req.param('stationId'));

  const station = await c.env.DB.prepare(
    'SELECT * FROM gas_stations WHERE id = ? AND owner_id = ?'
  ).bind(stationId, user.userId).first<any>();
  if (!station) return c.json({ error: '주유소를 찾을 수 없습니다.' }, 404);

  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.substring(0, 7) + '-01';

  const stats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_used,
      COALESCE(SUM(c.discount_price), 0) as total_amount,
      COUNT(CASE WHEN DATE(cu.used_at) = ? THEN 1 END) as today_used,
      COALESCE(SUM(CASE WHEN DATE(cu.used_at) >= ? THEN c.discount_price ELSE 0 END), 0) as month_amount
    FROM coupon_usages cu
    JOIN coupons c ON cu.coupon_id = c.id
    WHERE cu.station_id = ?
  `).bind(today, monthStart, stationId).first<any>();

  const pendingSettlement = await c.env.DB.prepare(`
    SELECT COALESCE(SUM(settlement_amount), 0) as amount
    FROM settlements WHERE station_id = ? AND status = 'pending'
  `).bind(stationId).first<any>();

  return c.json({
    station,
    stats: {
      totalUsed: stats?.total_used || 0,
      totalAmount: stats?.total_amount || 0,
      todayUsed: stats?.today_used || 0,
      monthAmount: stats?.month_amount || 0,
      pendingSettlement: pendingSettlement?.amount || 0,
    }
  });
});

// GET /api/owner/stations/:stationId/coupons - 주유소 쿠폰 목록
stations.get('/owner/stations/:stationId/coupons', requireAuth, requireRole('station_owner'), async (c) => {
  const user = c.get('user') as any;
  const stationId = parseInt(c.req.param('stationId'));

  const station = await c.env.DB.prepare('SELECT id FROM gas_stations WHERE id = ? AND owner_id = ?')
    .bind(stationId, user.userId).first();
  if (!station) return c.json({ error: '권한이 없습니다.' }, 403);

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM coupons WHERE station_id = ? ORDER BY created_at DESC'
  ).bind(stationId).all();

  return c.json({ coupons: results });
});

// POST /api/owner/stations/:stationId/coupons - 쿠폰 생성
stations.post('/owner/stations/:stationId/coupons', requireAuth, requireRole('station_owner'), async (c) => {
  try {
    const user = c.get('user') as any;
    const stationId = parseInt(c.req.param('stationId'));

    const station = await c.env.DB.prepare('SELECT id FROM gas_stations WHERE id = ? AND owner_id = ?')
      .bind(stationId, user.userId).first();
    if (!station) return c.json({ error: '권한이 없습니다.' }, 403);

    const { title, description, wash_count, original_price, discount_price, valid_days } = await c.req.json();

    if (!title || !wash_count || !original_price || !discount_price) {
      return c.json({ error: '필수 항목을 입력해주세요.' }, 400);
    }
    if (wash_count < 1 || wash_count > 10) {
      return c.json({ error: '세차 횟수는 1~10회 사이여야 합니다.' }, 400);
    }
    if (discount_price >= original_price) {
      return c.json({ error: '판매가는 원가보다 낮아야 합니다.' }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO coupons (station_id, title, description, wash_count, original_price, discount_price, valid_days)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(stationId, title, description || null, wash_count, original_price, discount_price, valid_days || null).run();

    return c.json({ success: true, couponId: result.meta.last_row_id }, 201);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// PATCH /api/owner/coupons/:couponId/toggle - 쿠폰 활성화/비활성화
stations.patch('/owner/coupons/:couponId/toggle', requireAuth, requireRole('station_owner'), async (c) => {
  const user = c.get('user') as any;
  const couponId = parseInt(c.req.param('couponId'));
  const { isActive } = await c.req.json();

  const coupon = await c.env.DB.prepare(`
    SELECT c.* FROM coupons c
    JOIN gas_stations gs ON c.station_id = gs.id
    WHERE c.id = ? AND gs.owner_id = ?
  `).bind(couponId, user.userId).first();

  if (!coupon) return c.json({ error: '쿠폰을 찾을 수 없습니다.' }, 404);

  await c.env.DB.prepare('UPDATE coupons SET is_active = ? WHERE id = ?')
    .bind(isActive ? 1 : 0, couponId).run();

  return c.json({ success: true });
});

// GET /api/owner/stations/:stationId/qr - QR 코드 조회
stations.get('/owner/stations/:stationId/qr', requireAuth, requireRole('station_owner'), async (c) => {
  const user = c.get('user') as any;
  const stationId = parseInt(c.req.param('stationId'));

  const station = await c.env.DB.prepare(
    'SELECT * FROM gas_stations WHERE id = ? AND owner_id = ?'
  ).bind(stationId, user.userId).first<any>();
  if (!station) return c.json({ error: '주유소를 찾을 수 없습니다.' }, 404);

  return c.json({ qrCode: station.qr_code, stationId });
});

// GET /api/owner/stations/:stationId/usage - 사용 내역
stations.get('/owner/stations/:stationId/usage', requireAuth, requireRole('station_owner'), async (c) => {
  const user = c.get('user') as any;
  const stationId = parseInt(c.req.param('stationId'));
  const startDate = c.req.query('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = c.req.query('endDate') || new Date().toISOString().split('T')[0];

  const station = await c.env.DB.prepare('SELECT id FROM gas_stations WHERE id = ? AND owner_id = ?')
    .bind(stationId, user.userId).first();
  if (!station) return c.json({ error: '권한이 없습니다.' }, 403);

  const { results } = await c.env.DB.prepare(`
    SELECT cu.*, u.name as customer_name, c.title as coupon_title, c.discount_price,
      v.name as verified_by_name
    FROM coupon_usages cu
    JOIN users u ON cu.customer_id = u.id
    JOIN coupons c ON cu.coupon_id = c.id
    LEFT JOIN users v ON cu.verified_by = v.id
    WHERE cu.station_id = ? AND DATE(cu.used_at) BETWEEN ? AND ?
    ORDER BY cu.used_at DESC
  `).bind(stationId, startDate, endDate).all();

  return c.json({ usages: results });
});

// GET /api/owner/stations/:stationId/settlement - 정산 현황
stations.get('/owner/stations/:stationId/settlement', requireAuth, requireRole('station_owner'), async (c) => {
  const user = c.get('user') as any;
  const stationId = parseInt(c.req.param('stationId'));

  const station = await c.env.DB.prepare('SELECT id FROM gas_stations WHERE id = ? AND owner_id = ?')
    .bind(stationId, user.userId).first();
  if (!station) return c.json({ error: '권한이 없습니다.' }, 403);

  const { results } = await c.env.DB.prepare(`
    SELECT * FROM settlements WHERE station_id = ? ORDER BY settlement_date DESC LIMIT 30
  `).bind(stationId).all();

  // 미정산 금액 계산
  const pending = await c.env.DB.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(c.discount_price), 0) as amount
    FROM coupon_usages cu
    JOIN coupons c ON cu.coupon_id = c.id
    WHERE cu.station_id = ? AND NOT EXISTS (
      SELECT 1 FROM settlements s 
      WHERE s.station_id = cu.station_id AND s.settlement_date = DATE(cu.used_at)
        AND s.status = 'completed'
    )
  `).bind(stationId).first<any>();

  const feeRate = await c.env.DB.prepare(
    "SELECT setting_value FROM platform_settings WHERE setting_key = 'platform_fee_rate'"
  ).first<any>();
  const rate = parseFloat(feeRate?.setting_value || '0.15');

  return c.json({
    settlements: results,
    pending: {
      count: pending?.count || 0,
      amount: pending?.amount || 0,
      fee: Math.floor((pending?.amount || 0) * rate),
      netAmount: Math.floor((pending?.amount || 0) * (1 - rate)),
    }
  });
});

export default stations;
