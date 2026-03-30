// 주유소 API 라우트 (공개 + 사장님)
import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import { generateId } from '../utils/jwt'
import type { Env, JWTPayload } from '../types'
import QRCode from 'qrcode'

type AppEnv = { Bindings: Env; Variables: { user: JWTPayload } }

const stations = new Hono<AppEnv>()

// ============ 공개 API ============

// 주유소 검색 (위치 기반 + 키워드)
stations.get('/nearby', async (c) => {
  const lat = parseFloat(c.req.query('latitude') || '0')
  const lng = parseFloat(c.req.query('longitude') || '0')
  const keyword = c.req.query('keyword') || ''
  const limit = parseInt(c.req.query('limit') || '20')

  let query: string
  let params: any[]

  if (keyword) {
    query = `
      SELECT s.*, 
        (SELECT COUNT(*) FROM coupons WHERE station_id = s.id AND is_active = 1) as coupon_count
      FROM stations s
      WHERE s.is_active = 1 AND s.is_closed = 0
        AND (s.station_name LIKE ? OR s.address LIKE ?)
      ORDER BY s.station_name
      LIMIT ?
    `
    const kw = `%${keyword}%`
    params = [kw, kw, limit]
  } else if (lat && lng) {
    // 위도/경도 기반 거리 계산 (Haversine 근사)
    query = `
      SELECT s.*,
        (SELECT COUNT(*) FROM coupons WHERE station_id = s.id AND is_active = 1) as coupon_count,
        ROUND(
          6371 * acos(
            cos(radians(?)) * cos(radians(s.latitude)) *
            cos(radians(s.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(s.latitude))
          ), 2
        ) AS distance
      FROM stations s
      WHERE s.is_active = 1 AND s.is_closed = 0
        AND s.latitude IS NOT NULL AND s.longitude IS NOT NULL
      ORDER BY distance
      LIMIT ?
    `
    params = [lat, lng, lat, limit]
  } else {
    query = `
      SELECT s.*,
        (SELECT COUNT(*) FROM coupons WHERE station_id = s.id AND is_active = 1) as coupon_count
      FROM stations s
      WHERE s.is_active = 1 AND s.is_closed = 0
      ORDER BY s.created_at DESC
      LIMIT ?
    `
    params = [limit]
  }

  const result = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ stations: result.results })
})

// 주유소 상세 정보
stations.get('/:id/info', async (c) => {
  const id = c.req.param('id')
  const station = await c.env.DB.prepare(
    `SELECT id, station_name, address, address_detail, latitude, longitude, phone, car_wash_type, is_active, is_closed
     FROM stations WHERE id = ? AND is_active = 1`
  ).bind(id).first()

  if (!station) return c.json({ error: '주유소를 찾을 수 없습니다.' }, 404)
  return c.json({ station })
})

// 주유소 쿠폰 목록 (공개)
stations.get('/:id/coupons', async (c) => {
  const stationId = c.req.param('id')
  const coupons = await c.env.DB.prepare(
    `SELECT id, title, description, original_price, discount_price, wash_count,
            total_stock, remaining_stock, is_active
     FROM coupons
     WHERE station_id = ? AND is_active = 1
       AND (total_stock IS NULL OR remaining_stock > 0)
     ORDER BY discount_price ASC`
  ).bind(stationId).all()

  return c.json({ coupons: coupons.results })
})

// ============ 사장님 API ============

// 주유소 신청 (서류 포함)
stations.post('/apply', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const body = await c.req.json()
  const {
    station_name, address, address_detail, latitude, longitude, phone,
    car_wash_type, business_reg_number, bank_name, account_number, account_holder,
    business_reg_image_key, account_image_key
  } = body

  if (!station_name || !address || !business_reg_number || !bank_name || !account_number || !account_holder) {
    return c.json({ error: '필수 정보를 모두 입력해주세요.' }, 400)
  }

  // 기존 pending 신청 확인
  const pending = await c.env.DB.prepare(
    `SELECT id FROM station_applications WHERE owner_id = ? AND status = 'pending'`
  ).bind(user.userId).first()
  if (pending) {
    return c.json({ error: '이미 심사 중인 신청이 있습니다.' }, 400)
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO station_applications 
     (owner_id, station_name, address, address_detail, latitude, longitude, phone,
      car_wash_type, business_reg_number, business_reg_image_key, bank_name, 
      account_number, account_holder, account_image_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.userId, station_name, address, address_detail || null,
    latitude || null, longitude || null, phone || null,
    car_wash_type || 'automatic', business_reg_number,
    business_reg_image_key || null, bank_name, account_number, account_holder,
    account_image_key || null
  ).run()

  return c.json({ id: result.meta.last_row_id, message: '신청이 접수되었습니다. 검토 후 승인 연락 드리겠습니다.' }, 201)
})

