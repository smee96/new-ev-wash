// 쿠폰 관리 + 결제(Toss Payments) + 환불 API
import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import { generateId } from '../utils/jwt'
import type { Env, JWTPayload } from '../types'

type AppEnv = { Bindings: Env; Variables: { user: JWTPayload } }

const coupons = new Hono<AppEnv>()

// ============================================================
// 유틸: 토스 결제수단별 환불 안내 메시지
// ============================================================
function getRefundMethodNotice(method: string | null | undefined): string {
  switch (method) {
    case 'card':
      return '카드 결제 환불은 영업일 기준 3~4일 소요됩니다. (당일 전액취소는 즉시 처리)'
    case 'transfer':
      return '계좌이체 환불은 즉시 처리됩니다. (180일 이내 거래만 가능)'
    case 'virtual_account':
      return '가상계좌 환불은 영업일 기준 2일 소요됩니다.'
    case 'mobile':
      return '휴대폰 결제는 결제 당월에만 취소 가능합니다.'
    default:
      return '환불은 영업일 기준 3~4일 소요될 수 있습니다.'
  }
}

// ============================================================
// 유틸: 할인율 기반 1회당 환불단가 계산
//
// [설계 원칙]
//  - 쿠폰은 "N회 이용권"을 M장 구매하는 구조
//  - 사장님이 "10장 이상 구매시 10% 할인" 등 할인 설정 가능
//  - 실제 결제금액(total_amount) ÷ 총 이용횟수(wash_count × quantity)
//    → 1회당 실제 지불 단가 산출 (할인 자동 반영)
//  - 남은 횟수 × 1회 단가 = 환불 금액
//  - 단수 처리: 내림(floor) → 플랫폼에 유리, 소비자에게 명확
// ============================================================
function calcRefundAmountPerUse(
  totalAmount: number,   // 실제 결제금액
  washCount: number,     // 쿠폰 1장당 이용횟수
  quantity: number       // 구매 수량
): number {
  const totalUses = washCount * quantity
  return Math.floor(totalAmount / totalUses)  // 1회당 환불단가 (원 단위, 내림)
}

