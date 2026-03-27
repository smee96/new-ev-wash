import { Hono } from 'hono';
import { requireAuth, requireRole } from '../middleware/auth';
import type { Env } from '../types';

const coupons = new Hono<{ Bindings: Env }>();

// =====================
// 고객 쿠폰 API
// =====================

// POST /api/coupons/buy - 쿠폰 구매 시작 (토스 결제 준비)
coupons.post('/buy', requireAuth, requireRole('customer'), async (c) => {
  try {
    const user = c.get('user') as any;
    const { couponId, quantity = 1 } = await c.req.json();

    const coupon = await c.env.DB.prepare(`
      SELECT c.*, gs.station_name FROM coupons c
      JOIN gas_stations gs ON c.station_id = gs.id
      WHERE c.id = ? AND c.is_active = 1
    `).bind(couponId).first<any>();

    if (!coupon) return c.json({ error: '쿠폰을 찾을 수 없습니다.' }, 404);
    if (quantity < 1 || quantity > 100) return c.json({ error: '수량은 1~100 사이여야 합니다.' }, 400);

    const totalAmount = coupon.discount_price * quantity;
    const orderId = `EVWASH-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30분

    await c.env.DB.prepare(`
      INSERT INTO temporary_orders (order_id, customer_id, coupon_id, quantity, unit_price, total_amount, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(orderId, user.userId, couponId, quantity, coupon.discount_price, totalAmount, expiresAt).run();

    const successUrl = `${c.env.TOSS_SUCCESS_URL || 'https://ev-wash.com/payment/success'}?orderId=${orderId}`;
    const failUrl = `${c.env.TOSS_FAIL_URL || 'https://ev-wash.com/payment/fail'}?orderId=${orderId}`;

    return c.json({
      orderId,
      amount: totalAmount,
      orderName: `${coupon.station_name} - ${coupon.title} ${quantity}매`,
      customerName: user.name,
      clientKey: c.env.TOSS_CLIENT_KEY || 'test_ck_placeholder',
      successUrl,
      failUrl,
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /api/payment/success - 결제 성공 콜백
coupons.get('/payment/success', async (c) => {
  const paymentKey = c.req.query('paymentKey');
  const orderId = c.req.query('orderId');
  const amount = c.req.query('amount');

  if (!paymentKey || !orderId || !amount) {
    return c.redirect('/payment/fail?message=잘못된_요청');
  }

  try {
    const order = await c.env.DB.prepare(
      'SELECT * FROM temporary_orders WHERE order_id = ? AND status = ?'
    ).bind(orderId, 'pending').first<any>();

    if (!order) return c.redirect('/payment/fail?message=주문을_찾을_수_없습니다');
    if (parseInt(amount) !== order.total_amount) {
      return c.redirect('/payment/fail?message=금액_불일치');
    }

    // 토스 결제 승인 API 호출
    const secretKey = c.env.TOSS_SECRET_KEY || 'test_sk_placeholder';
    const authHeader = `Basic ${btoa(secretKey + ':')}`;

    const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount: parseInt(amount) }),
    });

    const tossData = await tossRes.json() as any;
    if (!tossRes.ok) {
      await c.env.DB.prepare('UPDATE temporary_orders SET status = ? WHERE order_id = ?')
        .bind('failed', orderId).run();
      return c.redirect(`/payment/fail?message=${encodeURIComponent(tossData.message || '결제 실패')}`);
    }

    // 쿠폰 구매 기록 생성
    const coupon = await c.env.DB.prepare('SELECT * FROM coupons WHERE id = ?')
      .bind(order.coupon_id).first<any>();

    let expiresAt = null;
    if (coupon?.valid_days) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + coupon.valid_days);
      expiresAt = expDate.toISOString();
    }

    await c.env.DB.prepare(`
      INSERT INTO coupon_purchases 
      (customer_id, coupon_id, station_id, quantity, used_quantity, unit_price, total_amount, payment_method, payment_status, payment_key, order_id, expires_at)
      VALUES (?, ?, ?, ?, 0, ?, ?, 'toss', 'completed', ?, ?, ?)
    `).bind(
      order.customer_id, order.coupon_id, coupon.station_id,
      order.quantity, order.unit_price, order.total_amount,
      paymentKey, orderId, expiresAt
    ).run();

    // 임시 주문 완료 처리
    await c.env.DB.prepare(
      'UPDATE temporary_orders SET status = ?, payment_key = ? WHERE order_id = ?'
    ).bind('completed', paymentKey, orderId).run();

    return c.redirect(`/payment/success?orderId=${orderId}&amount=${amount}`);
  } catch (e: any) {
    return c.redirect(`/payment/fail?message=${encodeURIComponent(e.message)}`);
  }
});

