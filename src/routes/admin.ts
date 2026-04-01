// 어드민 API 라우트
import { Hono } from 'hono'
import { authMiddleware, requireRole } from '../middleware/auth'
import { sendEmail, applicationApprovedEmail, applicationRejectedEmail, stationClosedRefundEmail } from '../utils/email'
import { generateId, kstNow } from '../utils/jwt'
import type { Env, JWTPayload } from '../types'

type AppEnv = { Bindings: Env; Variables: { user: JWTPayload } }

const admin = new Hono<AppEnv>()
admin.use('*', authMiddleware, requireRole('admin'))

// ============ 대시보드 통계 ============
admin.get('/dashboard', async (c) => {
  const feeSetting = await c.env.DB.prepare(
    `SELECT value FROM platform_settings WHERE key = 'platform_fee_rate'`
  ).first<any>()
  const feeRate = parseFloat(feeSetting?.value || '0.15')

  // DB 시간이 KST로 저장되어 있으므로 localtime 변환 없이 직접 비교
  const todayKst     = kstDate()                        // 'YYYY-MM-DD'
  const yesterdayKst = kstYesterday()                   // 'YYYY-MM-DD'
  const thisMonthKst = todayKst.substring(0, 7)         // 'YYYY-MM'
  const lastMonthDate= new Date(Date.now() + 9*3600000 - 30*24*3600000)
  const lastMonthKst = lastMonthDate.toISOString().substring(0, 7)

  // 유효 purchase status: active, partial_refunded, used, refunded (paid 제외 - 실제 미사용)
  const VALID_STATUS = `status IN ('active','partial_refunded','used','refunded')`

  const [
    users, stations, pendingApps,
    // 쿠폰 구매(플랫폼 매출)
    todayBuy, yesterdayBuy, thisMonthBuy, lastMonthBuy,
    // 세차 사용(정산 지급 기준)
    todayUse, yesterdayUse, thisMonthUse, lastMonthUse,
    // 미정산
    pendingSettlement,
  ] = await Promise.all([
    c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM users WHERE user_type='customer'`).first<any>(),
    c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM stations WHERE is_active=1`).first<any>(),
    c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM station_applications WHERE status='pending'`).first<any>(),
    // 오늘 구매
    c.env.DB.prepare(`SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as cnt FROM coupon_purchases WHERE date(created_at)=? AND ${VALID_STATUS}`).bind(todayKst).first<any>(),
    // 어제 구매
    c.env.DB.prepare(`SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as cnt FROM coupon_purchases WHERE date(created_at)=? AND ${VALID_STATUS}`).bind(yesterdayKst).first<any>(),
    // 이번달 구매
    c.env.DB.prepare(`SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as cnt FROM coupon_purchases WHERE strftime('%Y-%m',created_at)=? AND ${VALID_STATUS}`).bind(thisMonthKst).first<any>(),
    // 지난달 구매
    c.env.DB.prepare(`SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as cnt FROM coupon_purchases WHERE strftime('%Y-%m',created_at)=? AND ${VALID_STATUS}`).bind(lastMonthKst).first<any>(),
    // 오늘 사용
    c.env.DB.prepare(`SELECT COALESCE(SUM(unit_price),0) as total, COUNT(*) as cnt FROM coupon_usages WHERE date(used_at)=?`).bind(todayKst).first<any>(),
    // 어제 사용
    c.env.DB.prepare(`SELECT COALESCE(SUM(unit_price),0) as total, COUNT(*) as cnt FROM coupon_usages WHERE date(used_at)=?`).bind(yesterdayKst).first<any>(),
    // 이번달 사용
    c.env.DB.prepare(`SELECT COALESCE(SUM(unit_price),0) as total, COUNT(*) as cnt FROM coupon_usages WHERE strftime('%Y-%m',used_at)=?`).bind(thisMonthKst).first<any>(),
    // 지난달 사용
    c.env.DB.prepare(`SELECT COALESCE(SUM(unit_price),0) as total, COUNT(*) as cnt FROM coupon_usages WHERE strftime('%Y-%m',used_at)=?`).bind(lastMonthKst).first<any>(),
    // 미정산
    c.env.DB.prepare(`SELECT COALESCE(SUM(unit_price),0) as total FROM coupon_usages WHERE settled=0`).first<any>(),
  ])

  // 최근 7일 구매/사용 차트 데이터
  const [weeklyBuy, weeklyUse] = await Promise.all([
    c.env.DB.prepare(`
      SELECT date(created_at) as day, COALESCE(SUM(total_amount),0) as total, COUNT(*) as cnt
      FROM coupon_purchases
      WHERE date(created_at) >= ? AND ${VALID_STATUS}
      GROUP BY day ORDER BY day
    `).bind(yesterdayKst < todayKst ? (() => { const d = new Date(Date.now()+9*3600000-6*86400000); return d.toISOString().substring(0,10) })() : todayKst).all(),
    c.env.DB.prepare(`
      SELECT date(used_at) as day, COALESCE(SUM(unit_price),0) as total, COUNT(*) as cnt
      FROM coupon_usages
      WHERE date(used_at) >= ?
      GROUP BY day ORDER BY day
    `).bind((() => { const d = new Date(Date.now()+9*3600000-6*86400000); return d.toISOString().substring(0,10) })()).all(),
  ])

  const bf = (v: number) => Math.floor(v * feeRate)
  const bn = (v: number) => Math.floor(v * (1 - feeRate))

  const td_buy = todayBuy?.total || 0
  const yd_buy = yesterdayBuy?.total || 0
  const mo_buy = thisMonthBuy?.total || 0
  const lm_buy = lastMonthBuy?.total || 0
  const td_use = todayUse?.total || 0
  const yd_use = yesterdayUse?.total || 0
  const mo_use = thisMonthUse?.total || 0
  const lm_use = lastMonthUse?.total || 0

  return c.json({
    fee_rate: feeRate,
    total_users:          users?.cnt       || 0,
    total_stations:       stations?.cnt    || 0,
    pending_applications: pendingApps?.cnt || 0,
    pending_settlement_amount: pendingSettlement?.total || 0,
    // 오늘
    today_buy_sales:    td_buy,  today_buy_cnt:    todayBuy?.cnt    || 0,
    today_use_sales:    td_use,  today_use_cnt:    todayUse?.cnt    || 0,
    today_platform_fee: bf(td_buy), today_net_pay: bn(td_use),
    // 어제
    yesterday_buy_sales: yd_buy, yesterday_buy_cnt: yesterdayBuy?.cnt || 0,
    yesterday_use_sales: yd_use, yesterday_use_cnt: yesterdayUse?.cnt || 0,
    yesterday_platform_fee: bf(yd_buy), yesterday_net_pay: bn(yd_use),
    // 이번달
    month_buy_sales:    mo_buy,  month_buy_cnt:    thisMonthBuy?.cnt  || 0,
    month_use_sales:    mo_use,  month_use_cnt:    thisMonthUse?.cnt  || 0,
    month_platform_fee: bf(mo_buy), month_net_pay: bn(mo_use),
    // 지난달
    lmonth_buy_sales:   lm_buy,  lmonth_buy_cnt:   lastMonthBuy?.cnt  || 0,
    lmonth_use_sales:   lm_use,  lmonth_use_cnt:   lastMonthUse?.cnt  || 0,
    lmonth_platform_fee:bf(lm_buy), lmonth_net_pay:bn(lm_use),
    // 차트
    weekly_buy: weeklyBuy.results,
    weekly_use: weeklyUse.results,
  })
})

// ============ 주유소 신청 관리 ============

// 신청 목록
admin.get('/applications', async (c) => {
  const status = c.req.query('status') || 'pending'
  const page = parseInt(c.req.query('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const apps = await c.env.DB.prepare(
    `SELECT a.*, u.email as owner_email, u.phone as owner_phone
     FROM station_applications a JOIN users u ON a.owner_id = u.id
     WHERE a.status = ? ORDER BY a.created_at DESC LIMIT ? OFFSET ?`
  ).bind(status, limit, offset).all()

  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM station_applications WHERE status = ?`
  ).bind(status).first<any>()

  return c.json({ applications: apps.results, total: total?.cnt || 0 })
})

