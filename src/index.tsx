// EV-Wash 메인 앱 진입점
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { Env } from './types'

// API 라우트
import authRoutes from './routes/auth'
import stationRoutes from './routes/stations'
import couponRoutes from './routes/coupons'
import adminRoutes from './routes/admin'
import userRoutes from './routes/user'

// HTML 페이지 - 랜딩
import { landingPage, termsPage, privacyPage } from './pages/landing'

// HTML 페이지 - 고객
import {
  customerHomePage, loginPage, registerPage, stationListPage, stationDetailPage,
  myCouponsPage, myCouponDetailPage, myPage, paymentSuccessPage, paymentFailPage
} from './pages/customer'

// HTML 페이지 - 사장님
import {
  ownerLoginPage, ownerDashboardPage, ownerApplyPage, ownerStationPage
} from './pages/owner'

// HTML 페이지 - 어드민
import {
  adminLoginPage, adminDashboardPage, adminApplicationsPage, adminStationsPage,
  adminUsersPage, adminPaymentsPage, adminSettlementPage, adminSettingsPage
} from './pages/admin'

const app = new Hono<{ Bindings: Env }>()

// ============ 미들웨어 ============
app.use('*', logger())
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// ============ API 라우트 ============
app.route('/api/auth', authRoutes)
app.route('/api/stations', stationRoutes)
app.route('/api/coupons', couponRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/user', userRoutes)

// 결제 콜백 (쿠폰 라우트에 포함)
app.route('/api', couponRoutes)

// 헬스체크
app.get('/api/health', (c) => c.json({ status: 'ok', service: 'EV-Wash', version: '2.0.0' }))

// ============ 랜딩 / 법적 페이지 ============
app.get('/', (c) => c.html(landingPage()))
app.get('/terms', (c) => c.html(termsPage()))
app.get('/privacy', (c) => c.html(privacyPage()))

// ============ 고객 HTML 페이지 ============
app.get('/home', (c) => c.html(customerHomePage()))
app.get('/login', (c) => c.html(loginPage()))
app.get('/register', (c) => c.html(registerPage()))
app.get('/stations', (c) => c.html(stationListPage()))
app.get('/stations/:id', (c) => c.html(stationDetailPage()))
app.get('/my-coupons', (c) => c.html(myCouponsPage()))
app.get('/my-coupons/:stationId', (c) => c.html(myCouponDetailPage()))
app.get('/mypage', (c) => c.html(myPage()))
app.get('/payment/success', (c) => c.html(paymentSuccessPage()))
app.get('/payment/fail', (c) => c.html(paymentFailPage()))

// ============ 사장님 HTML 페이지 ============
app.get('/owner', (c) => c.html(ownerDashboardPage()))
app.get('/owner/login', (c) => c.html(ownerLoginPage()))
app.get('/owner/apply', (c) => c.html(ownerApplyPage()))
app.get('/owner/stations/:id', (c) => c.html(ownerStationPage()))

// ============ 어드민 HTML 페이지 ============
app.get('/admin', (c) => c.html(adminDashboardPage()))
app.get('/admin/login', (c) => c.html(adminLoginPage()))
app.get('/admin/applications', (c) => c.html(adminApplicationsPage()))
app.get('/admin/applications/:id', (c) => c.html(adminApplicationsPage())) // 상세는 모달
app.get('/admin/stations', (c) => c.html(adminStationsPage()))
app.get('/admin/stations/:id', (c) => c.html(adminStationsPage()))
app.get('/admin/users', (c) => c.html(adminUsersPage()))
app.get('/admin/payments', (c) => c.html(adminPaymentsPage()))
app.get('/admin/settlement', (c) => c.html(adminSettlementPage()))
app.get('/admin/settings', (c) => c.html(adminSettingsPage()))

export default app