// ============================================================
// 유틸: Toss 결제 취소 API 호출
// ============================================================
async function callTossCancel(
  secretKey: string,
  paymentKey: string,
  cancelAmount: number,
  cancelReason: string
): Promise<{ ok: boolean; data: any }> {
  const authStr = btoa(`${secretKey}:`)
  const res = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}/cancels`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authStr}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancelReason,
        cancelAmount,
      }),
    }
  )
  const data = await res.json() as any
  return { ok: res.ok, data }
}

// ============================================================
// 사장님: 쿠폰 관리
// ============================================================

// 쿠폰 생성
coupons.post('/owner/stations/:stationId/coupons', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const stationId = parseInt(c.req.param('stationId'))
  const { title, description, original_price, discount_price, wash_count, total_stock } = await c.req.json()

  const station = await c.env.DB.prepare(
    `SELECT id FROM stations WHERE id = ? AND owner_id = ? AND is_active = 1 AND is_closed = 0`
  ).bind(stationId, user.userId).first()
  if (!station) return c.json({ error: '주유소를 찾을 수 없습니다.' }, 404)

  if (!title || !original_price || !discount_price || !wash_count) {
    return c.json({ error: '필수 정보를 모두 입력해주세요.' }, 400)
  }
  if (wash_count < 1 || wash_count > 10) {
    return c.json({ error: '이용 횟수는 1~10회만 설정 가능합니다.' }, 400)
  }
  if (discount_price >= original_price) {
    return c.json({ error: '할인가는 정가보다 낮아야 합니다.' }, 400)
  }
  if (discount_price <= 0 || original_price <= 0) {
    return c.json({ error: '가격은 0원 이상이어야 합니다.' }, 400)
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO coupons (station_id, title, description, original_price, discount_price, wash_count, total_stock, remaining_stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(stationId, title, description || null, original_price, discount_price, wash_count,
    total_stock || null, total_stock || null).run()

  return c.json({ id: result.meta.last_row_id, message: '쿠폰이 등록되었습니다.' }, 201)
})

// 사장님 쿠폰 목록
coupons.get('/owner/stations/:stationId/coupons', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const stationId = c.req.param('stationId')

  const station = await c.env.DB.prepare(
    `SELECT id FROM stations WHERE id = ? AND owner_id = ?`
  ).bind(stationId, user.userId).first()
  if (!station) return c.json({ error: '권한이 없습니다.' }, 403)

  const couponList = await c.env.DB.prepare(
    `SELECT c.*,
            (SELECT COUNT(*) FROM coupon_purchases WHERE coupon_id = c.id AND status = 'active') as active_purchases,
            (SELECT SUM(unit_price) FROM coupon_usages WHERE coupon_id = c.id) as total_revenue
     FROM coupons c WHERE c.station_id = ? ORDER BY c.created_at DESC`
  ).bind(stationId).all()

  return c.json({ coupons: couponList.results })
})

// 쿠폰 수정
coupons.patch('/owner/coupons/:id', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const couponId = c.req.param('id')
  const { title, description, original_price, discount_price, wash_count, total_stock, is_active } = await c.req.json()

  const coupon = await c.env.DB.prepare(
    `SELECT c.id FROM coupons c JOIN stations s ON c.station_id = s.id WHERE c.id = ? AND s.owner_id = ?`
  ).bind(couponId, user.userId).first()
  if (!coupon) return c.json({ error: '권한이 없습니다.' }, 403)

  if (wash_count && (wash_count < 1 || wash_count > 10)) {
    return c.json({ error: '이용 횟수는 1~10회만 설정 가능합니다.' }, 400)
  }

  await c.env.DB.prepare(
    `UPDATE coupons SET
       title = COALESCE(?, title),
       description = COALESCE(?, description),
       original_price = COALESCE(?, original_price),
       discount_price = COALESCE(?, discount_price),
       wash_count = COALESCE(?, wash_count),
       total_stock = COALESCE(?, total_stock),
       remaining_stock = CASE WHEN ? IS NOT NULL THEN ? ELSE remaining_stock END,
       is_active = COALESCE(?, is_active),
       updated_at = datetime('now')
     WHERE id = ?`
  ).bind(
    title ?? null, description ?? null, original_price ?? null, discount_price ?? null,
    wash_count ?? null, total_stock ?? null, total_stock ?? null, total_stock ?? null,
    is_active ?? null, couponId
  ).run()

  return c.json({ message: '수정되었습니다.' })
})

// 쿠폰 삭제 (판매 없는 경우만)
coupons.delete('/owner/coupons/:id', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const couponId = c.req.param('id')

  const coupon = await c.env.DB.prepare(
    `SELECT c.id FROM coupons c JOIN stations s ON c.station_id = s.id WHERE c.id = ? AND s.owner_id = ?`
  ).bind(couponId, user.userId).first()
  if (!coupon) return c.json({ error: '권한이 없습니다.' }, 403)

  const hasPurchases = await c.env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM coupon_purchases WHERE coupon_id = ? AND status = 'active'`
  ).bind(couponId).first<any>()
  if (hasPurchases?.cnt > 0) {
    return c.json({ error: '구매된 쿠폰이 있어 삭제할 수 없습니다. 비활성화만 가능합니다.' }, 400)
  }

  await c.env.DB.prepare('UPDATE coupons SET is_active = 0 WHERE id = ?').bind(couponId).run()
  return c.json({ message: '쿠폰이 비활성화되었습니다.' })
})

// ============================================================
// 고객: 쿠폰 목록 조회
// ============================================================

// 내 쿠폰 목록 (주유소별 그룹)
coupons.get('/my', authMiddleware, requireRole('customer'), async (c) => {
  const user = c.get('user')

  const purchases = await c.env.DB.prepare(
    `SELECT p.id, p.quantity, p.unit_price, p.total_amount, p.remaining_uses, p.status, p.created_at,
            c.title as coupon_title, c.wash_count, c.description,
            s.id as station_id, s.station_name, s.address, s.qr_code
     FROM coupon_purchases p
     JOIN coupons c ON p.coupon_id = c.id
     JOIN stations s ON p.station_id = s.id
     WHERE p.user_id = ? AND p.status IN ('active', 'partial_refunded')
     ORDER BY p.created_at DESC`
  ).bind(user.userId).all<any>()

  const stationMap = new Map<number, any>()
  for (const p of purchases.results) {
    if (!stationMap.has(p.station_id)) {
      stationMap.set(p.station_id, {
        station_id: p.station_id,
        station_name: p.station_name,
        address: p.address,
        qr_code: p.qr_code,
        remaining_quantity: 0,
        purchases: []
      })
    }
    const st = stationMap.get(p.station_id)!
    st.remaining_quantity += p.remaining_uses
    st.purchases.push(p)
  }

  return c.json({ stations: Array.from(stationMap.values()) })
})