// 신청 상세
admin.get('/applications/:id', async (c) => {
  const id = c.req.param('id')
  const app = await c.env.DB.prepare(
    `SELECT a.*, u.email as owner_email, u.name as owner_name, u.phone as owner_phone
     FROM station_applications a JOIN users u ON a.owner_id = u.id WHERE a.id = ?`
  ).bind(id).first()

  if (!app) return c.json({ error: '신청을 찾을 수 없습니다.' }, 404)
  return c.json({ application: app })
})

// 신청 승인
admin.post('/applications/:id/approve', async (c) => {
  const adminUser = c.get('user')
  const id = c.req.param('id')

  const app = await c.env.DB.prepare(
    `SELECT a.*, u.email as owner_email
     FROM station_applications a JOIN users u ON a.owner_id = u.id
     WHERE a.id = ? AND a.status = 'pending'`
  ).bind(id).first<any>()
  if (!app) return c.json({ error: '신청을 찾을 수 없거나 이미 처리되었습니다.' }, 404)

  // 좌표 없으면 카카오 Geocoding으로 자동 변환
  let finalLat = app.latitude
  let finalLng = app.longitude
  if ((!finalLat || !finalLng) && app.address) {
    const kakaoKey = c.env.KAKAO_REST_API_KEY
    if (kakaoKey) {
      try {
        const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(app.address)}`
        const geoRes = await fetch(url, { headers: { Authorization: `KakaoAK ${kakaoKey}` } })
        if (geoRes.ok) {
          const geoData = await geoRes.json() as any
          const doc = geoData.documents?.[0]
          if (doc) { finalLat = parseFloat(doc.y); finalLng = parseFloat(doc.x) }
        }
      } catch {}
    }
  }

  // 주유소 생성 + QR코드 발급
  const qrCode = generateId()
  const stationResult = await c.env.DB.prepare(
    `INSERT INTO stations
     (application_id, owner_id, station_name, address, address_detail,
      latitude, longitude, phone, car_wash_type, business_reg_number,
      bank_name, account_number, account_holder, qr_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    app.id, app.owner_id, app.station_name, app.address, app.address_detail,
    finalLat, finalLng, app.phone, app.car_wash_type, app.business_reg_number,
    app.bank_name, app.account_number, app.account_holder, qrCode
  ).run()

  // 신청 상태 업데이트
  await c.env.DB.prepare(
    `UPDATE station_applications SET status = 'approved', reviewed_by = ?, reviewed_at = ?
     WHERE id = ?`
  ).bind(adminUser.userId, kstNow(), id).run()

  // 승인 이메일 발송
  if (app.owner_email) {
    await sendEmail(
      c.env.RESEND_API_KEY || '',
      'EV-Wash <noreply@ev-wash.com>',
      {
        to: app.owner_email,
        subject: '[EV-Wash] 주유소 등록이 승인되었습니다.',
        html: applicationApprovedEmail(app.station_name),
      }
    )
  }

  return c.json({
    message: '승인되었습니다.',
    station_id: stationResult.meta.last_row_id,
    qr_code: qrCode,
  })
})

// 신청 반려
admin.post('/applications/:id/reject', async (c) => {
  const adminUser = c.get('user')
  const id = c.req.param('id')
  const { reason } = await c.req.json()

  if (!reason) return c.json({ error: '반려 사유를 입력해주세요.' }, 400)

  const app = await c.env.DB.prepare(
    `SELECT a.*, u.email as owner_email
     FROM station_applications a JOIN users u ON a.owner_id = u.id
     WHERE a.id = ? AND a.status = 'pending'`
  ).bind(id).first<any>()
  if (!app) return c.json({ error: '신청을 찾을 수 없거나 이미 처리되었습니다.' }, 404)

  await c.env.DB.prepare(
    `UPDATE station_applications SET status = 'rejected', reject_reason = ?,
     reviewed_by = ?, reviewed_at = ? WHERE id = ?`
  ).bind(reason, adminUser.userId, kstNow(), id).run()

  if (app.owner_email) {
    await sendEmail(
      c.env.RESEND_API_KEY || '',
      'EV-Wash <noreply@ev-wash.com>',
      {
        to: app.owner_email,
        subject: '[EV-Wash] 주유소 등록 신청이 반려되었습니다.',
        html: applicationRejectedEmail(app.station_name, reason),
      }
    )
  }

  return c.json({ message: '반려되었습니다.' })
})

// ============ 주유소 관리 ============

// 주유소 목록
admin.get('/stations', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const keyword = c.req.query('keyword') || ''
  const limit = 20
  const offset = (page - 1) * limit

  const params: any[] = []
  let where = 'WHERE 1=1'
  if (keyword) {
    where += ' AND (s.station_name LIKE ? OR s.address LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  const stationList = await c.env.DB.prepare(
    `SELECT s.id, s.station_name, s.address, s.car_wash_type,
            s.is_active, s.is_closed, s.created_at,
            u.name as owner_name, u.email as owner_email,
            (SELECT COUNT(*) FROM coupons WHERE station_id = s.id AND is_active = 1) as coupon_count,
            (SELECT COUNT(*) FROM coupon_usages WHERE station_id = s.id) as total_usages
     FROM stations s JOIN users u ON s.owner_id = u.id
     ${where} ORDER BY s.created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all()

  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM stations s ${where}`
  ).bind(...params).first<any>()

  return c.json({ stations: stationList.results, total: total?.cnt || 0 })
})

// 주유소 상세
admin.get('/stations/:id', async (c) => {
  const id = c.req.param('id')
  const station = await c.env.DB.prepare(
    `SELECT s.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
     FROM stations s JOIN users u ON s.owner_id = u.id WHERE s.id = ?`
  ).bind(id).first()

  if (!station) return c.json({ error: '주유소를 찾을 수 없습니다.' }, 404)
  return c.json({ station })
})

// 주유소 강제 폐업 (미사용 쿠폰 환불 + Toss 실제 취소)
admin.post('/stations/:id/close', async (c) => {
  const adminUser = c.get('user')
  const stationId = c.req.param('id')

  const station = await c.env.DB.prepare(
    `SELECT * FROM stations WHERE id = ? AND is_closed = 0`
  ).bind(stationId).first<any>()
  if (!station) return c.json({ error: '주유소를 찾을 수 없거나 이미 폐업되었습니다.' }, 404)

  // 미사용 쿠폰 구매자 목록 (결제키, 결제수단 포함)
  const activePurchases = await c.env.DB.prepare(
    `SELECT p.*, u.email, u.name as user_name, c.wash_count
     FROM coupon_purchases p
     JOIN users u ON p.user_id = u.id
     JOIN coupons c ON p.coupon_id = c.id
     WHERE p.station_id = ? AND p.status IN ('active', 'partial_refunded') AND p.remaining_uses > 0`
  ).bind(stationId).all<any>()

  const secretKey = c.env.TOSS_SECRET_KEY || ''
  const userRefunds = new Map<string, number>()
  const dbOps: D1PreparedStatement[] = []
  let tossSuccessCount = 0
  let tossFailCount = 0

  for (const purchase of activePurchases.results) {
    // 환불 금액 계산 (실제 결제금액 기준)
    const totalUses = purchase.wash_count * purchase.quantity
    const pricePerUse = Math.floor(purchase.total_amount / totalUses)
    const refundAmount = pricePerUse * purchase.remaining_uses

    // Toss 실제 취소 시도
    let tossOk = false
    let tossCancelKey: string | null = null
    let tossErrorCode: string | null = null
    let tossErrorMessage: string | null = null

    const isRealPayment = purchase.payment_key && !purchase.payment_key.startsWith('test_')
    if (isRealPayment && secretKey) {
      try {
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
              cancelReason: `주유소 폐업으로 인한 자동 환불 (${station.station_name})`,
              cancelAmount: refundAmount,
            }),
          }
        )
        const tossData = await tossRes.json() as any
        if (tossRes.ok) {
          tossOk = true
          tossSuccessCount++
          const cancels = tossData.cancels || []
          tossCancelKey = cancels[cancels.length - 1]?.transactionKey || null
        } else {
          tossErrorCode = tossData.code || 'UNKNOWN'
          tossErrorMessage = tossData.message || '알 수 없는 오류'
          tossFailCount++
        }
      } catch (err: any) {
        tossErrorCode = 'NETWORK_ERROR'
        tossErrorMessage = err?.message || '네트워크 오류'
        tossFailCount++
      }
    } else {
      // 테스트 결제 또는 결제키 없음 → DB만 처리
      tossOk = true
      tossCancelKey = 'local_or_test'
      tossSuccessCount++
    }

    // 사용자별 환불 금액 집계 (성공한 건만)
    if (tossOk && purchase.email) {
      userRefunds.set(purchase.email, (userRefunds.get(purchase.email) || 0) + refundAmount)
    }

    // refund_requests 레코드 생성
    dbOps.push(
      c.env.DB.prepare(
        `INSERT INTO refund_requests
         (purchase_id, user_id, station_id, refund_uses, refund_amount,
          unit_price_per_use, discount_rate, status, refund_type,
          payment_method, toss_cancel_key, toss_error_code, toss_error_message,
          reason, admin_note, processed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'force_closure', ?, ?, ?, ?,
                 '주유소 폐업 강제 환불', ?, ?, ?)`
      ).bind(
        purchase.id, purchase.user_id, stationId,
        purchase.remaining_uses, refundAmount, pricePerUse,
        tossOk ? 'completed' : 'failed',
        purchase.payment_method,
        tossCancelKey, tossErrorCode, tossErrorMessage,
        `관리자: ${adminUser.name}`,
        kstNow(), kstNow()
      )
    )

    // coupon_purchases 업데이트
    dbOps.push(
      c.env.DB.prepare(
        `UPDATE coupon_purchases SET
           status = ?,
           remaining_uses = CASE WHEN ? THEN 0 ELSE remaining_uses END,
           refunded_amount = refunded_amount + ?,
           refunded_uses = refunded_uses + ?,
           toss_total_cancelled = toss_total_cancelled + ?,
           force_refunded = 1,
           refunded_at = ?,
           updated_at = ?
         WHERE id = ?`
      ).bind(
        tossOk ? 'refunded' : purchase.status,  // 실패 시 상태 유지
        tossOk ? 1 : 0,
        tossOk ? refundAmount : 0,
        tossOk ? purchase.remaining_uses : 0,
        tossOk ? refundAmount : 0,
        kstNow(), kstNow(),
        purchase.id
      )
    )
  }

  // 주유소 폐업 처리 + 쿠폰 비활성화
  dbOps.push(
    c.env.DB.prepare(
      `UPDATE stations SET is_closed = 1, is_active = 0, closed_at = ? WHERE id = ?`
    ).bind(kstNow(), stationId),
    c.env.DB.prepare(
      `UPDATE coupons SET is_active = 0 WHERE station_id = ?`
    ).bind(stationId)
  )

  // DB 일괄 처리
  if (dbOps.length > 0) {
    // D1은 batch 100개 제한 → 나눠서 처리
    for (let i = 0; i < dbOps.length; i += 50) {
      await c.env.DB.batch(dbOps.slice(i, i + 50))
    }
  }

  // 환불 성공 사용자에게 이메일 발송
  for (const [email, amount] of userRefunds.entries()) {
    await sendEmail(
      c.env.RESEND_API_KEY || '',
      'EV-Wash <noreply@ev-wash.com>',
      {
        to: email,
        subject: '[EV-Wash] 주유소 폐업으로 인한 쿠폰 환불 안내',
        html: stationClosedRefundEmail(station.station_name, amount),
      }
    )
  }

  return c.json({
    message: '주유소가 폐업 처리되었습니다.',
    total_purchases: activePurchases.results.length,
    toss_success: tossSuccessCount,
    toss_failed: tossFailCount,
    note: tossFailCount > 0 ? `${tossFailCount}건은 Toss 취소 실패. 환불요청 내역에서 수동 처리 필요.` : null,
  })
})