// GET /api/payment/fail - 결제 실패 콜백
coupons.get('/payment/fail', async (c) => {
  const orderId = c.req.query('orderId');
  if (orderId) {
    await c.env.DB.prepare('UPDATE temporary_orders SET status = ? WHERE order_id = ?')
      .bind('failed', orderId).run();
  }
  return c.redirect(`/payment/fail?message=${c.req.query('message') || '결제가 취소되었습니다'}`);
});

// GET /api/coupons/my - 내 쿠폰 목록 (주유소별)
coupons.get('/my', requireAuth, requireRole('customer'), async (c) => {
  const user = c.get('user') as any;

  const { results } = await c.env.DB.prepare(`
    SELECT 
      gs.id as station_id, gs.station_name, gs.address, gs.phone,
      SUM(cp.quantity) as total_quantity,
      SUM(cp.used_quantity) as used_quantity,
      SUM(cp.quantity - cp.used_quantity) as remaining_quantity,
      SUM(cp.total_amount) as total_amount
    FROM coupon_purchases cp
    JOIN gas_stations gs ON cp.station_id = gs.id
    WHERE cp.customer_id = ? AND cp.payment_status = 'completed'
      AND (cp.quantity - cp.used_quantity) > 0
    GROUP BY gs.id, gs.station_name, gs.address, gs.phone
    ORDER BY gs.station_name
  `).bind(user.userId).all();

  return c.json({ stations: results });
});

// GET /api/coupons/my/:stationId - 특정 주유소 내 쿠폰 상세
coupons.get('/my/:stationId', requireAuth, requireRole('customer'), async (c) => {
  const user = c.get('user') as any;
  const stationId = parseInt(c.req.param('stationId'));

  const { results } = await c.env.DB.prepare(`
    SELECT cp.*, c.title, c.description, c.wash_count, c.discount_price as unit_price_current
    FROM coupon_purchases cp
    JOIN coupons c ON cp.coupon_id = c.id
    WHERE cp.customer_id = ? AND cp.station_id = ? AND cp.payment_status = 'completed'
      AND (cp.quantity - cp.used_quantity) > 0
    ORDER BY cp.purchased_at ASC
  `).bind(user.userId, stationId).all();

  return c.json({ purchases: results });
});