// 내 쿠폰 상세 (특정 주유소)
coupons.get('/my/:stationId', authMiddleware, requireRole('customer'), async (c) => {
  const user = c.get('user')
  const stationId = c.req.param('stationId')

  const purchases = await c.env.DB.prepare(
    `SELECT p.id, p.quantity, p.unit_price, p.total_amount, p.remaining_uses,
            p.status, p.created_at, p.refunded_amount, p.refunded_uses,
            p.payment_method, p.toss_total_cancelled,
            c.title as coupon_title, c.wash_count, c.discount_price
     FROM coupon_purchases p
     JOIN coupons c ON p.coupon_id = c.id
     WHERE p.user_id = ? AND p.station_id = ? AND p.status NOT IN ('refunded')
     ORDER BY p.created_at ASC`
  ).bind(user.userId, stationId).all()

  const station = await c.env.DB.prepare(
    `SELECT id, station_name, address, phone, qr_code, is_active, is_closed FROM stations WHERE id = ?`
  ).bind(stationId).first()

  return c.json({ station, purchases: purchases.results })
})

// 구매 이력 전체
coupons.get('/my/history/all', authMiddleware, requireRole('customer'), async (c) => {
  const user = c.get('user')
  const page = parseInt(c.req.query('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const history = await c.env.DB.prepare(
    `SELECT p.id, p.quantity, p.unit_price, p.total_amount, p.status, p.created_at,
            p.refunded_amount, p.order_id,
            c.title as coupon_title,
            s.station_name
     FROM coupon_purchases p
     JOIN coupons c ON p.coupon_id = c.id
     JOIN stations s ON p.station_id = s.id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(user.userId, limit, offset).all()

  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM coupon_purchases WHERE user_id = ?`
  ).bind(user.userId).first<any>()

  return c.json({ history: history.results, total: total?.cnt || 0, page, limit })
})

// ============================================================
// 결제 (Toss Payments)
// ============================================================

// 결제 준비 (임시 주문 생성)
coupons.post('/buy', authMiddleware, requireRole('customer'), async (c) => {
  const user = c.get('user')
  const { couponId, quantity } = await c.req.json()

  if (!couponId || !quantity || quantity < 1) {
    return c.json({ error: '쿠폰 ID와 수량을 입력해주세요.' }, 400)
  }

  const coupon = await c.env.DB.prepare(
    `SELECT c.*, s.station_name, s.is_active, s.is_closed
     FROM coupons c JOIN stations s ON c.station_id = s.id
     WHERE c.id = ? AND c.is_active = 1 AND s.is_active = 1 AND s.is_closed = 0`
  ).bind(couponId).first<any>()
  if (!coupon) return c.json({ error: '구매할 수 없는 쿠폰입니다.' }, 400)

  if (coupon.total_stock !== null && coupon.remaining_stock < quantity) {
    return c.json({ error: '재고가 부족합니다.' }, 400)
  }

  const totalAmount = coupon.discount_price * quantity
  const orderId = `EW-${generateId().replace(/-/g, '').slice(0, 20)}`

  await c.env.DB.prepare(
    `INSERT INTO temp_orders (order_id, user_id, coupon_id, quantity, unit_price, total_amount)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(orderId, user.userId, couponId, quantity, coupon.discount_price, totalAmount).run()

  if (coupon.total_stock !== null) {
    await c.env.DB.prepare(
      `UPDATE coupons SET remaining_stock = remaining_stock - ? WHERE id = ?`
    ).bind(quantity, couponId).run()
  }

  const appUrl = c.env.APP_URL || 'http://localhost:3000'
  const clientKey = c.env.TOSS_CLIENT_KEY || 'test_ck_placeholder'

  // 환불 정책 안내 (결제 시 고지)
  const refundPolicy = {
    card: '카드 결제 시 부분취소는 영업일 기준 3~4일 후 환불됩니다.',
    transfer: '계좌이체는 180일 이내 취소 가능하며, 즉시 환불됩니다.',
    mobile: '휴대폰 결제는 결제 당월에만 취소 가능합니다.',
    summary: '쿠폰 유효기간은 없으며, 미사용 횟수에 대해 언제든 환불 신청이 가능합니다. (결제수단에 따라 환불 기간 상이)',
  }

  return c.json({
    orderId,
    orderName: `${coupon.station_name} ${coupon.title} x${quantity}`,
    customerName: user.name,
    amount: totalAmount,
    clientKey,
    successUrl: `${appUrl}/payment/success?orderId=${orderId}`,
    failUrl: `${appUrl}/payment/fail?orderId=${orderId}`,
    refundPolicy,  // 결제 UI에서 고지용
  })
})

// 결제 성공 확인 (Toss 리다이렉트)
coupons.get('/payment/success', async (c) => {
  const orderId = c.req.query('orderId')
  const paymentKey = c.req.query('paymentKey')
  const amount = c.req.query('amount')

  if (!orderId || !paymentKey || !amount) {
    return c.redirect('/payment/fail?reason=missing_params')
  }

  const secretKey = c.env.TOSS_SECRET_KEY || 'test_sk_placeholder'
  const authStr = btoa(`${secretKey}:`)

  try {
    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authStr}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, paymentKey, amount: parseInt(amount) }),
    })

    const tossData = await tossRes.json<any>()
    if (!tossRes.ok) {
      console.error('[Toss] 결제 승인 실패:', tossData)
      return c.redirect(`/payment/fail?orderId=${orderId}&reason=${tossData.code || 'TOSS_ERROR'}`)
    }

    // 결제수단 추출 (Toss 응답에서)
    const paymentMethod = tossData.method || null // 'card', '계좌이체', etc
    const normalizedMethod = normalizePaymentMethod(paymentMethod)

    const order = await c.env.DB.prepare(
      `SELECT * FROM temp_orders WHERE order_id = ? AND status = 'pending'`
    ).bind(orderId).first<any>()
    if (!order) return c.redirect('/payment/fail?reason=order_not_found')

    const coupon = await c.env.DB.prepare(
      `SELECT wash_count FROM coupons WHERE id = ?`
    ).bind(order.coupon_id).first<any>()
    const remainingUses = (coupon?.wash_count || 1) * order.quantity

    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO coupon_purchases
         (user_id, coupon_id, station_id, order_id, payment_key, quantity, unit_price, total_amount, remaining_uses, payment_method)
         SELECT ?, o.coupon_id, c.station_id, ?, ?, o.quantity, o.unit_price, o.total_amount, ?, ?
         FROM temp_orders o JOIN coupons c ON o.coupon_id = c.id WHERE o.order_id = ?`
      ).bind(order.user_id, orderId, paymentKey, remainingUses, normalizedMethod, orderId),
      c.env.DB.prepare(
        `UPDATE temp_orders SET status = 'paid', updated_at = datetime('now') WHERE order_id = ?`
      ).bind(orderId),
    ])

    return c.redirect(`/payment/success?orderId=${orderId}&done=1`)
  } catch (err) {
    console.error('[Payment Success]', err)
    return c.redirect(`/payment/fail?orderId=${orderId}&reason=server_error`)
  }
})