// ============ 사용자 관리 ============
admin.get('/users', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const userType = c.req.query('user_type')
  const keyword = c.req.query('keyword') || ''
  const limit = 20
  const offset = (page - 1) * limit

  const params: any[] = []
  let where = 'WHERE 1=1'
  if (userType) { where += ' AND user_type = ?'; params.push(userType) }
  if (keyword) {
    where += ' AND (name LIKE ? OR email LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  const userList = await c.env.DB.prepare(
    `SELECT id, email, name, phone, user_type, social_provider, is_active, created_at
     FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all()

  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM users ${where}`
  ).bind(...params).first<any>()

  return c.json({ users: userList.results, total: total?.cnt || 0 })
})

// 사용자 활성/비활성화
admin.patch('/users/:id/toggle', async (c) => {
  const id = c.req.param('id')
  const user = await c.env.DB.prepare(`SELECT id, is_active FROM users WHERE id = ?`).bind(id).first<any>()
  if (!user) return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404)

  await c.env.DB.prepare(`UPDATE users SET is_active = ? WHERE id = ?`).bind(!user.is_active ? 1 : 0, id).run()
  return c.json({ message: user.is_active ? '비활성화되었습니다.' : '활성화되었습니다.' })
})

// ============ 결제 관리 ============
admin.get('/payments', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const status = c.req.query('status')
  const limit = 20
  const offset = (page - 1) * limit

  const params: any[] = []
  let where = 'WHERE 1=1'
  if (status) { where += ' AND p.status = ?'; params.push(status) }

  const payments = await c.env.DB.prepare(
    `SELECT p.id, p.order_id, p.payment_key, p.quantity, p.total_amount,
            p.remaining_uses, p.status, p.created_at, p.refunded_amount,
            c.title as coupon_title,
            s.station_name,
            u.name as user_name, u.email as user_email
     FROM coupon_purchases p
     JOIN coupons c ON p.coupon_id = c.id
     JOIN stations s ON p.station_id = s.id
     JOIN users u ON p.user_id = u.id
     ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all()

  const total = await c.env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM coupon_purchases p ${where}`
  ).bind(...params).first<any>()

  return c.json({ payments: payments.results, total: total?.cnt || 0 })
})

