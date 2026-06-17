// 주유소 API 라우트 (공개 + 사장님)
import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import { generateId, kstNow } from '../utils/jwt'
import type { Env, JWTPayload } from '../types'
import QRCode from 'qrcode'

type AppEnv = { Bindings: Env; Variables: { user: JWTPayload } }

const stations = new Hono<AppEnv>()

// 카카오 주소→좌표 변환 (서버사이드)
async function geocodeAddress(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${apiKey}` }
    })
    if (!res.ok) return null
    const data = await res.json() as any
    const doc = data.documents?.[0]
    if (!doc) return null
    const lat = parseFloat(doc.y)
    const lng = parseFloat(doc.x)
    if (isNaN(lat) || isNaN(lng)) return null
    return { lat, lng }
  } catch {
    return null
  }
}

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

  // 주소 → 좌표 자동 변환
  let finalLat = latitude || null
  let finalLng = longitude || null
  if ((!finalLat || !finalLng) && address) {
    const kakaoKey = c.env.KAKAO_REST_API_KEY
    if (kakaoKey) {
      const coords = await geocodeAddress(address, kakaoKey)
      if (coords) { finalLat = coords.lat; finalLng = coords.lng }
    }
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO station_applications 
     (owner_id, station_name, address, address_detail, latitude, longitude, phone,
      car_wash_type, business_reg_number, business_reg_image_key, bank_name, 
      account_number, account_holder, account_image_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    user.userId, station_name, address, address_detail || null,
    finalLat, finalLng, phone || null,
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

// 사장님 홈 요약 (전체 주유소 합산 통계)
stations.get('/owner-summary', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const uid = user.userId

  // 플랫폼 수수료율 (platform_settings는 key/value 구조)
  const setting = await c.env.DB.prepare(
    `SELECT value FROM platform_settings WHERE key = 'platform_fee_rate' LIMIT 1`
  ).first<any>()
  const feeRate = setting?.value ? Math.round(parseFloat(setting.value) * 100) : 15

  // KST 날짜 기준
  const todayKST  = new Date(Date.now() + 9*60*60*1000).toISOString().slice(0,10)
  const monthStart = todayKST.slice(0,7) + '-01'

  const rows = await c.env.DB.prepare(`
    SELECT
      /* 오늘 사용건 */
      (SELECT COUNT(*) FROM coupon_usages cu
       JOIN stations s ON cu.station_id = s.id
       WHERE s.owner_id = ? AND date(cu.used_at) = ?) as today_use_count,

      /* 오늘 사용 매출 */
      (SELECT COALESCE(SUM(cu.unit_price),0) FROM coupon_usages cu
       JOIN stations s ON cu.station_id = s.id
       WHERE s.owner_id = ? AND date(cu.used_at) = ?) as today_use_sales,

      /* 오늘 쿠폰 판매건 */
      (SELECT COUNT(*) FROM coupon_purchases cp
       JOIN stations s ON cp.station_id = s.id
       WHERE s.owner_id = ? AND date(cp.created_at) = ?) as today_sell_count,

      /* 오늘 쿠폰 판매 금액 */
      (SELECT COALESCE(SUM(cp.total_amount),0) FROM coupon_purchases cp
       JOIN stations s ON cp.station_id = s.id
       WHERE s.owner_id = ? AND date(cp.created_at) = ? AND cp.status NOT IN ('refunded')) as today_sell_sales,

      /* 이번달 사용건 */
      (SELECT COUNT(*) FROM coupon_usages cu
       JOIN stations s ON cu.station_id = s.id
       WHERE s.owner_id = ? AND cu.used_at >= ?) as month_use_count,

      /* 이번달 사용 매출 */
      (SELECT COALESCE(SUM(cu.unit_price),0) FROM coupon_usages cu
       JOIN stations s ON cu.station_id = s.id
       WHERE s.owner_id = ? AND cu.used_at >= ?) as month_use_sales,

      /* 이번달 쿠폰 판매건 */
      (SELECT COUNT(*) FROM coupon_purchases cp
       JOIN stations s ON cp.station_id = s.id
       WHERE s.owner_id = ? AND cp.created_at >= ? AND cp.status NOT IN ('refunded')) as month_sell_count,

      /* 이번달 쿠폰 판매 금액 */
      (SELECT COALESCE(SUM(cp.total_amount),0) FROM coupon_purchases cp
       JOIN stations s ON cp.station_id = s.id
       WHERE s.owner_id = ? AND cp.created_at >= ? AND cp.status NOT IN ('refunded')) as month_sell_sales,

      /* 이번달 완료된 정산 금액 */
      (SELECT COALESCE(SUM(se.net_amount),0) FROM settlements se
       JOIN stations s ON se.station_id = s.id
       WHERE s.owner_id = ? AND se.settlement_date >= ? AND se.status = 'completed') as month_settled,

      /* 정산 대기 금액 (미정산 전체 사용분) */
      (SELECT COALESCE(SUM(cu.unit_price),0) FROM coupon_usages cu
       JOIN stations s ON cu.station_id = s.id
       WHERE s.owner_id = ? AND (cu.settled IS NULL OR cu.settled = 0)) as pending_sales,

      /* 현재 활성 쿠폰 구매건 */
      (SELECT COUNT(*) FROM coupon_purchases cp
       JOIN stations s ON cp.station_id = s.id
       WHERE s.owner_id = ? AND cp.status IN ('active','partial_refunded') AND cp.remaining_uses > 0) as active_coupons
  `).bind(
    uid, todayKST,   // today_use_count
    uid, todayKST,   // today_use_sales
    uid, todayKST,   // today_sell_count
    uid, todayKST,   // today_sell_sales
    uid, monthStart, // month_use_count
    uid, monthStart, // month_use_sales
    uid, monthStart, // month_sell_count
    uid, monthStart, // month_sell_sales
    uid, monthStart, // month_settled
    uid,             // pending_sales
    uid              // active_coupons
  ).first<any>()

  const pendingSales     = rows?.pending_sales     || 0
  const todayUseSales    = rows?.today_use_sales   || 0
  const todaySellSales   = rows?.today_sell_sales  || 0
  const monthUseSales    = rows?.month_use_sales   || 0
  const monthSellSales   = rows?.month_sell_sales  || 0
  const monthSettled     = rows?.month_settled     || 0

  return c.json({
    fee_rate:            feeRate,
    // 오늘 - 사용(세차)
    today_use_count:     rows?.today_use_count    || 0,
    today_use_sales:     todayUseSales,
    today_use_settle:    Math.floor(todayUseSales  * (1 - feeRate / 100)),
    // 오늘 - 판매(쿠폰구매)
    today_sell_count:    rows?.today_sell_count   || 0,
    today_sell_sales:    todaySellSales,
    // 이번달 - 사용(세차)
    month_use_count:     rows?.month_use_count    || 0,
    month_use_sales:     monthUseSales,
    month_use_settle:    Math.floor(monthUseSales  * (1 - feeRate / 100)),
    // 이번달 - 판매(쿠폰구매)
    month_sell_count:    rows?.month_sell_count   || 0,
    month_sell_sales:    monthSellSales,
    // 이번달 완료 정산
    month_settled:       monthSettled,
    // 정산 대기
    pending_sales:       pendingSales,
    pending_settle:      Math.floor(pendingSales  * (1 - feeRate / 100)),
    active_coupons:      rows?.active_coupons     || 0,
  })
})

// 내 주유소 목록
stations.get('/my-stations', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const stationList = await c.env.DB.prepare(
    `SELECT s.id, s.station_name, s.address, s.phone, s.car_wash_type,
            s.is_active, s.is_closed, s.qr_code, s.created_at,
            (SELECT COUNT(*) FROM coupons WHERE station_id = s.id AND is_active = 1) as coupon_count,
            (SELECT COUNT(*) FROM coupon_usages WHERE station_id = s.id AND used_at >= date('now', '-30 days')) as monthly_usages,
            (SELECT COUNT(*) FROM coupon_purchases WHERE station_id = s.id) as total_purchases
     FROM stations s WHERE s.owner_id = ? ORDER BY s.created_at DESC`
  ).bind(user.userId).all()

  return c.json({ stations: stationList.results })
})

// 반려된 신청 삭제 (본인 것만, rejected 상태만)
stations.delete('/my-applications/:id', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const app = await c.env.DB.prepare(
    `SELECT id, status FROM station_applications WHERE id = ? AND owner_id = ?`
  ).bind(id, user.userId).first<any>()

  if (!app) return c.json({ error: '신청을 찾을 수 없습니다.' }, 404)
  if (app.status !== 'rejected') return c.json({ error: '반려된 신청만 삭제할 수 있습니다.' }, 400)

  await c.env.DB.prepare(
    `DELETE FROM station_applications WHERE id = ? AND owner_id = ?`
  ).bind(id, user.userId).run()

  return c.json({ message: '삭제되었습니다.' })
})

// 주유소 삭제 (본인 것만, 판매된 쿠폰이 하나도 없을 때만)
stations.delete('/my-stations/:id', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const stationId = c.req.param('id')

  const station = await c.env.DB.prepare(
    `SELECT id FROM stations WHERE id = ? AND owner_id = ?`
  ).bind(stationId, user.userId).first<any>()
  if (!station) return c.json({ error: '주유소를 찾을 수 없습니다.' }, 404)

  const purchaseCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM coupon_purchases WHERE station_id = ?`
  ).bind(stationId).first<any>()
  if (purchaseCount && purchaseCount.cnt > 0)
    return c.json({ error: '판매된 쿠폰이 있어 삭제할 수 없습니다. 폐업 처리를 이용해주세요.' }, 400)

  // 연관 데이터 순서대로 삭제 (쿠폰 → 주유소)
  await c.env.DB.batch([
    c.env.DB.prepare(`DELETE FROM coupons WHERE station_id = ?`).bind(stationId),
    c.env.DB.prepare(`DELETE FROM stations WHERE id = ? AND owner_id = ?`).bind(stationId, user.userId),
  ])

  return c.json({ message: '주유소가 삭제되었습니다.' })
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
  const { station_name, phone, car_wash_type, is_active } = await c.req.json()

  const station = await c.env.DB.prepare(
    `SELECT id FROM stations WHERE id = ? AND owner_id = ?`
  ).bind(stationId, user.userId).first()
  if (!station) return c.json({ error: '권한이 없습니다.' }, 403)

  await c.env.DB.prepare(
    `UPDATE stations SET
       station_name = COALESCE(?, station_name),
       phone = CASE WHEN ? IS NOT NULL THEN ? ELSE phone END,
       car_wash_type = COALESCE(?, car_wash_type),
       is_active = COALESCE(?, is_active),
       updated_at = datetime('now')
     WHERE id = ?`
  ).bind(
    station_name ?? null,
    phone !== undefined ? 1 : null, phone ?? null,
    car_wash_type ?? null,
    is_active ?? null,
    stationId
  ).run()

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

  const { verifyJWT, getJwtSecret } = await import('../utils/jwt')
  const payload = await verifyJWT(token, getJwtSecret(c.env.JWT_SECRET))
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