// 결제수단 정규화
function normalizePaymentMethod(method: string | null): string {
  if (!method) return 'unknown'
  const m = method.toLowerCase()
  if (m.includes('card') || m === '카드') return 'card'
  if (m.includes('transfer') || m === '계좌이체') return 'transfer'
  if (m.includes('virtual') || m === '가상계좌') return 'virtual_account'
  if (m.includes('mobile') || m === '휴대폰') return 'mobile'
  return 'card' // 기본값
}

// 결제 취소/실패
coupons.get('/payment/fail', async (c) => {
  const orderId = c.req.query('orderId')
  if (orderId) {
    const order = await c.env.DB.prepare(
      `SELECT * FROM temp_orders WHERE order_id = ? AND status = 'pending'`
    ).bind(orderId).first<any>()
    if (order) {
      await c.env.DB.batch([
        c.env.DB.prepare(
          `UPDATE temp_orders SET status = 'failed', updated_at = datetime('now') WHERE order_id = ?`
        ).bind(orderId),
        c.env.DB.prepare(
          `UPDATE coupons SET remaining_stock = remaining_stock + ?
           WHERE id = ? AND total_stock IS NOT NULL`
        ).bind(order.quantity, order.coupon_id),
      ])
    }
  }
  return c.redirect(`/payment/fail?reason=cancelled`)
})