// 내 신청 목록
stations.get('/my-applications', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const apps = await c.env.DB.prepare(
    `SELECT id, station_name, address, status, reject_reason, created_at, reviewed_at
     FROM station_applications WHERE owner_id = ? ORDER BY created_at DESC`
  ).bind(user.userId).all()

  return c.json({ applications: apps.results })
})

// 내 주유소 목록
stations.get('/my-stations', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const stationList = await c.env.DB.prepare(
    `SELECT s.id, s.station_name, s.address, s.phone, s.car_wash_type,
            s.is_active, s.is_closed, s.qr_code, s.created_at,
            (SELECT COUNT(*) FROM coupons WHERE station_id = s.id AND is_active = 1) as coupon_count,
            (SELECT COUNT(*) FROM coupon_usages WHERE station_id = s.id AND used_at >= date('now', '-30 days')) as monthly_usages
     FROM stations s WHERE s.owner_id = ? ORDER BY s.created_at DESC`
  ).bind(user.userId).all()

  return c.json({ stations: stationList.results })
})

// 내 주유소 상세 (사장님)
stations.get('/my-stations/:id', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const stationId = c.req.param('id')

  const station = await c.env.DB.prepare(
    `SELECT * FROM stations WHERE id = ? AND owner_id = ?`
  ).bind(stationId, user.userId).first()

  if (!station) return c.json({ error: '주유소를 찾을 수 없습니다.' }, 404)
  return c.json({ station })
})

// 주유소 정보 수정 (사장님)
stations.patch('/my-stations/:id', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const stationId = c.req.param('id')
  const { phone, car_wash_type, is_active } = await c.req.json()

  const station = await c.env.DB.prepare(
    `SELECT id FROM stations WHERE id = ? AND owner_id = ?`
  ).bind(stationId, user.userId).first()
  if (!station) return c.json({ error: '권한이 없습니다.' }, 403)

  await c.env.DB.prepare(
    `UPDATE stations SET phone = COALESCE(?, phone), car_wash_type = COALESCE(?, car_wash_type),
     is_active = COALESCE(?, is_active), updated_at = datetime('now') WHERE id = ?`
  ).bind(phone ?? null, car_wash_type ?? null, is_active ?? null, stationId).run()

  return c.json({ message: '수정되었습니다.' })
})

// QR 코드 조회 (사장님)
stations.get('/my-stations/:id/qr', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const stationId = c.req.param('id')

  const station = await c.env.DB.prepare(
    `SELECT qr_code, station_name FROM stations WHERE id = ? AND owner_id = ?`
  ).bind(stationId, user.userId).first<any>()
  if (!station) return c.json({ error: '주유소를 찾을 수 없습니다.' }, 404)

  return c.json({ qr_code: station.qr_code, station_name: station.station_name })
})

// QR 코드 SVG 이미지 - 쿼리스트링 토큰 or Authorization 헤더 둘 다 지원
// 사장님용: owner_id 검증 / 관리자용: admin이면 모든 주유소 가능
stations.get('/my-stations/:id/qr-image', async (c) => {
  const token = c.req.query('token') || c.req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return c.json({ error: '인증이 필요합니다.' }, 401)

  const { verifyJWT } = await import('../utils/jwt')
  const payload = await verifyJWT(token, c.env.JWT_SECRET || 'dev-secret-key')
  if (!payload) return c.json({ error: '유효하지 않은 토큰입니다.' }, 401)

  const stationId = c.req.param('id')
  let station: any

  if (payload.userType === 'admin') {
    station = await c.env.DB.prepare(
      `SELECT qr_code, station_name FROM stations WHERE id = ?`
    ).bind(stationId).first<any>()
  } else if (payload.userType === 'station_owner') {
    station = await c.env.DB.prepare(
      `SELECT qr_code, station_name FROM stations WHERE id = ? AND owner_id = ?`
    ).bind(stationId, payload.userId).first<any>()
  } else {
    return c.json({ error: '권한이 없습니다.' }, 403)
  }

  if (!station) return c.json({ error: '주유소를 찾을 수 없습니다.' }, 404)

  // qrcode 패키지로 SVG 직접 생성
  const svgString = await QRCode.toString(station.qr_code, {
    type: 'svg',
    width: 300,
    margin: 2,
    color: { dark: '#1f2937', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })

  return new Response(svgString, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'private, max-age=3600',
      'X-Station-Name': encodeURIComponent(station.station_name),
    },
  })
})

