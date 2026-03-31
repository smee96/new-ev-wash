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
  // 플랫폼 수수료율 조회
  const feeSetting = await c.env.DB.prepare(
    `SELECT value FROM platform_settings WHERE key = 'platform_fee_rate'`
  ).first<any>()
  const feeRate = parseFloat(feeSetting?.value || '0.15')

  const [
    users, stations, pendingApps,
    todaySales, yesterdaySales,
    thisMonthSales, lastMonthSales,
    pendingSettlement,
  ] = await Promise.all([
    // 기본 현황
    c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM users WHERE user_type = 'customer'`).first<any>(),
    c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM stations WHERE is_active = 1`).first<any>(),
    c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM station_applications WHERE status = 'pending'`).first<any>(),
    // 오늘 매출·건수
    c.env.DB.prepare(`
      SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as cnt
      FROM coupon_purchases
      WHERE date(created_at,'localtime') = date('now','localtime') AND status = 'paid'
    `).first<any>(),
    // 어제 매출·건수
    c.env.DB.prepare(`
      SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as cnt
      FROM coupon_purchases
      WHERE date(created_at,'localtime') = date('now','localtime','-1 day') AND status = 'paid'
    `).first<any>(),
    // 이번달 매출·건수
    c.env.DB.prepare(`
      SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as cnt
      FROM coupon_purchases
      WHERE strftime('%Y-%m', created_at,'localtime') = strftime('%Y-%m','now','localtime') AND status = 'paid'
    `).first<any>(),
    // 지난달 매출·건수
    c.env.DB.prepare(`
      SELECT COALESCE(SUM(total_amount),0) as total, COUNT(*) as cnt
      FROM coupon_purchases
      WHERE strftime('%Y-%m', created_at,'localtime') = strftime('%Y-%m','now','localtime','-1 month') AND status = 'paid'
    `).first<any>(),
    // 미정산 금액 (정산 예정)
    c.env.DB.prepare(`SELECT COALESCE(SUM(unit_price),0) as total FROM coupon_usages WHERE settled = 0`).first<any>(),
  ])

  // 최근 7일 매출 (차트)
  const weeklySales = await c.env.DB.prepare(`
    SELECT date(created_at,'localtime') as day,
           COALESCE(SUM(total_amount),0) as total,
           COUNT(*) as cnt
    FROM coupon_purchases
    WHERE date(created_at,'localtime') >= date('now','localtime','-6 days')
      AND status = 'paid'
    GROUP BY day ORDER BY day
  `).all()

  const todayTotal    = todaySales?.total     || 0
  const yesterdayTotal= yesterdaySales?.total  || 0
  const thisMonthTotal= thisMonthSales?.total  || 0
  const lastMonthTotal= lastMonthSales?.total  || 0
  const pendingTotal  = pendingSettlement?.total|| 0

  return c.json({
    total_users:              users?.cnt            || 0,
    total_stations:           stations?.cnt         || 0,
    pending_applications:     pendingApps?.cnt      || 0,
    // 오늘
    today_sales:              todayTotal,
    today_payment_count:      todaySales?.cnt       || 0,
    today_platform_fee:       Math.floor(todayTotal * feeRate),
    today_settle_expected:    Math.floor(todayTotal * (1 - feeRate)),
    // 어제
    yesterday_sales:          yesterdayTotal,
    yesterday_payment_count:  yesterdaySales?.cnt   || 0,
    yesterday_platform_fee:   Math.floor(yesterdayTotal * feeRate),
    yesterday_settle_expected:Math.floor(yesterdayTotal * (1 - feeRate)),
    // 이번달
    month_sales:              thisMonthTotal,
    month_payment_count:      thisMonthSales?.cnt   || 0,
    month_platform_fee:       Math.floor(thisMonthTotal * feeRate),
    month_settle_expected:    Math.floor(thisMonthTotal * (1 - feeRate)),
    // 지난달
    last_month_sales:         lastMonthTotal,
    last_month_payment_count: lastMonthSales?.cnt   || 0,
    last_month_platform_fee:  Math.floor(lastMonthTotal * feeRate),
    last_month_settle_expected:Math.floor(lastMonthTotal * (1 - feeRate)),
    // 기타
    pending_settlement_amount:pendingTotal,
    fee_rate:                 feeRate,
    weekly_sales:             weeklySales.results,
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
    app.latitude, app.longitude, app.phone, app.car_wash_type, app.business_reg_number,
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