// ============================================================
// 환불 API - 보유쿠폰에서 환불 신청
// ============================================================

/**
 * [환불 금액 계산 원칙]
 *
 * 쿠폰 구조: N회 이용권 M장 구매 → 실제 결제금액(total_amount) 기준
 *
 * 예시 1) 기본 쿠폰
 *   - 5회권 1장, 정가 50,000원 → 결제 50,000원
 *   - 1회당 환불단가 = 50,000 ÷ 5 = 10,000원
 *   - 3회 남음 → 환불금액 = 10,000 × 3 = 30,000원
 *
 * 예시 2) 수량 할인 쿠폰 (10장 구매 시 10% 할인)
 *   - 1회권 10장, 정가 1,000원/장 → 할인가 900원/장 → 결제 9,000원
 *   - 1회당 환불단가 = 9,000 ÷ (1회 × 10장) = 900원
 *   - 7장 남음 → 환불금액 = 900 × 7 = 6,300원
 *
 * 예시 3) 5회권 + 수량할인 복합
 *   - 5회권 2장, 할인가 4,500원/장 → 결제 9,000원
 *   - 1회당 환불단가 = 9,000 ÷ (5회 × 2장) = 900원
 *   - 남은 횟수 6회 → 환불금액 = 900 × 6 = 5,400원
 */

// 환불 미리보기 (금액 확인용)
coupons.get('/refund/preview/:purchaseId', authMiddleware, requireRole('customer'), async (c) => {
  const user = c.get('user')
  const purchaseId = c.req.param('purchaseId')
  const refundUsesParam = c.req.query('uses')

  const purchase = await c.env.DB.prepare(
    `SELECT p.*, c.wash_count, c.title as coupon_title, s.station_name
     FROM coupon_purchases p
     JOIN coupons c ON p.coupon_id = c.id
     JOIN stations s ON p.station_id = s.id
     WHERE p.id = ? AND p.user_id = ? AND p.status IN ('active', 'partial_refunded')`
  ).bind(purchaseId, user.userId).first<any>()

  if (!purchase) return c.json({ error: '환불 가능한 쿠폰을 찾을 수 없습니다.' }, 404)

  const pricePerUse = calcRefundAmountPerUse(purchase.total_amount, purchase.wash_count, purchase.quantity)
  const refundUses = refundUsesParam ? parseInt(refundUsesParam) : purchase.remaining_uses

  if (refundUses < 1 || refundUses > purchase.remaining_uses) {
    return c.json({ error: `환불 횟수는 1~${purchase.remaining_uses}회 사이여야 합니다.` }, 400)
  }

  const refundAmount = pricePerUse * refundUses
  const methodNotice = getRefundMethodNotice(purchase.payment_method)

  // 할인율 계산 (정보성)
  const originalPricePerUse = Math.floor(purchase.unit_price / purchase.wash_count)
  const discountRate = originalPricePerUse > 0
    ? Math.round((1 - pricePerUse / originalPricePerUse) * 100)
    : 0

  return c.json({
    purchase_id: purchase.id,
    coupon_title: purchase.coupon_title,
    station_name: purchase.station_name,
    remaining_uses: purchase.remaining_uses,
    refund_uses: refundUses,
    price_per_use: pricePerUse,
    refund_amount: refundAmount,
    discount_rate: discountRate,
    payment_method: purchase.payment_method,
    method_notice: methodNotice,
    // 전체 환불 여부
    is_full_refund: refundUses === purchase.remaining_uses,
  })
})