// ============ 정산 관리 ============

// 정산 대상 조회 (전날 사용분)
admin.get('/settlements/pending', async (c) => {
  const targetDate = c.req.query('date') || new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  const feeRow = await c.env.DB.prepare(
    `SELECT value FROM platform_settings WHERE key = 'platform_fee_rate'`
  ).first<any>()
  const feeRate = parseFloat(feeRow?.value || '0.15')

  const pendingList = await c.env.DB.prepare(
    `SELECT u.station_id, s.station_name, s.bank_name, s.account_number, s.account_holder,
            SUM(u.unit_price) as gross_amount,
            COUNT(*) as usage_count,
            ROUND(SUM(u.unit_price) * ${feeRate}, 0) as platform_fee,
            ROUND(SUM(u.unit_price) * ${1 - feeRate}, 0) as net_amount
     FROM coupon_usages u
     JOIN stations s ON u.station_id = s.id
     WHERE u.settled = 0 AND date(u.used_at) = ?
     GROUP BY u.station_id
     ORDER BY gross_amount DESC`
  ).bind(targetDate).all()

  return c.json({
    date: targetDate,
    fee_rate: feeRate,
    items: pendingList.results,
  })
})

// 정산 처리
admin.post('/settlements/process', async (c) => {
  const adminUser = c.get('user')
  const { date, station_id } = await c.req.json()

  const targetDate = date || new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const feeRow = await c.env.DB.prepare(`SELECT value FROM platform_settings WHERE key = 'platform_fee_rate'`).first<any>()
  const feeRate = parseFloat(feeRow?.value || '0.15')

  // 정산 대상 선택 (특정 주유소 or 전체)
  const params: any[] = [targetDate]
  let stationFilter = ''
  if (station_id) { stationFilter = 'AND u.station_id = ?'; params.push(station_id) }

  const items = await c.env.DB.prepare(
    `SELECT u.station_id, SUM(u.unit_price) as gross, COUNT(*) as cnt
     FROM coupon_usages u
     WHERE u.settled = 0 AND date(u.used_at) = ? ${stationFilter}
     GROUP BY u.station_id`
  ).bind(...params).all<any>()

  const ops = []
  for (const item of items.results) {
    const fee = Math.round(item.gross * feeRate)
    const net = item.gross - fee

    ops.push(
      c.env.DB.prepare(
        `INSERT INTO settlements (station_id, settlement_date, gross_amount, platform_fee_rate, platform_fee, net_amount, usage_count, status, processed_at, processed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`
      ).bind(item.station_id, targetDate, item.gross, feeRate, fee, net, item.cnt, kstNow(), adminUser.userId),
      c.env.DB.prepare(
        `UPDATE coupon_usages SET settled = 1 WHERE station_id = ? AND date(used_at) = ? AND settled = 0`
      ).bind(item.station_id, targetDate)
    )
  }

  if (ops.length > 0) await c.env.DB.batch(ops)

  return c.json({ message: `${items.results.length}개 주유소 정산 완료.`, count: items.results.length })
})