// POST /api/coupons/use - 쿠폰 사용 (QR 스캔 후)
coupons.post('/use', requireAuth, requireRole('customer'), async (c) => {
  try {
    const user = c.get('user') as any;
    const { couponId, stationId, qrData } = await c.req.json();

    // QR 데이터 검증
    if (!qrData || !qrData.startsWith('evwash:')) {
      return c.json({ error: '유효하지 않은 QR 코드입니다.' }, 400);
    }

    const [, qrStationId] = qrData.split(':');
    if (parseInt(qrStationId) !== parseInt(stationId)) {
      return c.json({ error: '다른 주유소의 QR 코드입니다.' }, 400);
    }

    // QR 코드로 주유소 확인
    const station = await c.env.DB.prepare(
      'SELECT * FROM gas_stations WHERE id = ? AND qr_code = ? AND is_active = 1'
    ).bind(stationId, qrData).first<any>();

    if (!station) return c.json({ error: '유효하지 않은 QR 코드입니다.' }, 400);

    // FIFO: 가장 오래된 구매 기록부터 사용
    const purchase = await c.env.DB.prepare(`
      SELECT cp.* FROM coupon_purchases cp
      WHERE cp.customer_id = ? AND cp.coupon_id = ? AND cp.station_id = ?
        AND cp.payment_status = 'completed'
        AND (cp.quantity - cp.used_quantity) > 0
        AND (cp.expires_at IS NULL OR cp.expires_at > datetime('now'))
      ORDER BY cp.purchased_at ASC
      LIMIT 1
    `).bind(user.userId, couponId, stationId).first<any>();

    if (!purchase) return c.json({ error: '사용 가능한 쿠폰이 없습니다.' }, 400);

    // 사용 처리
    await c.env.DB.prepare(
      'UPDATE coupon_purchases SET used_quantity = used_quantity + 1 WHERE id = ?'
    ).bind(purchase.id).run();

    await c.env.DB.prepare(`
      INSERT INTO coupon_usages (purchase_id, coupon_id, station_id, customer_id)
      VALUES (?, ?, ?, ?)
    `).bind(purchase.id, couponId, stationId, user.userId).run();

    return c.json({ success: true, message: '쿠폰이 사용되었습니다.' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// POST /api/coupons/cancel - 쿠폰 취소/환불
coupons.post('/cancel', requireAuth, requireRole('customer'), async (c) => {
  try {
    const user = c.get('user') as any;
    const { purchaseId, cancelQuantity, cancelReason } = await c.req.json();

    const purchase = await c.env.DB.prepare(
      'SELECT * FROM coupon_purchases WHERE id = ? AND customer_id = ? AND payment_status = ?'
    ).bind(purchaseId, user.userId, 'completed').first<any>();

    if (!purchase) return c.json({ error: '구매 내역을 찾을 수 없습니다.' }, 404);

    const availableForCancel = purchase.quantity - purchase.used_quantity;
    if (cancelQuantity > availableForCancel) {
      return c.json({ error: `최대 ${availableForCancel}매까지 취소 가능합니다.` }, 400);
    }

    // 수수료 계산
    const purchasedAt = new Date(purchase.purchased_at).getTime();
    const hoursSincePurchase = (Date.now() - purchasedAt) / (1000 * 60 * 60);

    const cancelFeeRateSetting = await c.env.DB.prepare(
      "SELECT setting_value FROM platform_settings WHERE setting_key = 'cancel_fee_rate'"
    ).first<any>();
    const cancelFeeRate = parseFloat(cancelFeeRateSetting?.setting_value || '0.033');

    const refundAmountPerUnit = purchase.unit_price;
    let cancelFee = 0;
    if (hoursSincePurchase > 24) {
      cancelFee = Math.floor(refundAmountPerUnit * cancelQuantity * cancelFeeRate);
    }
    const refundAmount = refundAmountPerUnit * cancelQuantity - cancelFee;

    // 토스 부분 취소 API
    if (purchase.payment_key) {
      const secretKey = c.env.TOSS_SECRET_KEY || 'test_sk_placeholder';
      const authHeader = `Basic ${btoa(secretKey + ':')}`;

      const tossRes = await fetch(`https://api.tosspayments.com/v1/payments/${purchase.payment_key}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelReason: cancelReason || '고객 요청',
          cancelAmount: refundAmount,
          taxFreeAmount: 0,
        }),
      });

      if (!tossRes.ok) {
        const errData = await tossRes.json() as any;
        return c.json({ error: errData.message || '환불 처리 중 오류가 발생했습니다.' }, 500);
      }
    }

    // 구매 수량 업데이트
    const newQuantity = purchase.quantity - cancelQuantity;
    const newStatus = newQuantity === 0 ? 'refunded' : 'partial_refunded';
    await c.env.DB.prepare(
      'UPDATE coupon_purchases SET quantity = ?, total_amount = total_amount - ?, payment_status = ? WHERE id = ?'
    ).bind(newQuantity, refundAmountPerUnit * cancelQuantity, newStatus, purchaseId).run();

    // 취소 내역 저장
    await c.env.DB.prepare(`
      INSERT INTO cancellations (purchase_id, customer_id, cancel_quantity, refund_amount, cancel_fee, cancel_reason, status, payment_key, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, datetime('now'))
    `).bind(purchaseId, user.userId, cancelQuantity, refundAmount, cancelFee, cancelReason || '고객 요청', purchase.payment_key).run();

    return c.json({ success: true, refundAmount, cancelFee });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /api/coupons/purchases - 구매 내역
coupons.get('/purchases', requireAuth, requireRole('customer'), async (c) => {
  const user = c.get('user') as any;

  const { results } = await c.env.DB.prepare(`
    SELECT cp.*, c.title as coupon_title, c.wash_count, gs.station_name
    FROM coupon_purchases cp
    JOIN coupons c ON cp.coupon_id = c.id
    JOIN gas_stations gs ON cp.station_id = gs.id
    WHERE cp.customer_id = ?
    ORDER BY cp.purchased_at DESC
  `).bind(user.userId).all();

  return c.json({ purchases: results });
});

// GET /api/coupons/cancellations - 취소 내역
coupons.get('/cancellations', requireAuth, requireRole('customer'), async (c) => {
  const user = c.get('user') as any;

  const { results } = await c.env.DB.prepare(`
    SELECT ca.*, cp.order_id, c.title as coupon_title, gs.station_name
    FROM cancellations ca
    JOIN coupon_purchases cp ON ca.purchase_id = cp.id
    JOIN coupons c ON cp.coupon_id = c.id
    JOIN gas_stations gs ON cp.station_id = gs.id
    WHERE ca.customer_id = ?
    ORDER BY ca.requested_at DESC
  `).bind(user.userId).all();

  return c.json({ cancellations: results });
});

export default coupons;