// 환불 신청 (실제 처리)
coupons.post('/refund/:purchaseId', authMiddleware, requireRole('customer'), async (c) => {
  const user = c.get('user')
  const purchaseId = c.req.param('purchaseId')
  const body = await c.req.json()
  const refundUses: number = body.uses   // 환불 횟수
  const reason: string = body.reason || '고객 환불 요청'

  if (!refundUses || refundUses < 1) {
    return c.json({ error: '환불 횟수를 입력해주세요.' }, 400)
  }

  // 구매 정보 조회
  const purchase = await c.env.DB.prepare(
    `SELECT p.*, c.wash_count, c.title as coupon_title, s.station_name
     FROM coupon_purchases p
     JOIN coupons c ON p.coupon_id = c.id
     JOIN stations s ON p.station_id = s.id
     WHERE p.id = ? AND p.user_id = ? AND p.status IN ('active', 'partial_refunded')`
  ).bind(purchaseId, user.userId).first<any>()

  if (!purchase) return c.json({ error: '환불 가능한 쿠폰을 찾을 수 없습니다.' }, 404)

  if (refundUses > purchase.remaining_uses) {
    return c.json({
      error: `남은 사용 횟수(${purchase.remaining_uses}회)를 초과합니다.`,
    }, 400)
  }

  // 환불 금액 계산 (실제 결제금액 기준, 할인 자동 반영)
  const pricePerUse = calcRefundAmountPerUse(purchase.total_amount, purchase.wash_count, purchase.quantity)
  const refundAmount = pricePerUse * refundUses
  const methodNotice = getRefundMethodNotice(purchase.payment_method)

  // 할인율 (기록용)
  const originalPricePerUse = Math.floor(purchase.unit_price / purchase.wash_count)
  const discountRate = originalPricePerUse > 0
    ? parseFloat((1 - pricePerUse / originalPricePerUse).toFixed(4))
    : 0

  // 이미 진행 중인 환불 요청 확인
  const pendingRefund = await c.env.DB.prepare(
    `SELECT id FROM refund_requests WHERE purchase_id = ? AND status IN ('pending', 'processing')`
  ).bind(purchaseId).first()
  if (pendingRefund) {
    return c.json({ error: '이미 처리 중인 환불 요청이 있습니다. 잠시 후 확인해주세요.' }, 400)
  }

  // 환불 요청 레코드 생성 (먼저 DB에 기록)
  const refundReqResult = await c.env.DB.prepare(
    `INSERT INTO refund_requests
     (purchase_id, user_id, station_id, refund_uses, refund_amount,
      unit_price_per_use, discount_rate, status, refund_type, payment_method, method_notice, reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'processing', 'customer', ?, ?, ?)`
  ).bind(
    purchaseId, user.userId, purchase.station_id,
    refundUses, refundAmount, pricePerUse, discountRate,
    purchase.payment_method, methodNotice, reason
  ).run()

  const refundRequestId = refundReqResult.meta.last_row_id

  // Toss 취소 API 호출 (실제 결제키가 있는 경우)
  let tossOk = false
  let tossCancelKey: string | null = null
  let tossErrorCode: string | null = null
  let tossErrorMessage: string | null = null

  const secretKey = c.env.TOSS_SECRET_KEY || ''
  const isRealPayment = purchase.payment_key && !purchase.payment_key.startsWith('test_')

  if (isRealPayment && secretKey) {
    try {
      const { ok, data } = await callTossCancel(
        secretKey,
        purchase.payment_key,
        refundAmount,
        reason
      )
      if (ok) {
        tossOk = true
        // 취소 목록 중 마지막 취소의 transactionKey 저장
        const cancels = data.cancels || []
        tossCancelKey = cancels[cancels.length - 1]?.transactionKey || null
      } else {
        tossErrorCode = data.code || 'UNKNOWN'
        tossErrorMessage = data.message || '알 수 없는 오류'
      }
    } catch (err: any) {
      tossErrorCode = 'NETWORK_ERROR'
      tossErrorMessage = err?.message || '네트워크 오류'
    }
  } else {
    // 테스트 결제 or 결제키 없음 → DB만 처리 (로컬 테스트용)
    tossOk = true
    tossCancelKey = 'local_test'
  }

  if (!tossOk) {
    // Toss 실패 → 환불요청 실패 상태로 업데이트
    await c.env.DB.prepare(
      `UPDATE refund_requests SET
         status = 'failed', toss_error_code = ?, toss_error_message = ?,
         updated_at = datetime('now'), processed_at = datetime('now')
       WHERE id = ?`
    ).bind(tossErrorCode, tossErrorMessage, refundRequestId).run()

    return c.json({
      error: `환불 처리 실패: ${tossErrorMessage || '카드사 오류'}. 고객센터에 문의해주세요.`,
      error_code: tossErrorCode,
    }, 400)
  }

  // 환불 성공 → DB 일괄 업데이트
  const newRemaining = purchase.remaining_uses - refundUses
  const newStatus = newRemaining === 0 ? 'refunded' : 'partial_refunded'
  const newTossTotalCancelled = (purchase.toss_total_cancelled || 0) + refundAmount

  await c.env.DB.batch([
    // 환불요청 완료 처리
    c.env.DB.prepare(
      `UPDATE refund_requests SET
         status = 'completed', toss_cancel_key = ?,
         updated_at = datetime('now'), processed_at = datetime('now')
       WHERE id = ?`
    ).bind(tossCancelKey, refundRequestId),
    // 쿠폰 구매 내역 업데이트
    c.env.DB.prepare(
      `UPDATE coupon_purchases SET
         remaining_uses = ?,
         status = ?,
         refunded_amount = refunded_amount + ?,
         refunded_uses = refunded_uses + ?,
         toss_total_cancelled = ?,
         refunded_at = datetime('now'),
         updated_at = datetime('now')
       WHERE id = ?`
    ).bind(newRemaining, newStatus, refundAmount, refundUses, newTossTotalCancelled, purchaseId),
  ])

  return c.json({
    success: true,
    refund_request_id: refundRequestId,
    refund_uses: refundUses,
    refund_amount: refundAmount,
    remaining_uses: newRemaining,
    method_notice: methodNotice,
    message: `${refundUses}회 환불 신청이 완료되었습니다. ${refundAmount.toLocaleString()}원이 환불됩니다.`,
  })
})