// 쿠폰 사용 처리 (QR 스캔 결과)
stations.post('/my-stations/:id/use-coupon', authMiddleware, requireRole('station_owner', 'admin'), async (c) => {
  const stationId = parseInt(c.req.param('id'))
  const { purchase_id, qr_code } = await c.req.json()

  if (!purchase_id || !qr_code) {
    return c.json({ error: '구매 ID와 QR 코드가 필요합니다.' }, 400)
  }

  // 주유소 QR 코드 검증
  const station = await c.env.DB.prepare(
    `SELECT id, station_name FROM stations WHERE id = ? AND qr_code = ? AND is_active = 1`
  ).bind(stationId, qr_code).first<any>()
  if (!station) return c.json({ error: '유효하지 않은 QR 코드입니다.' }, 400)

  // 쿠폰 구매 내역 확인
  const purchase = await c.env.DB.prepare(
    `SELECT p.*, c.wash_count, c.discount_price, c.title
     FROM coupon_purchases p
     JOIN coupons c ON p.coupon_id = c.id
     WHERE p.id = ? AND p.station_id = ? AND p.status = 'active' AND p.remaining_uses > 0`
  ).bind(purchase_id, stationId).first<any>()
  if (!purchase) return c.json({ error: '사용 가능한 쿠폰이 없습니다.' }, 400)

  const pricePerUse = Math.floor(purchase.unit_price / purchase.wash_count)

  // 쿠폰 사용 처리
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO coupon_usages (purchase_id, user_id, station_id, coupon_id, unit_price, qr_code)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(purchase_id, purchase.user_id, stationId, purchase.coupon_id, pricePerUse, qr_code),
    c.env.DB.prepare(
      `UPDATE coupon_purchases SET remaining_uses = remaining_uses - 1,
       status = CASE WHEN remaining_uses - 1 = 0 THEN 'used' ELSE status END,
       updated_at = datetime('now') WHERE id = ?`
    ).bind(purchase_id),
  ])

  return c.json({
    message: '쿠폰이 사용되었습니다.',
    remaining_uses: purchase.remaining_uses - 1,
    coupon_title: purchase.title,
  })
})

// 사용 내역 (사장님)
stations.get('/my-stations/:id/usages', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const stationId = c.req.param('id')
  const page = parseInt(c.req.query('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const station = await c.env.DB.prepare(
    `SELECT id FROM stations WHERE id = ? AND owner_id = ?`
  ).bind(stationId, user.userId).first()
  if (!station) return c.json({ error: '권한이 없습니다.' }, 403)

  const usages = await c.env.DB.prepare(
    `SELECT u.id, u.unit_price, u.used_at, u.settled,
            c.title as coupon_title,
            usr.name as user_name
     FROM coupon_usages u
     JOIN coupons c ON u.coupon_id = c.id
     JOIN users usr ON u.user_id = usr.id
     WHERE u.station_id = ?
     ORDER BY u.used_at DESC
     LIMIT ? OFFSET ?`
  ).bind(stationId, limit, offset).all()

  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM coupon_usages WHERE station_id = ?`
  ).bind(stationId).first<any>()

  return c.json({ usages: usages.results, total: total?.cnt || 0, page, limit })
})

// 정산 현황 (사장님)
stations.get('/my-stations/:id/settlements', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const stationId = c.req.param('id')

  const station = await c.env.DB.prepare(
    `SELECT id FROM stations WHERE id = ? AND owner_id = ?`
  ).bind(stationId, user.userId).first()
  if (!station) return c.json({ error: '권한이 없습니다.' }, 403)

  const settlements = await c.env.DB.prepare(
    `SELECT id, settlement_date, gross_amount, platform_fee, net_amount, usage_count, status, processed_at
     FROM settlements WHERE station_id = ? ORDER BY settlement_date DESC LIMIT 30`
  ).bind(stationId).all()

  // 미정산 금액 (어제까지 사용된 쿠폰 중 미정산)
  const pending = await c.env.DB.prepare(
    `SELECT SUM(unit_price) as total FROM coupon_usages
     WHERE station_id = ? AND settled = 0 AND used_at < date('now')`
  ).bind(stationId).first<any>()

  return c.json({ settlements: settlements.results, pending_amount: pending?.total || 0 })
})

// ============ 파일 업로드 (R2) ============
stations.post('/upload', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const formData = await c.req.formData()
  const file = formData.get('file') as File

  if (!file) return c.json({ error: '파일이 필요합니다.' }, 400)
  if (file.size > 10 * 1024 * 1024) return c.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, 400)

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: 'JPG, PNG, WebP, PDF 파일만 업로드 가능합니다.' }, 400)
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const key = `docs/${user.userId}/${generateId()}.${ext}`
  
  await c.env.R2.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  })

  return c.json({ key, url: `/api/stations/files/${key}` })
})

// 파일 다운로드 (어드민, 사장님)
stations.get('/files/*', authMiddleware, async (c) => {
  const user = c.get('user')
  const key = c.req.path.replace('/api/stations/files/', '')

  // 어드민이거나 자신의 파일인 경우만 허용
  if (user.userType !== 'admin') {
    const ownerId = key.split('/')[1]
    if (ownerId !== String(user.userId)) {
      return c.json({ error: '접근 권한이 없습니다.' }, 403)
    }
  }

  const obj = await c.env.R2.get(key)
  if (!obj) return c.json({ error: '파일을 찾을 수 없습니다.' }, 404)

  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  })
})

export default stations
