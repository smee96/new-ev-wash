// 쿠폰 관리 + 결제 API (Toss Payments)
import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import { generateId } from '../utils/jwt'
import type { Env, JWTPayload } from '../types'

type AppEnv = { Bindings: Env; Variables: { user: JWTPayload } }

const coupons = new Hono<AppEnv>()

// ============ 사장님: 쿠폰 관리 ============

// 쿠폰 생성
coupons.post('/owner/stations/:stationId/coupons', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const stationId = parseInt(c.req.param('stationId'))
  const { title, description, original_price, discount_price, wash_count, total_stock } = await c.req.json()

  // 주유소 소유권 확인
  const station = await c.env.DB.prepare(
    `SELECT id FROM stations WHERE id = ? AND owner_id = ? AND is_active = 1 AND is_closed = 0`
  ).bind(stationId, user.userId).first()
  if (!station) return c.json({ error: '주유소를 찾을 수 없습니다.' }, 404)

  // 유효성 검사
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
    `SELECT c.id FROM coupons c JOIN stations s ON c.station_id = s.id
     WHERE c.id = ? AND s.owner_id = ?`
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

// 쿠폰 삭제 (미판매 쿠폰만)
coupons.delete('/owner/coupons/:id', authMiddleware, requireRole('station_owner'), async (c) => {
  const user = c.get('user')
  const couponId = c.req.param('id')

  const coupon = await c.env.DB.prepare(
    `SELECT c.id FROM coupons c JOIN stations s ON c.station_id = s.id
     WHERE c.id = ? AND s.owner_id = ?`
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

// ============ 고객: 쿠폰 구매 ============

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

  // 주유소별 그룹핑
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

// 구매 이력
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

// ============ 결제 (Toss Payments) ============

// 결제 준비 (임시 주문 생성)
coupons.post('/buy', authMiddleware, requireRole('customer'), async (c) => {
  const user = c.get('user')
  const { couponId, quantity } = await c.req.json()

  if (!couponId || !quantity || quantity < 1) {
    return c.json({ error: '쿠폰 ID와 수량을 입력해주세요.' }, 400)
  }

  // 쿠폰 조회
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

  // 임시 주문 생성
  await c.env.DB.prepare(
    `INSERT INTO temp_orders (order_id, user_id, coupon_id, quantity, unit_price, total_amount)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(orderId, user.userId, couponId, quantity, coupon.discount_price, totalAmount).run()

  // 재고 임시 차감
  if (coupon.total_stock !== null) {
    await c.env.DB.prepare(
      `UPDATE coupons SET remaining_stock = remaining_stock - ? WHERE id = ?`
    ).bind(quantity, couponId).run()
  }

  const appUrl = c.env.APP_URL || 'http://localhost:3000'
  const clientKey = c.env.TOSS_CLIENT_KEY || 'test_ck_placeholder'

  return c.json({
    orderId,
    orderName: `${coupon.station_name} ${coupon.title} x${quantity}`,
    customerName: user.name,
    amount: totalAmount,
    clientKey,
    successUrl: `${appUrl}/payment/success?orderId=${orderId}`,
    failUrl: `${appUrl}/payment/fail?orderId=${orderId}`,
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

  // Toss 결제 승인 API 호출
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

    // 임시 주문 조회
    const order = await c.env.DB.prepare(
      `SELECT * FROM temp_orders WHERE order_id = ? AND status = 'pending'`
    ).bind(orderId).first<any>()
    if (!order) {
      return c.redirect('/payment/fail?reason=order_not_found')
    }

    const coupon = await c.env.DB.prepare(
      `SELECT wash_count FROM coupons WHERE id = ?`
    ).bind(order.coupon_id).first<any>()
    const remainingUses = (coupon?.wash_count || 1) * order.quantity

    // 구매 내역 생성
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO coupon_purchases
         (user_id, coupon_id, station_id, order_id, payment_key, quantity, unit_price, total_amount, remaining_uses)
         SELECT ?, o.coupon_id, c.station_id, ?, ?, o.quantity, o.unit_price, o.total_amount, ?
         FROM temp_orders o JOIN coupons c ON o.coupon_id = c.id WHERE o.order_id = ?`
      ).bind(order.user_id, orderId, paymentKey, remainingUses, orderId),
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
        // 재고 복원
        c.env.DB.prepare(
          `UPDATE coupons SET remaining_stock = remaining_stock + ?
           WHERE id = ? AND total_stock IS NOT NULL`
        ).bind(order.quantity, order.coupon_id),
      ])
    }
  }
  return c.redirect(`/payment/fail?reason=cancelled`)
})

// ============ 환불 (미사용 쿠폰, 언제든지 가능) ============
coupons.post('/refund/:purchaseId', authMiddleware, requireRole('customer'), async (c) => {
  const user = c.get('user')
  const purchaseId = c.req.param('purchaseId')
  const { quantity } = await c.req.json() // 환불할 횟수 (1이상, remaining_uses 이하)

  const purchase = await c.env.DB.prepare(
    `SELECT p.*, c.wash_count, c.discount_price
     FROM coupon_purchases p JOIN coupons c ON p.coupon_id = c.id
     WHERE p.id = ? AND p.user_id = ? AND p.status IN ('active', 'partial_refunded')`
  ).bind(purchaseId, user.userId).first<any>()

  if (!purchase) return c.json({ error: '환불할 쿠폰을 찾을 수 없습니다.' }, 404)

  const refundQty = quantity || purchase.remaining_uses // 미지정시 전체 환불
  if (refundQty > purchase.remaining_uses) {
    return c.json({ error: `남은 사용 횟수(${purchase.remaining_uses}회) 초과입니다.` }, 400)
  }

  // 환불 금액 계산 (사용 횟수 기준)
  const pricePerUse = Math.floor(purchase.unit_price / purchase.wash_count)
  const refundAmount = pricePerUse * refundQty

  // Toss 환불 API 호출
  if (purchase.payment_key && !purchase.payment_key.startsWith('test_')) {
    const secretKey = c.env.TOSS_SECRET_KEY || ''
    const authStr = btoa(`${secretKey}:`)
    const tossRes = await fetch(
      `https://api.tosspayments.com/v1/payments/${purchase.payment_key}/cancels`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authStr}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelReason: '고객 환불 요청',
          cancelAmount: refundAmount,
        }),
      }
    )
    if (!tossRes.ok) {
      const err = await tossRes.json<any>()
      return c.json({ error: `환불 처리 실패: ${err.message || '알 수 없는 오류'}` }, 400)
    }
  }

  const newRemaining = purchase.remaining_uses - refundQty
  const newStatus = newRemaining === 0 ? 'refunded' : 'partial_refunded'

  await c.env.DB.prepare(
    `UPDATE coupon_purchases SET
       remaining_uses = ?, status = ?,
       refunded_amount = refunded_amount + ?,
       refunded_uses = refunded_uses + ?,
       refunded_at = datetime('now'),
       updated_at = datetime('now')
     WHERE id = ?`
  ).bind(newRemaining, newStatus, refundAmount, refundQty, purchaseId).run()

  return c.json({ message: `${refundAmount.toLocaleString()}원이 환불됩니다.`, refund_amount: refundAmount })
})

// ============ 어드민 ============

// 전체 쿠폰 목록
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

export default coupons