// 내 환불 내역 조회
coupons.get('/my/refunds/history', authMiddleware, requireRole('customer'), async (c) => {
  const user = c.get('user')
  const page = parseInt(c.req.query('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const refunds = await c.env.DB.prepare(
    `SELECT r.id, r.refund_uses, r.refund_amount, r.status, r.created_at,
            r.method_notice, r.payment_method, r.refund_type,
            c.title as coupon_title, s.station_name
     FROM refund_requests r
     JOIN coupon_purchases cp ON r.purchase_id = cp.id
     JOIN coupons c ON cp.coupon_id = c.id
     JOIN stations s ON r.station_id = s.id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(user.userId, limit, offset).all()

  return c.json({ refunds: refunds.results, page, limit })
})

// ============================================================
// 어드민: 쿠폰 목록
// ============================================================
coupons.get('/admin/list', authMiddleware, requireRole('admin'), async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const stationId = c.req.query('station_id')
  const limit = 20
  const offset = (page - 1) * limit

  const params: any[] = []
  let where = 'WHERE 1=1'
  if (stationId) { where += ' AND c.station_id = ?'; params.push(stationId) }

  const couponList = await c.env.DB.prepare(
    `SELECT c.*, s.station_name,
            (SELECT COUNT(*) FROM coupon_purchases WHERE coupon_id = c.id) as purchase_count
     FROM coupons c JOIN stations s ON c.station_id = s.id
     ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all()

  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM coupons c ${where}`
  ).bind(...params).first<any>()

  return c.json({ coupons: couponList.results, total: total?.cnt || 0 })
})

// 어드민: 환불 요청 목록 조회
coupons.get('/admin/refunds', authMiddleware, requireRole('admin'), async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const status = c.req.query('status')
  const limit = 20
  const offset = (page - 1) * limit

  const params: any[] = []
  let where = 'WHERE 1=1'
  if (status) { where += ' AND r.status = ?'; params.push(status) }

  const refunds = await c.env.DB.prepare(
    `SELECT r.*, u.name as user_name, u.email as user_email, s.station_name,
            cp.order_id, cp.payment_key, cp.total_amount as paid_amount
     FROM refund_requests r
     JOIN users u ON r.user_id = u.id
     JOIN stations s ON r.station_id = s.id
     JOIN coupon_purchases cp ON r.purchase_id = cp.id
     ${where}
     ORDER BY r.created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all()

  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM refund_requests r ${where}`
  ).bind(...params).first<any>()

  return c.json({ refunds: refunds.results, total: total?.cnt || 0 })
})

export default coupons