// 쿠폰 사용 처리 - 고객이 주유소 QR 스캔 후 호출
stations.post('/:id/use-coupon', authMiddleware, requireRole('customer'), async (c) => {
  const user = c.get('user')
  const stationId = parseInt(c.req.param('id'))
  const { purchase_id, qr_code } = await c.req.json()

  if (!purchase_id || !qr_code) {
    return c.json({ error: '구매 ID와 QR 코드가 필요합니다.' }, 400)
  }

  // 주유소 QR 코드 검증
  const station = await c.env.DB.prepare(
    `SELECT id, station_name FROM stations WHERE id = ? AND qr_code = ? AND is_active = 1 AND is_closed = 0`
  ).bind(stationId, qr_code).first<any>()
  if (!station) return c.json({ error: '유효하지 않은 QR 코드입니다.' }, 400)

  // 본인 쿠폰 구매 내역 확인
  const purchase = await c.env.DB.prepare(
    `SELECT p.*, c.wash_count, c.title
     FROM coupon_purchases p
     JOIN coupons c ON p.coupon_id = c.id
     WHERE p.id = ? AND p.user_id = ? AND p.station_id = ? AND p.status = 'active' AND p.remaining_uses > 0`
  ).bind(purchase_id, user.userId, stationId).first<any>()
  if (!purchase) return c.json({ error: '사용 가능한 쿠폰이 없습니다.' }, 400)

  const pricePerUse = Math.floor(purchase.unit_price / purchase.wash_count)

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO coupon_usages (purchase_id, user_id, station_id, coupon_id, unit_price, wash_count_used, qr_code, used_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
    ).bind(purchase_id, user.userId, stationId, purchase.coupon_id, pricePerUse, qr_code, kstNow()),
    c.env.DB.prepare(
      `UPDATE coupon_purchases
       SET remaining_uses = remaining_uses - 1,
           status = CASE WHEN remaining_uses - 1 = 0 THEN 'used' ELSE status END
       WHERE id = ?`
    ).bind(purchase_id),
  ])

  return c.json({
    message: '쿠폰이 사용되었습니다.',
    remaining_uses: purchase.remaining_uses - 1,
    coupon_title: purchase.title,
    station_name: station.station_name,
  })
})