// 정산 목록
admin.get('/settlements', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const status = c.req.query('status')
  const limit = 30
  const offset = (page - 1) * limit

  const params: any[] = []
  let where = 'WHERE 1=1'
  if (status) { where += ' AND s.status = ?'; params.push(status) }

  const list = await c.env.DB.prepare(
    `SELECT s.*, st.station_name, st.bank_name, st.account_number, st.account_holder
     FROM settlements s JOIN stations st ON s.station_id = st.id
     ${where} ORDER BY s.settlement_date DESC, s.created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all()

  const summary = await c.env.DB.prepare(
    `SELECT SUM(net_amount) as total_net, SUM(platform_fee) as total_fee, COUNT(*) as total_cnt
     FROM settlements ${where}`
  ).bind(...params).first<any>()

  return c.json({ settlements: list.results, summary })
})

// ============ 플랫폼 설정 ============
admin.get('/settings', async (c) => {
  const settings = await c.env.DB.prepare(`SELECT key, value, description FROM platform_settings`).all()
  return c.json({ settings: settings.results })
})

admin.put('/settings/:key', async (c) => {
  const key = c.req.param('key')
  const { value } = await c.req.json()

  // 수수료율 유효성 검사
  if (key === 'platform_fee_rate') {
    const rate = parseFloat(value)
    if (isNaN(rate) || rate < 0 || rate > 1) {
      return c.json({ error: '수수료율은 0~1 사이 숫자로 입력해주세요. (예: 0.15 = 15%)' }, 400)
    }
  }

  await c.env.DB.prepare(
    `INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).bind(key, String(value), kstNow()).run()

  return c.json({ message: '설정이 저장되었습니다.' })
})

export default admin