// 쿠폰 사용 처리 (사장님이 고객 QR 스캔)
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
      `INSERT INTO coupon_usages (purchase_id, user_id, station_id, coupon_id, unit_price, wash_count_used, qr_code, used_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
    ).bind(purchase_id, purchase.user_id, stationId, purchase.coupon_id, pricePerUse, qr_code, kstNow()),
    c.env.DB.prepare(
      `UPDATE coupon_purchases SET remaining_uses = remaining_uses - 1,
       status = CASE WHEN remaining_uses - 1 = 0 THEN 'used' ELSE status END,
       updated_at = ? WHERE id = ?`
    ).bind(kstNow(), purchase_id),
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
    `SELECT COUNT(*) as cnt, COALESCE(SUM(unit_price),0) as total_revenue
     FROM coupon_usages WHERE station_id = ?`
  ).bind(stationId).first<any>()

  return c.json({ usages: usages.results, total: total?.cnt || 0, total_revenue: total?.total_revenue || 0, page, limit })
})

// 정산 현황 (사장님) - 연/월 필터 지원
stations.get('/my-stations/:id/settlements', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const stationId = c.req.param('id')
  const yearMonth = c.req.query('year_month') || ''  // 'YYYY-MM'

  const station = await c.env.DB.prepare(
    `SELECT id FROM stations WHERE id = ? AND owner_id = ?`
  ).bind(stationId, user.userId).first()
  if (!station) return c.json({ error: '권한이 없습니다.' }, 403)

  // 연/월 범위 (DB 시간이 KST로 저장)
  let dateFrom = '', dateTo = ''
  if (yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)) {
    const [y, m] = yearMonth.split('-').map(Number)
    dateFrom = yearMonth + '-01'
    const lastDay = new Date(y, m, 0).getDate()
    dateTo = yearMonth + '-' + String(lastDay).padStart(2,'0')
  }
  const settleWhere = dateFrom ? 'AND settlement_date BETWEEN ? AND ?' : ''
  const usageWhere  = dateFrom ? 'AND date(used_at) BETWEEN ? AND ?' : ''
  const dateParams  = dateFrom ? [dateFrom, dateTo] : []

  // 정산 목록
  const settlements = await c.env.DB.prepare(
    `SELECT id, settlement_date, gross_amount, platform_fee, net_amount, usage_count, status, processed_at
     FROM settlements WHERE station_id = ? ${settleWhere}
     ORDER BY settlement_date DESC LIMIT 50`
  ).bind(stationId, ...dateParams).all()

  // 해당 기간 완료된 정산 합계
  const settledTotal = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(net_amount),0) as total, COUNT(*) as cnt
     FROM settlements WHERE station_id = ? AND status='completed' ${settleWhere}`
  ).bind(stationId, ...dateParams).first<any>()

  // 해당 기간 미정산 사용 금액 (settled=0)
  const pendingUsage = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(unit_price),0) as total, COUNT(*) as cnt
     FROM coupon_usages WHERE station_id = ? AND settled = 0 ${usageWhere}`
  ).bind(stationId, ...dateParams).first<any>()

  const feeSetting = await c.env.DB.prepare(
    `SELECT value FROM platform_settings WHERE key = 'platform_fee_rate' LIMIT 1`
  ).first<any>()
  const feeRate = feeSetting?.value ? parseFloat(feeSetting.value) : 0.15

  const pendingGross = pendingUsage?.total || 0
  const pendingNet   = Math.floor(pendingGross * (1 - feeRate))

  return c.json({
    settlements:      settlements.results,
    settled_amount:   settledTotal?.total    || 0,
    settled_count:    settledTotal?.cnt      || 0,
    pending_gross:    pendingGross,
    pending_amount:   pendingNet,
    pending_count:    pendingUsage?.cnt      || 0,
    year_month:       yearMonth,
  })
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
