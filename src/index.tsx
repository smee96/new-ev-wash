import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Env } from './types'
import authRoutes from './routes/auth'
import stationRoutes from './routes/stations'
import couponRoutes from './routes/coupons'
import adminRoutes from './routes/admin'
import userRoutes from './routes/user'

const app = new Hono<{ Bindings: Env }>()

app.use('*', logger())
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// ============ API Routes ============
app.route('/api/auth', authRoutes)
app.route('/api/stations', stationRoutes)
app.route('/api/owner', stationRoutes) // alias
app.route('/api/coupons', couponRoutes)
app.route('/api/payment', couponRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/user', userRoutes)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', service: 'EV-Wash', version: '1.0.0' }))

// ============ Static File Serving ============
app.use('/static/*', serveStatic({ root: './' }))

// ============ HTML Pages ============

// === 고객 모바일웹 ===
app.get('/', (c) => c.html(customerIndexPage()))
app.get('/login', (c) => c.html(loginPage()))
app.get('/register', (c) => c.html(registerPage()))
app.get('/stations', (c) => c.html(stationListPage()))
app.get('/stations/:id', (c) => c.html(stationDetailPage()))
app.get('/my-coupons', (c) => c.html(myCouponsPage()))
app.get('/my-coupons/:stationId', (c) => c.html(myCouponsDetailPage()))
app.get('/payment/success', (c) => c.html(paymentSuccessPage()))
app.get('/payment/fail', (c) => c.html(paymentFailPage()))
app.get('/mypage', (c) => c.html(myPage()))
app.get('/cs', (c) => c.html(csPage()))

// === 사장님 웹 ===
app.get('/owner', (c) => c.html(ownerDashboardPage()))
app.get('/owner/login', (c) => c.html(ownerLoginPage()))
app.get('/owner/register', (c) => c.html(ownerRegisterPage()))
app.get('/owner/apply', (c) => c.html(ownerApplyPage()))
app.get('/owner/stations/:id', (c) => c.html(ownerStationPage()))
app.get('/owner/stations/:id/qr', (c) => c.html(ownerQRPage()))
app.get('/owner/mypage', (c) => c.html(ownerMyPage()))

// === 어드민 ===
app.get('/admin', (c) => c.html(adminDashboardPage()))
app.get('/admin/login', (c) => c.html(adminLoginPage()))
app.get('/admin/applications', (c) => c.html(adminApplicationsPage()))
app.get('/admin/applications/:id', (c) => c.html(adminApplicationDetailPage()))
app.get('/admin/stations', (c) => c.html(adminStationsPage()))
app.get('/admin/users', (c) => c.html(adminUsersPage()))
app.get('/admin/payments', (c) => c.html(adminPaymentsPage()))
app.get('/admin/settlement', (c) => c.html(adminSettlementPage()))
app.get('/admin/settings', (c) => c.html(adminSettingsPage()))

export default app

// ========================
// HTML Page Templates
// ========================

const head = (title: string) => `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>${title} - EV-Wash</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<style>
  * { -webkit-tap-highlight-color: transparent; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .ev-green { color: #10b981; }
  .ev-bg { background-color: #10b981; }
  .ev-border { border-color: #10b981; }
  .spinner { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .btn-primary { background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: none; width: 100%; }
  .btn-primary:hover { background: #059669; }
  .btn-primary:disabled { background: #9ca3af; cursor: not-allowed; }
  .btn-outline { background: white; color: #10b981; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 2px solid #10b981; width: 100%; }
  .input-field { width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 16px; outline: none; transition: border-color 0.2s; }
  .input-field:focus { border-color: #10b981; }
  .card { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top: 1px solid #f3f4f6; display: flex; z-index: 100; }
  .bottom-nav a { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 8px 4px; font-size: 11px; color: #9ca3af; text-decoration: none; }
  .bottom-nav a.active, .bottom-nav a:hover { color: #10b981; }
  .toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #1f2937; color: white; padding: 12px 20px; border-radius: 8px; font-size: 14px; z-index: 9999; display: none; }
</style>
</head>
<body class="bg-gray-50">
<div id="toast" class="toast"></div>
<script>
const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('ev_token');
  if (t) cfg.headers['Authorization'] = 'Bearer ' + t;
  return cfg;
});
function showToast(msg, color='#1f2937') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.background = color; t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 2500);
}
function getUser() { try { return JSON.parse(localStorage.getItem('ev_user') || 'null'); } catch { return null; } }
function logout() { localStorage.removeItem('ev_token'); localStorage.removeItem('ev_user'); window.location.href = '/login'; }
function formatPrice(n) { return Number(n).toLocaleString() + '원'; }
function formatDate(s) { if (!s) return '-'; return new Date(s).toLocaleDateString('ko-KR', { year:'numeric', month:'2-digit', day:'2-digit' }); }
</script>
`

const foot = () => `</body></html>`

// ============ 고객 페이지들 ============

function customerIndexPage(): string {
  return head('홈') + `
<div class="min-h-screen pb-20">
  <!-- 헤더 -->
  <div class="ev-bg text-white px-4 pt-12 pb-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <p class="text-sm opacity-80" id="greeting">안녕하세요</p>
        <h1 class="text-xl font-bold" id="userName">EV-Wash</h1>
      </div>
      <a href="/mypage" class="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
        <i class="fas fa-user text-white"></i>
      </a>
    </div>
    <div class="relative">
      <input id="searchInput" type="text" placeholder="지역 또는 주유소명 검색" 
        class="w-full px-4 py-3 pl-10 rounded-xl text-gray-800 text-sm outline-none"
        onkeypress="if(event.key==='Enter') searchStations()">
      <i class="fas fa-search absolute left-3 top-3.5 text-gray-400"></i>
    </div>
  </div>

  <!-- 내 쿠폰 요약 -->
  <div class="px-4 py-4" id="myCouponSummary" style="display:none">
    <a href="/my-coupons">
      <div class="card flex items-center justify-between">
        <div>
          <p class="text-xs text-gray-500">보유 쿠폰</p>
          <p class="text-lg font-bold text-gray-800"><span id="couponCount">0</span>매 남음</p>
        </div>
        <i class="fas fa-ticket-alt text-2xl text-green-500"></i>
      </div>
    </a>
  </div>

  <!-- 주유소 목록 -->
  <div class="px-4">
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-bold text-gray-800">주변 주유소</h2>
      <button onclick="getLocation()" class="text-xs text-green-600 flex items-center gap-1">
        <i class="fas fa-location-dot"></i> 현재 위치
      </button>
    </div>
    <div id="stationList" class="space-y-3">
      <div class="card text-center py-8 text-gray-400">
        <i class="fas fa-map-marker-alt text-3xl mb-2"></i>
        <p class="text-sm">위치 검색 또는 키워드 검색으로<br>주유소를 찾아보세요</p>
      </div>
    </div>
  </div>
</div>

<!-- 하단 네비 -->
<nav class="bottom-nav">
  <a href="/" class="active"><i class="fas fa-home text-xl mb-1"></i>홈</a>
  <a href="/stations"><i class="fas fa-gas-pump text-xl mb-1"></i>주유소</a>
  <a href="/my-coupons"><i class="fas fa-ticket-alt text-xl mb-1"></i>내쿠폰</a>
  <a href="/mypage"><i class="fas fa-user text-xl mb-1"></i>마이</a>
</nav>

<script>
window.onload = async () => {
  const user = getUser();
  if (user) {
    document.getElementById('greeting').textContent = '안녕하세요!';
    document.getElementById('userName').textContent = user.name + '님';
    document.getElementById('myCouponSummary').style.display = 'block';
    loadMyCouponCount();
  }
  loadNearbyStations();
};

async function loadMyCouponCount() {
  try {
    const r = await API.get('/coupons/my');
    const total = r.data.stations.reduce((s, st) => s + (st.remaining_quantity || 0), 0);
    document.getElementById('couponCount').textContent = total;
  } catch {}
}

async function loadNearbyStations(lat, lng) {
  try {
    let url = '/stations/nearby';
    if (lat && lng) url += \`?latitude=\${lat}&longitude=\${lng}\`;
    const r = await API.get(url);
    renderStations(r.data.stations);
  } catch {}
}

function getLocation() {
  if (!navigator.geolocation) return showToast('위치 서비스를 지원하지 않습니다.', '#ef4444');
  navigator.geolocation.getCurrentPosition(
    p => { loadNearbyStations(p.coords.latitude, p.coords.longitude); showToast('위치를 가져왔습니다.', '#10b981'); },
    () => showToast('위치 권한이 필요합니다.', '#ef4444')
  );
}

function searchStations() {
  const kw = document.getElementById('searchInput').value.trim();
  if (!kw) return;
  API.get(\`/stations/nearby?keyword=\${encodeURIComponent(kw)}\`)
    .then(r => renderStations(r.data.stations))
    .catch(() => showToast('검색 중 오류가 발생했습니다.', '#ef4444'));
}

function renderStations(stations) {
  const el = document.getElementById('stationList');
  if (!stations.length) {
    el.innerHTML = '<div class="card text-center py-8 text-gray-400"><i class="fas fa-search text-3xl mb-2"></i><p class="text-sm">검색 결과가 없습니다</p></div>';
    return;
  }
  el.innerHTML = stations.map(s => \`
    <a href="/stations/\${s.id}" class="card block fade-in">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="font-semibold text-gray-800">\${s.station_name}</h3>
          <p class="text-xs text-gray-500 mt-1">\${s.address}</p>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
              쿠폰 \${s.coupon_count || 0}종
            </span>
            \${s.distance ? \`<span class="text-xs text-gray-400">\${s.distance.toFixed(1)}km</span>\` : ''}
          </div>
        </div>
        <i class="fas fa-chevron-right text-gray-300 mt-1"></i>
      </div>
    </a>
  \`).join('');
}
</script>
` + foot()
}

function loginPage(): string {
  return head('로그인') + `
<div class="min-h-screen flex flex-col px-4 py-8">
  <div class="mb-8">
    <h1 class="text-2xl font-bold text-gray-800">로그인</h1>
    <p class="text-gray-500 text-sm mt-1">EV-Wash에 오신 것을 환영합니다</p>
  </div>

  <form id="loginForm" onsubmit="doLogin(event)" class="space-y-4">
    <input id="email" type="email" placeholder="이메일" class="input-field" required>
    <input id="password" type="password" placeholder="비밀번호" class="input-field" required>
    <button type="submit" class="btn-primary">로그인</button>
  </form>

  <div class="my-6 flex items-center gap-3">
    <div class="flex-1 h-px bg-gray-200"></div>
    <span class="text-xs text-gray-400">또는</span>
    <div class="flex-1 h-px bg-gray-200"></div>
  </div>

  <div class="space-y-3">
    <button onclick="kakaoLogin()" class="w-full flex items-center justify-center gap-2 bg-yellow-400 text-yellow-900 py-3 rounded-xl font-semibold">
      <i class="fas fa-comment-dots"></i> 카카오로 로그인
    </button>
    <button onclick="naverLogin()" class="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-xl font-semibold">
      <span class="font-bold">N</span> 네이버로 로그인
    </button>
  </div>

  <div class="mt-6 text-center space-y-2">
    <p class="text-sm text-gray-500">
      계정이 없으신가요? 
      <a href="/register" class="ev-green font-semibold">회원가입</a>
    </p>
    <p class="text-sm text-gray-500">
      주유소 사장님이신가요? 
      <a href="/owner/login" class="ev-green font-semibold">사장님 로그인</a>
    </p>
  </div>
</div>
<script>
async function doLogin(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = '로그인 중...';
  try {
    const r = await API.post('/auth/login', { email: document.getElementById('email').value, password: document.getElementById('password').value });
    localStorage.setItem('ev_token', r.data.token);
    localStorage.setItem('ev_user', JSON.stringify(r.data.user));
    if (r.data.user.userType === 'admin') window.location.href = '/admin';
    else if (r.data.user.userType === 'station_owner') window.location.href = '/owner';
    else window.location.href = '/';
  } catch (err) {
    showToast(err.response?.data?.error || '로그인 실패', '#ef4444');
    btn.disabled = false; btn.textContent = '로그인';
  }
}
function kakaoLogin() {
  const key = window.__kakaoKey || 'KAKAO_API_KEY_PLACEHOLDER';
  const redirect = encodeURIComponent(window.location.origin + '/api/auth/kakao/callback');
  window.open(\`https://kauth.kakao.com/oauth/authorize?client_id=\${key}&redirect_uri=\${redirect}&response_type=code\`, 'kakao_login', 'width=500,height=600');
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'social_login') {
      localStorage.setItem('ev_token', e.data.token);
      localStorage.setItem('ev_user', JSON.stringify(e.data.user));
      window.location.href = '/';
    }
  }, { once: true });
}
function naverLogin() {
  const state = Math.random().toString(36).substring(2);
  const redirect = encodeURIComponent(window.location.origin + '/api/auth/naver/callback');
  window.open(\`https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=NAVER_CLIENT_ID_PLACEHOLDER&redirect_uri=\${redirect}&state=\${state}\`, 'naver_login', 'width=500,height=600');
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'social_login') {
      localStorage.setItem('ev_token', e.data.token);
      localStorage.setItem('ev_user', JSON.stringify(e.data.user));
      window.location.href = '/';
    }
  }, { once: true });
}
</script>
` + foot()
}

function registerPage(): string {
  return head('회원가입') + `
<div class="min-h-screen px-4 py-8">
  <a href="/login" class="text-gray-500 text-sm flex items-center gap-1 mb-6">
    <i class="fas fa-arrow-left"></i> 뒤로
  </a>
  <h1 class="text-2xl font-bold text-gray-800 mb-6">회원가입</h1>

  <form id="regForm" onsubmit="doRegister(event)" class="space-y-4">
    <div>
      <label class="text-xs text-gray-500 mb-1 block">회원 유형</label>
      <select id="userType" class="input-field">
        <option value="customer">고객 (세차 쿠폰 구매)</option>
        <option value="station_owner">주유소 사장님</option>
      </select>
    </div>
    <input id="name" type="text" placeholder="이름" class="input-field" required>
    <input id="email" type="email" placeholder="이메일" class="input-field" required>
    <input id="phone" type="tel" placeholder="휴대폰번호 (선택)" class="input-field">
    <input id="password" type="password" placeholder="비밀번호 (8자 이상)" class="input-field" required minlength="8">
    <input id="password2" type="password" placeholder="비밀번호 확인" class="input-field" required>
    <button type="submit" class="btn-primary">가입하기</button>
  </form>

  <p class="text-center text-sm text-gray-500 mt-4">
    이미 계정이 있으신가요? <a href="/login" class="ev-green font-semibold">로그인</a>
  </p>
</div>
<script>
async function doRegister(e) {
  e.preventDefault();
  if (document.getElementById('password').value !== document.getElementById('password2').value) {
    return showToast('비밀번호가 일치하지 않습니다.', '#ef4444');
  }
  try {
    const r = await API.post('/auth/register', {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value || undefined,
      password: document.getElementById('password').value,
      userType: document.getElementById('userType').value,
    });
    localStorage.setItem('ev_token', r.data.token);
    localStorage.setItem('ev_user', JSON.stringify(r.data.user));
    const type = r.data.user.userType;
    showToast('가입되었습니다!', '#10b981');
    setTimeout(() => { window.location.href = type === 'station_owner' ? '/owner' : '/'; }, 800);
  } catch (err) {
    showToast(err.response?.data?.error || '가입 실패', '#ef4444');
  }
}
</script>
` + foot()
}

function stationListPage(): string {
  return head('주유소 검색') + `
<div class="min-h-screen pb-20">
  <div class="bg-white sticky top-0 z-10 px-4 py-3 border-b">
    <div class="relative">
      <input id="searchInput" type="text" placeholder="지역 또는 주유소명으로 검색" 
        class="w-full px-4 py-3 pl-10 bg-gray-100 rounded-xl text-sm outline-none"
        oninput="debounceSearch()" onkeypress="if(event.key==='Enter') searchStations()">
      <i class="fas fa-search absolute left-3 top-3.5 text-gray-400 text-sm"></i>
    </div>
  </div>

  <div class="p-4">
    <button onclick="getLocation()" class="w-full flex items-center justify-center gap-2 border border-green-500 text-green-600 py-2.5 rounded-xl text-sm font-medium mb-4">
      <i class="fas fa-location-dot"></i> 현재 위치로 검색
    </button>
    <div id="stationList" class="space-y-3"></div>
  </div>
</div>

<nav class="bottom-nav">
  <a href="/"><i class="fas fa-home text-xl mb-1"></i>홈</a>
  <a href="/stations" class="active"><i class="fas fa-gas-pump text-xl mb-1"></i>주유소</a>
  <a href="/my-coupons"><i class="fas fa-ticket-alt text-xl mb-1"></i>내쿠폰</a>
  <a href="/mypage"><i class="fas fa-user text-xl mb-1"></i>마이</a>
</nav>

<script>
let debounceTimer;
function debounceSearch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(searchStations, 400); }

async function searchStations() {
  const kw = document.getElementById('searchInput').value.trim();
  const r = await API.get('/stations/nearby' + (kw ? '?keyword=' + encodeURIComponent(kw) : ''));
  renderStations(r.data.stations);
}

function getLocation() {
  navigator.geolocation?.getCurrentPosition(p => {
    API.get(\`/stations/nearby?latitude=\${p.coords.latitude}&longitude=\${p.coords.longitude}\`)
      .then(r => renderStations(r.data.stations));
  }, () => showToast('위치 권한이 필요합니다.', '#ef4444'));
}

function renderStations(stations) {
  const el = document.getElementById('stationList');
  if (!stations?.length) {
    el.innerHTML = '<div class="text-center py-12 text-gray-400"><i class="fas fa-gas-pump text-4xl mb-3"></i><p>검색 결과가 없습니다</p></div>';
    return;
  }
  el.innerHTML = stations.map(s => \`
    <a href="/stations/\${s.id}" class="card block">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-gray-800">\${s.station_name}</h3>
            <span class="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">\${s.car_wash_type === 'automatic' ? '자동' : s.car_wash_type === 'self' ? '셀프' : '자동+셀프'}</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">\${s.address}</p>
          <p class="text-xs font-medium text-green-600 mt-1">쿠폰 \${s.coupon_count || 0}종 판매중</p>
        </div>
        \${s.distance ? \`<span class="text-xs text-gray-400">\${s.distance.toFixed(1)}km</span>\` : ''}
      </div>
    </a>
  \`).join('');
}
window.onload = () => searchStations();
</script>
` + foot()
}

function stationDetailPage(): string {
  return head('주유소 상세') + `
<div class="min-h-screen pb-8">
  <div class="bg-white sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3">
    <button onclick="history.back()" class="text-gray-500"><i class="fas fa-arrow-left"></i></button>
    <h1 id="pageTitle" class="font-bold text-gray-800">주유소 정보</h1>
  </div>

  <div id="content" class="p-4 space-y-4">
    <div class="text-center py-12"><i class="fas fa-spinner fa-spin text-green-500 text-2xl"></i></div>
  </div>
</div>
<script>
const stationId = location.pathname.split('/').pop();
window.onload = async () => {
  try {
    const [stationRes, couponsRes] = await Promise.all([
      API.get(\`/stations/\${stationId}/info\`),
      API.get(\`/stations/\${stationId}/coupons\`),
    ]);
    const s = stationRes.data.station;
    const coupons = couponsRes.data.coupons;
    document.getElementById('pageTitle').textContent = s.station_name;
    document.getElementById('content').innerHTML = \`
      <div class="card">
        <h2 class="font-bold text-lg text-gray-800">\${s.station_name}</h2>
        <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">
          <i class="fas fa-map-marker-alt text-green-500"></i> \${s.address}
        </p>
        \${s.phone ? \`<p class="text-sm text-gray-500 mt-1 flex items-center gap-1"><i class="fas fa-phone text-green-500"></i> \${s.phone}</p>\` : ''}
        <span class="inline-block mt-2 text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
          \${s.car_wash_type === 'automatic' ? '🚗 자동 세차기' : s.car_wash_type === 'self' ? '💧 셀프 세차' : '🚗 자동+셀프'}
        </span>
      </div>

      <h3 class="font-bold text-gray-800">판매 중인 쿠폰</h3>
      \${coupons.length ? coupons.map(c => \`
        <div class="card">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h4 class="font-semibold text-gray-800">\${c.title}</h4>
              \${c.description ? \`<p class="text-xs text-gray-400 mt-0.5">\${c.description}</p>\` : ''}
              <div class="flex items-center gap-2 mt-2">
                <span class="text-lg font-bold text-green-600">\${formatPrice(c.discount_price)}</span>
                <span class="text-sm text-gray-400 line-through">\${formatPrice(c.original_price)}</span>
                <span class="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded">
                  \${Math.round((1 - c.discount_price/c.original_price)*100)}% 할인
                </span>
              </div>
              <p class="text-xs text-gray-400 mt-1">\${c.wash_count}회 이용권\${c.valid_days ? \` · 구매 후 \${c.valid_days}일 유효\` : ' · 기간 무제한'}</p>
            </div>
          </div>
          <button onclick="buyCoupon(\${c.id}, \${c.discount_price}, '\${c.title}')" 
            class="btn-primary mt-3" style="padding:10px">
            구매하기
          </button>
        </div>
      \`).join('') : '<div class="card text-center py-8 text-gray-400">판매 중인 쿠폰이 없습니다</div>'}
    \`;
  } catch(e) {
    document.getElementById('content').innerHTML = '<div class="card text-center py-8 text-gray-400">정보를 불러올 수 없습니다.</div>';
  }
};

async function buyCoupon(couponId, price, title) {
  const user = getUser();
  if (!user) return window.location.href = '/login';
  
  const qty = parseInt(prompt(\`구매 수량을 입력하세요 (1매 = \${formatPrice(price)})\`, '1') || '0');
  if (!qty || qty < 1) return;
  
  try {
    const r = await API.post('/coupons/buy', { couponId, quantity: qty });
    const d = r.data;
    // 토스페이먼츠 결제창 호출
    if (d.clientKey && d.clientKey !== 'test_ck_placeholder') {
      const tossPayments = await loadTossPayments(d.clientKey);
      await tossPayments.requestPayment('카드', {
        amount: d.amount,
        orderId: d.orderId,
        orderName: d.orderName,
        customerName: d.customerName,
        successUrl: d.successUrl,
        failUrl: d.failUrl,
      });
    } else {
      showToast('결제 키가 설정되지 않았습니다. (테스트 환경)', '#f59e0b');
    }
  } catch (err) {
    showToast(err.response?.data?.error || '결제 준비 실패', '#ef4444');
  }
}
</script>
` + foot()
}

function myCouponsPage(): string {
  return head('내 쿠폰') + `
<div class="min-h-screen pb-20">
  <div class="bg-white sticky top-0 z-10 px-4 py-3 border-b">
    <h1 class="font-bold text-gray-800 text-lg">내 쿠폰</h1>
  </div>
  <div id="content" class="p-4 space-y-3">
    <div class="text-center py-12"><i class="fas fa-spinner fa-spin text-green-500 text-2xl"></i></div>
  </div>
</div>
<nav class="bottom-nav">
  <a href="/"><i class="fas fa-home text-xl mb-1"></i>홈</a>
  <a href="/stations"><i class="fas fa-gas-pump text-xl mb-1"></i>주유소</a>
  <a href="/my-coupons" class="active"><i class="fas fa-ticket-alt text-xl mb-1"></i>내쿠폰</a>
  <a href="/mypage"><i class="fas fa-user text-xl mb-1"></i>마이</a>
</nav>
<script>
window.onload = async () => {
  const user = getUser();
  if (!user) return window.location.href = '/login';
  try {
    const r = await API.get('/coupons/my');
    const stations = r.data.stations;
    const el = document.getElementById('content');
    if (!stations.length) {
      el.innerHTML = '<div class="card text-center py-12 text-gray-400"><i class="fas fa-ticket-alt text-4xl mb-3"></i><p>보유 쿠폰이 없습니다</p><a href="/stations" class="btn-primary mt-4" style="display:inline-block;width:auto;padding:10px 20px">주유소 찾기</a></div>';
      return;
    }
    el.innerHTML = stations.map(s => \`
      <a href="/my-coupons/\${s.station_id}" class="card block">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-gray-800">\${s.station_name}</h3>
            <p class="text-xs text-gray-400 mt-0.5">\${s.address}</p>
            <div class="flex gap-3 mt-2 text-xs">
              <span class="text-green-600 font-bold">\${s.remaining_quantity}매 남음</span>
              <span class="text-gray-400">사용 \${s.used_quantity}매</span>
            </div>
          </div>
          <i class="fas fa-chevron-right text-gray-300"></i>
        </div>
      </a>
    \`).join('');
  } catch { window.location.href = '/login'; }
};
</script>
` + foot()
}

function myCouponsDetailPage(): string {
  return head('쿠폰 사용') + `
<div class="min-h-screen pb-8">
  <div class="bg-white sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3">
    <button onclick="history.back()"><i class="fas fa-arrow-left text-gray-500"></i></button>
    <h1 id="stationName" class="font-bold text-gray-800">쿠폰 사용</h1>
  </div>
  <div id="content" class="p-4 space-y-3">
    <div class="text-center py-12"><i class="fas fa-spinner fa-spin text-green-500 text-2xl"></i></div>
  </div>
</div>

<!-- QR 스캔 모달 -->
<div id="qrModal" class="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center" style="display:none!important">
  <div class="bg-white rounded-2xl p-6 w-80 text-center">
    <h3 class="font-bold text-gray-800 mb-2">QR 코드 스캔</h3>
    <p class="text-sm text-gray-500 mb-4">세차기 앞의 QR 코드를 스캔하세요</p>
    <div id="qrReader" class="w-full" style="height:250px"></div>
    <button onclick="closeQR()" class="btn-outline mt-4" style="padding:10px">취소</button>
  </div>
</div>

<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
<script>
const stationId = location.pathname.split('/').pop();
let selectedPurchase = null;
let html5QrScanner = null;

window.onload = async () => {
  const user = getUser();
  if (!user) return window.location.href = '/login';
  try {
    const [stationRes, purchasesRes] = await Promise.all([
      API.get(\`/stations/\${stationId}/info\`),
      API.get(\`/coupons/my/\${stationId}\`),
    ]);
    document.getElementById('stationName').textContent = stationRes.data.station.station_name;
    const purchases = purchasesRes.data.purchases;
    const el = document.getElementById('content');
    el.innerHTML = \`
      <div class="card bg-green-50 border border-green-200">
        <p class="text-sm text-green-700 flex items-center gap-2">
          <i class="fas fa-info-circle"></i>
          쿠폰 선택 후 [사용하기]를 누르면 카메라가 열립니다
        </p>
      </div>
      \${purchases.map(p => \`
        <div class="card cursor-pointer border-2 \${selectedPurchase?.id === p.id ? 'border-green-500' : 'border-transparent'}" 
          onclick="selectPurchase(\${JSON.stringify(p).replace(/"/g,'&quot;')})">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-semibold text-gray-800">\${p.title}</h4>
              <p class="text-xs text-gray-400">\${p.wash_count}회권 · 잔여 \${p.quantity - p.used_quantity}매</p>
            </div>
            <span class="text-green-600 font-bold text-lg">\${p.quantity - p.used_quantity}매</span>
          </div>
        </div>
      \`).join('')}
      <button onclick="startQRScan()" class="btn-primary" id="useBtn" disabled style="opacity:0.5">
        <i class="fas fa-qrcode mr-2"></i> 사용하기 (QR 스캔)
      </button>
    \`;
  } catch { window.location.href = '/login'; }
};

function selectPurchase(p) {
  selectedPurchase = p;
  document.querySelectorAll('.card').forEach(c => c.classList.replace('border-green-500','border-transparent'));
  event.currentTarget.classList.replace('border-transparent','border-green-500');
  const btn = document.getElementById('useBtn');
  btn.disabled = false; btn.style.opacity = '1';
}

function startQRScan() {
  if (!selectedPurchase) return;
  const modal = document.getElementById('qrModal');
  modal.style.display = 'flex';
  html5QrScanner = new Html5Qrcode('qrReader');
  html5QrScanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 220, height: 220 } },
    async (decodedText) => {
      await html5QrScanner.stop();
      modal.style.display = 'none';
      await useCoupon(decodedText);
    },
    () => {}
  ).catch(err => { showToast('카메라 접근 권한이 필요합니다.', '#ef4444'); modal.style.display = 'none'; });
}

function closeQR() {
  if (html5QrScanner) html5QrScanner.stop().catch(() => {});
  document.getElementById('qrModal').style.display = 'none';
}

async function useCoupon(qrData) {
  try {
    const r = await API.post('/coupons/use', {
      couponId: selectedPurchase.coupon_id,
      stationId: parseInt(stationId),
      qrData,
    });
    showToast('✅ 쿠폰이 사용되었습니다!', '#10b981');
    setTimeout(() => location.reload(), 1500);
  } catch (err) {
    showToast(err.response?.data?.error || '쿠폰 사용 실패', '#ef4444');
  }
}
</script>
` + foot()
}

function paymentSuccessPage(): string {
  return head('결제 완료') + `
<div class="min-h-screen flex flex-col items-center justify-center p-8 text-center">
  <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
    <i class="fas fa-check text-green-500 text-3xl"></i>
  </div>
  <h1 class="text-2xl font-bold text-gray-800 mb-2">결제 완료!</h1>
  <p class="text-gray-500 mb-8">쿠폰이 발급되었습니다</p>
  <a href="/my-coupons" class="btn-primary" style="max-width:280px">내 쿠폰 확인</a>
  <a href="/" class="btn-outline mt-3" style="max-width:280px">홈으로</a>
</div>
` + foot()
}

function paymentFailPage(): string {
  return head('결제 실패') + `
<div class="min-h-screen flex flex-col items-center justify-center p-8 text-center">
  <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
    <i class="fas fa-times text-red-500 text-3xl"></i>
  </div>
  <h1 class="text-2xl font-bold text-gray-800 mb-2">결제 실패</h1>
  <p id="failMsg" class="text-gray-500 mb-8">결제가 취소되었습니다</p>
  <a href="/stations" class="btn-primary" style="max-width:280px">다시 시도</a>
</div>
<script>
const msg = new URLSearchParams(location.search).get('message');
if (msg) document.getElementById('failMsg').textContent = decodeURIComponent(msg);
</script>
` + foot()
}

function myPage(): string {
  return head('마이페이지') + `
<div class="min-h-screen pb-20">
  <div class="ev-bg text-white px-4 pt-12 pb-8">
    <div id="userInfo" class="text-center">
      <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
        <i class="fas fa-user text-2xl text-white"></i>
      </div>
      <h2 id="userName" class="text-xl font-bold">로그인이 필요합니다</h2>
      <p id="userEmail" class="text-sm opacity-80 mt-1"></p>
    </div>
  </div>

  <div class="p-4 space-y-2" id="menuList">
    <a href="/login" class="card block flex items-center gap-3 text-gray-700">
      <i class="fas fa-sign-in-alt w-5 text-green-500"></i> 로그인 / 회원가입
    </a>
  </div>
</div>

<nav class="bottom-nav">
  <a href="/"><i class="fas fa-home text-xl mb-1"></i>홈</a>
  <a href="/stations"><i class="fas fa-gas-pump text-xl mb-1"></i>주유소</a>
  <a href="/my-coupons"><i class="fas fa-ticket-alt text-xl mb-1"></i>내쿠폰</a>
  <a href="/mypage" class="active"><i class="fas fa-user text-xl mb-1"></i>마이</a>
</nav>

<script>
window.onload = async () => {
  const user = getUser();
  if (!user) return;
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userEmail').textContent = user.email || '';
  document.getElementById('menuList').innerHTML = \`
    <a href="/my-coupons" class="card flex items-center justify-between text-gray-700">
      <div class="flex items-center gap-3"><i class="fas fa-ticket-alt w-5 text-green-500"></i> 내 쿠폰</div>
      <i class="fas fa-chevron-right text-gray-300"></i>
    </a>
    <a href="/my-coupons" class="card flex items-center justify-between text-gray-700">
      <div class="flex items-center gap-3"><i class="fas fa-receipt w-5 text-green-500"></i> 구매 내역</div>
      <i class="fas fa-chevron-right text-gray-300"></i>
    </a>
    <a href="/cs" class="card flex items-center justify-between text-gray-700">
      <div class="flex items-center gap-3"><i class="fas fa-headset w-5 text-green-500"></i> 고객센터</div>
      <i class="fas fa-chevron-right text-gray-300"></i>
    </a>
    <button onclick="logout()" class="card w-full flex items-center gap-3 text-red-500 text-left">
      <i class="fas fa-sign-out-alt w-5"></i> 로그아웃
    </button>
  \`;
};
</script>
` + foot()
}

function csPage(): string {
  return head('고객센터') + `
<div class="min-h-screen px-4 py-6">
  <div class="flex items-center gap-3 mb-6">
    <button onclick="history.back()"><i class="fas fa-arrow-left text-gray-500"></i></button>
    <h1 class="font-bold text-gray-800 text-lg">고객센터</h1>
  </div>

  <div class="card mb-4 bg-green-50 border border-green-200">
    <p class="text-sm text-green-700"><i class="fas fa-envelope mr-2"></i>문의는 이메일로 접수되며 영업일 기준 1~2일 내 답변드립니다.</p>
  </div>

  <form onsubmit="submitCS(event)" class="space-y-4">
    <select id="csType" class="input-field">
      <option value="결제/환불">결제/환불 문의</option>
      <option value="쿠폰사용">쿠폰 사용 문의</option>
      <option value="주유소">주유소 관련</option>
      <option value="기타">기타</option>
    </select>
    <input id="csName" type="text" placeholder="이름" class="input-field" required>
    <input id="csEmail" type="email" placeholder="이메일 (답변 받을 주소)" class="input-field" required>
    <textarea id="csMsg" placeholder="문의 내용을 작성해주세요" class="input-field" rows="5" required style="resize:vertical"></textarea>
    <button type="submit" class="btn-primary">문의 보내기</button>
  </form>
</div>
<script>
window.onload = () => {
  const user = getUser();
  if (user) {
    if (document.getElementById('csName')) document.getElementById('csName').value = user.name || '';
    if (document.getElementById('csEmail')) document.getElementById('csEmail').value = user.email || '';
  }
};
async function submitCS(e) {
  e.preventDefault();
  try {
    const user = getUser();
    const data = { name: document.getElementById('csName').value, email: document.getElementById('csEmail').value, type: document.getElementById('csType').value, message: document.getElementById('csMsg').value };
    if (user) await API.post('/user/cs', { type: data.type, message: data.message });
    else await API.post('/user/cs/anonymous', data);
    showToast('문의가 접수되었습니다.', '#10b981');
    e.target.reset();
  } catch { showToast('전송 실패. 다시 시도해주세요.', '#ef4444'); }
}
</script>
` + foot()
}

// ============ 사장님 페이지들 ============

function ownerLoginPage(): string {
  return head('사장님 로그인') + `
<div class="min-h-screen flex flex-col px-4 py-8">
  <div class="mb-8">
    <div class="w-12 h-12 ev-bg rounded-xl flex items-center justify-center mb-4">
      <i class="fas fa-gas-pump text-white text-xl"></i>
    </div>
    <h1 class="text-2xl font-bold text-gray-800">사장님 로그인</h1>
    <p class="text-gray-500 text-sm mt-1">주유소 관리 대시보드</p>
  </div>

  <form onsubmit="doLogin(event)" class="space-y-4">
    <input id="email" type="email" placeholder="이메일" class="input-field" required>
    <input id="password" type="password" placeholder="비밀번호" class="input-field" required>
    <button type="submit" class="btn-primary">로그인</button>
  </form>

  <div class="mt-6 text-center">
    <p class="text-sm text-gray-500">
      계정이 없으신가요? 
      <a href="/owner/register" class="ev-green font-semibold">사장님 회원가입</a>
    </p>
    <p class="text-sm text-gray-500 mt-2">
      고객이신가요? 
      <a href="/login" class="ev-green font-semibold">고객 로그인</a>
    </p>
  </div>
</div>
<script>
async function doLogin(e) {
  e.preventDefault();
  try {
    const r = await API.post('/auth/login', { email: document.getElementById('email').value, password: document.getElementById('password').value });
    if (r.data.user.userType !== 'station_owner' && r.data.user.userType !== 'admin') {
      return showToast('사장님 계정으로 로그인해주세요.', '#ef4444');
    }
    localStorage.setItem('ev_token', r.data.token);
    localStorage.setItem('ev_user', JSON.stringify(r.data.user));
    window.location.href = r.data.user.userType === 'admin' ? '/admin' : '/owner';
  } catch (err) { showToast(err.response?.data?.error || '로그인 실패', '#ef4444'); }
}
</script>
` + foot()
}

function ownerRegisterPage(): string {
  return head('사장님 회원가입') + `
<div class="min-h-screen px-4 py-8">
  <a href="/owner/login" class="text-gray-500 text-sm flex items-center gap-1 mb-6">
    <i class="fas fa-arrow-left"></i> 뒤로
  </a>
  <h1 class="text-2xl font-bold text-gray-800 mb-6">사장님 회원가입</h1>
  <form onsubmit="doRegister(event)" class="space-y-4">
    <input id="name" type="text" placeholder="이름" class="input-field" required>
    <input id="email" type="email" placeholder="이메일" class="input-field" required>
    <input id="phone" type="tel" placeholder="휴대폰번호" class="input-field" required>
    <input id="password" type="password" placeholder="비밀번호 (8자 이상)" class="input-field" required minlength="8">
    <input id="password2" type="password" placeholder="비밀번호 확인" class="input-field" required>
    <button type="submit" class="btn-primary">가입하기</button>
  </form>
</div>
<script>
async function doRegister(e) {
  e.preventDefault();
  if (document.getElementById('password').value !== document.getElementById('password2').value) return showToast('비밀번호가 일치하지 않습니다.', '#ef4444');
  try {
    const r = await API.post('/auth/register', { name: document.getElementById('name').value, email: document.getElementById('email').value, phone: document.getElementById('phone').value, password: document.getElementById('password').value, userType: 'station_owner' });
    localStorage.setItem('ev_token', r.data.token);
    localStorage.setItem('ev_user', JSON.stringify(r.data.user));
    window.location.href = '/owner';
  } catch (err) { showToast(err.response?.data?.error || '가입 실패', '#ef4444'); }
}
</script>
` + foot()
}

function ownerDashboardPage(): string {
  return head('사장님 대시보드') + `
<div class="min-h-screen bg-gray-50">
  <!-- 헤더 -->
  <div class="ev-bg text-white px-4 pt-10 pb-6">
    <div class="flex items-center justify-between mb-4">
      <div>
        <p class="text-sm opacity-80">사장님 대시보드</p>
        <h1 id="ownerName" class="text-xl font-bold">EV-Wash</h1>
      </div>
      <button onclick="logout()" class="text-white text-sm opacity-80">로그아웃</button>
    </div>
  </div>

  <div class="p-4 space-y-4" id="dashContent">
    <div class="text-center py-12"><i class="fas fa-spinner fa-spin text-green-500 text-2xl"></i></div>
  </div>
</div>
<script>
window.onload = async () => {
  const user = getUser();
  if (!user) return window.location.href = '/owner/login';
  if (user.userType !== 'station_owner') return window.location.href = '/';
  document.getElementById('ownerName').textContent = user.name + '님';
  
  try {
    const r = await API.get('/stations/owner/stations');
    const stations = r.data.stations;
    const appsR = await API.get('/stations/owner/applications');
    const apps = appsR.data.applications;
    
    const el = document.getElementById('dashContent');
    
    if (!stations.length) {
      // 신청 없거나 대기 중
      const pending = apps.filter(a => a.status === 'pending');
      const rejected = apps.filter(a => a.status === 'rejected');
      
      el.innerHTML = \`
        \${pending.length ? \`
          <div class="card bg-yellow-50 border border-yellow-200">
            <div class="flex items-center gap-3">
              <i class="fas fa-clock text-yellow-500 text-xl"></i>
              <div>
                <p class="font-semibold text-gray-800">승인 대기 중</p>
                <p class="text-sm text-gray-500">\${pending[0].station_name} 등록 신청이 검토 중입니다</p>
              </div>
            </div>
          </div>
        \` : ''}
        \${rejected.length ? \`
          <div class="card bg-red-50 border border-red-200">
            <p class="font-semibold text-red-700">신청 거절됨</p>
            <p class="text-sm text-gray-600 mt-1">\${rejected[0].rejection_reason || '거절 사유 없음'}</p>
          </div>
        \` : ''}
        <div class="card text-center py-8">
          <i class="fas fa-gas-pump text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-500 mb-4">등록된 주유소가 없습니다</p>
          <a href="/owner/apply" class="btn-primary" style="max-width:200px;display:inline-block">주유소 등록 신청</a>
        </div>
      \`;
    } else {
      el.innerHTML = \`
        <h2 class="font-bold text-gray-800">내 주유소</h2>
        \${stations.map(s => \`
          <div class="card">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-bold text-gray-800">\${s.station_name}</h3>
                <p class="text-xs text-gray-400 mt-0.5">\${s.address}</p>
              </div>
              <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">운영중</span>
            </div>
            <div class="grid grid-cols-2 gap-2 mt-3">
              <a href="/owner/stations/\${s.id}" class="btn-primary text-center text-sm py-2" style="padding:8px">대시보드</a>
              <a href="/owner/stations/\${s.id}/qr" class="btn-outline text-center text-sm py-2" style="padding:8px">QR 코드</a>
            </div>
          </div>
        \`).join('')}
        <a href="/owner/apply" class="block text-center text-sm text-green-600 mt-2">+ 새 주유소 등록</a>
      \`;
    }
  } catch { window.location.href = '/owner/login'; }
};
</script>
` + foot()
}

function ownerApplyPage(): string {
  return head('주유소 등록 신청') + `
<div class="min-h-screen px-4 py-6">
  <div class="flex items-center gap-3 mb-6">
    <button onclick="history.back()"><i class="fas fa-arrow-left text-gray-500"></i></button>
    <h1 class="font-bold text-gray-800 text-lg">주유소 등록 신청</h1>
  </div>

  <form onsubmit="submitApply(event)" class="space-y-4">
    <div>
      <label class="text-xs text-gray-500 mb-1 block">주유소명 *</label>
      <input id="station_name" type="text" class="input-field" required placeholder="예: OO주유소">
    </div>
    <div>
      <label class="text-xs text-gray-500 mb-1 block">주소 *</label>
      <input id="address" type="text" class="input-field" required placeholder="도로명 주소">
    </div>
    <div>
      <label class="text-xs text-gray-500 mb-1 block">전화번호 *</label>
      <input id="phone" type="tel" class="input-field" required placeholder="주유소 전화번호">
    </div>
    <div>
      <label class="text-xs text-gray-500 mb-1 block">세차 유형 *</label>
      <select id="car_wash_type" class="input-field">
        <option value="automatic">자동 세차기</option>
        <option value="self">셀프 세차</option>
        <option value="both">자동 + 셀프</option>
      </select>
    </div>
    <div>
      <label class="text-xs text-gray-500 mb-1 block">사업자등록번호 *</label>
      <input id="business_registration" type="text" class="input-field" required placeholder="000-00-00000">
    </div>
    <div>
      <label class="text-xs text-gray-500 mb-1 block">은행명</label>
      <input id="bank_name" type="text" class="input-field" placeholder="예: 국민은행">
    </div>
    <div>
      <label class="text-xs text-gray-500 mb-1 block">계좌번호</label>
      <input id="bank_account" type="text" class="input-field" placeholder="계좌번호">
    </div>
    <div>
      <label class="text-xs text-gray-500 mb-1 block">예금주</label>
      <input id="bank_holder" type="text" class="input-field" placeholder="예금주명">
    </div>
    <div>
      <label class="text-xs text-gray-500 mb-1 block">사업자등록증 (이미지)</label>
      <input id="business_doc" type="file" accept="image/*,.pdf" class="input-field">
    </div>
    <div>
      <label class="text-xs text-gray-500 mb-1 block">계좌 사본 (이미지)</label>
      <input id="account_doc" type="file" accept="image/*" class="input-field">
    </div>
    <button type="submit" class="btn-primary">신청하기</button>
  </form>
</div>
<script>
const user = getUser();
if (!user) window.location.href = '/owner/login';

async function submitApply(e) {
  e.preventDefault();
  try {
    const r = await API.post('/stations/owner/apply', {
      station_name: document.getElementById('station_name').value,
      address: document.getElementById('address').value,
      phone: document.getElementById('phone').value,
      car_wash_type: document.getElementById('car_wash_type').value,
      business_registration: document.getElementById('business_registration').value,
      bank_name: document.getElementById('bank_name').value,
      bank_account: document.getElementById('bank_account').value,
      bank_holder: document.getElementById('bank_holder').value,
    });

    // 파일 업로드
    const appId = r.data.applicationId;
    const bDoc = document.getElementById('business_doc').files[0];
    const aDoc = document.getElementById('account_doc').files[0];
    if (bDoc || aDoc) {
      const fd = new FormData();
      if (bDoc) fd.append('business_doc', bDoc);
      if (aDoc) fd.append('account_doc', aDoc);
      await axios.post(\`/api/stations/owner/apply/\${appId}/upload\`, fd, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('ev_token'), 'Content-Type': 'multipart/form-data' }
      });
    }

    showToast('신청이 완료되었습니다. 승인까지 1~3 영업일이 소요됩니다.', '#10b981');
    setTimeout(() => window.location.href = '/owner', 2000);
  } catch (err) { showToast(err.response?.data?.error || '신청 실패', '#ef4444'); }
}
</script>
` + foot()
}

function ownerStationPage(): string {
  return head('주유소 관리') + `
<div class="min-h-screen bg-gray-50">
  <div class="bg-white sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3">
    <a href="/owner"><i class="fas fa-arrow-left text-gray-500"></i></a>
    <h1 id="stationName" class="font-bold text-gray-800">주유소 관리</h1>
  </div>

  <!-- 탭 -->
  <div class="bg-white border-b flex overflow-x-auto">
    <button onclick="showTab('stats')" id="tab-stats" class="tab-btn flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 border-green-500 text-green-600">통계</button>
    <button onclick="showTab('coupons')" id="tab-coupons" class="tab-btn flex-shrink-0 px-4 py-3 text-sm font-medium text-gray-500">쿠폰 관리</button>
    <button onclick="showTab('usage')" id="tab-usage" class="tab-btn flex-shrink-0 px-4 py-3 text-sm font-medium text-gray-500">사용 내역</button>
    <button onclick="showTab('settlement')" id="tab-settlement" class="tab-btn flex-shrink-0 px-4 py-3 text-sm font-medium text-gray-500">정산</button>
  </div>

  <div class="p-4" id="tabContent">
    <div class="text-center py-12"><i class="fas fa-spinner fa-spin text-green-500 text-2xl"></i></div>
  </div>
</div>

<script>
const stationId = location.pathname.split('/')[3];
let currentTab = 'stats';

function showTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('border-b-2','border-green-500','text-green-600'); b.classList.add('text-gray-500'); });
  const activeBtn = document.getElementById('tab-' + tab);
  activeBtn.classList.add('border-b-2','border-green-500','text-green-600'); activeBtn.classList.remove('text-gray-500');
  loadTabContent(tab);
}

async function loadTabContent(tab) {
  const el = document.getElementById('tabContent');
  el.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-green-500"></i></div>';
  
  if (tab === 'stats') {
    const r = await API.get(\`/stations/owner/stations/\${stationId}/summary\`);
    const d = r.data;
    document.getElementById('stationName').textContent = d.station.station_name;
    el.innerHTML = \`
      <div class="grid grid-cols-2 gap-3">
        <div class="card text-center">
          <p class="text-xs text-gray-500">오늘 사용</p>
          <p class="text-2xl font-bold text-green-600">\${d.stats.todayUsed}매</p>
        </div>
        <div class="card text-center">
          <p class="text-xs text-gray-500">이번달 매출</p>
          <p class="text-xl font-bold text-gray-800">\${formatPrice(d.stats.monthAmount)}</p>
        </div>
        <div class="card text-center">
          <p class="text-xs text-gray-500">누적 사용</p>
          <p class="text-2xl font-bold text-gray-800">\${d.stats.totalUsed}매</p>
        </div>
        <div class="card text-center">
          <p class="text-xs text-gray-500">정산 대기</p>
          <p class="text-xl font-bold text-yellow-600">\${formatPrice(d.stats.pendingSettlement)}</p>
        </div>
      </div>
      <a href="/owner/stations/\${stationId}/qr" class="btn-outline mt-4 flex items-center justify-center gap-2" style="padding:12px">
        <i class="fas fa-qrcode"></i> QR 코드 보기
      </a>
    \`;
  } else if (tab === 'coupons') {
    const r = await API.get(\`/stations/owner/stations/\${stationId}/coupons\`);
    el.innerHTML = \`
      <button onclick="showCreateCoupon()" class="btn-primary mb-4" style="padding:10px">+ 새 쿠폰 만들기</button>
      <div id="createCouponForm" style="display:none" class="card mb-4 space-y-3">
        <h3 class="font-bold text-gray-800">쿠폰 생성</h3>
        <input id="cTitle" placeholder="쿠폰명" class="input-field">
        <input id="cDesc" placeholder="설명 (선택)" class="input-field">
        <input id="cCount" type="number" placeholder="이용 횟수 (1~10)" class="input-field" min="1" max="10">
        <input id="cOrigPrice" type="number" placeholder="원가 (원)" class="input-field">
        <input id="cDiscPrice" type="number" placeholder="판매가 (원)" class="input-field">
        <input id="cValidDays" type="number" placeholder="유효기간 (일, 비워두면 무제한)" class="input-field">
        <div class="flex gap-2">
          <button onclick="createCoupon()" class="btn-primary" style="padding:10px">저장</button>
          <button onclick="document.getElementById('createCouponForm').style.display='none'" class="btn-outline" style="padding:10px">취소</button>
        </div>
      </div>
      <div class="space-y-3">
        \${r.data.coupons.map(c => \`
          <div class="card">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-semibold text-gray-800">\${c.title}</h4>
                <p class="text-sm text-gray-500 mt-0.5">\${c.wash_count}회권 · \${formatPrice(c.discount_price)} <span class="line-through text-gray-300">\${formatPrice(c.original_price)}</span></p>
                \${c.valid_days ? \`<p class="text-xs text-gray-400">\${c.valid_days}일 유효</p>\` : '<p class="text-xs text-gray-400">무제한</p>'}
              </div>
              <button onclick="toggleCoupon(\${c.id}, \${c.is_active})" class="text-xs px-2 py-1 rounded \${c.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}">
                \${c.is_active ? '판매중' : '중단'}
              </button>
            </div>
          </div>
        \`).join('') || '<p class="text-center text-gray-400 py-8">등록된 쿠폰이 없습니다</p>'}
      </div>
    \`;
  } else if (tab === 'usage') {
    const r = await API.get(\`/stations/owner/stations/\${stationId}/usage\`);
    el.innerHTML = \`
      <h3 class="font-bold text-gray-800 mb-3">최근 사용 내역</h3>
      \${r.data.usages.map(u => \`
        <div class="card mb-2">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-800">\${u.coupon_title}</p>
              <p class="text-xs text-gray-400">\${formatDate(u.used_at)}</p>
            </div>
            <span class="text-green-600 font-bold">\${formatPrice(u.discount_price)}</span>
          </div>
        </div>
      \`).join('') || '<p class="text-center text-gray-400 py-8">사용 내역이 없습니다</p>'}
    \`;
  } else if (tab === 'settlement') {
    const r = await API.get(\`/stations/owner/stations/\${stationId}/settlement\`);
    const d = r.data;
    el.innerHTML = \`
      <div class="card bg-yellow-50 border border-yellow-200 mb-4">
        <p class="text-xs text-yellow-700">정산 대기 현황</p>
        <p class="text-2xl font-bold text-yellow-800 mt-1">\${formatPrice(d.pending.netAmount)}</p>
        <p class="text-xs text-yellow-600">사용 \${d.pending.count}건 · 수수료 \${formatPrice(d.pending.fee)} 제외</p>
      </div>
      <h3 class="font-bold text-gray-800 mb-3">정산 내역</h3>
      \${d.settlements.map(s => \`
        <div class="card mb-2">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-800">\${s.settlement_date}</p>
              <p class="text-xs text-gray-400">사용 \${s.total_used_count}건</p>
            </div>
            <div class="text-right">
              <p class="font-bold text-gray-800">\${formatPrice(s.settlement_amount)}</p>
              <span class="text-xs \${s.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}">\${s.status === 'completed' ? '입금완료' : '대기중'}</span>
            </div>
          </div>
        </div>
      \`).join('') || '<p class="text-center text-gray-400 py-8">정산 내역이 없습니다</p>'}
    \`;
  }
}

function showCreateCoupon() {
  document.getElementById('createCouponForm').style.display = 'block';
}

async function createCoupon() {
  try {
    await API.post(\`/stations/owner/stations/\${stationId}/coupons\`, {
      title: document.getElementById('cTitle').value,
      description: document.getElementById('cDesc').value,
      wash_count: parseInt(document.getElementById('cCount').value),
      original_price: parseInt(document.getElementById('cOrigPrice').value),
      discount_price: parseInt(document.getElementById('cDiscPrice').value),
      valid_days: document.getElementById('cValidDays').value ? parseInt(document.getElementById('cValidDays').value) : null,
    });
    showToast('쿠폰이 생성되었습니다.', '#10b981');
    loadTabContent('coupons');
  } catch (err) { showToast(err.response?.data?.error || '쿠폰 생성 실패', '#ef4444'); }
}

async function toggleCoupon(id, current) {
  await API.patch(\`/stations/owner/coupons/\${id}/toggle\`, { isActive: !current });
  loadTabContent('coupons');
}

window.onload = () => {
  const user = getUser();
  if (!user) window.location.href = '/owner/login';
  loadTabContent('stats');
};
</script>
` + foot()
}

function ownerQRPage(): string {
  return head('QR 코드') + `
<div class="min-h-screen px-4 py-6">
  <div class="flex items-center gap-3 mb-6">
    <button onclick="history.back()"><i class="fas fa-arrow-left text-gray-500"></i></button>
    <h1 class="font-bold text-gray-800 text-lg">QR 코드</h1>
  </div>

  <div id="qrContent" class="text-center">
    <div class="py-12"><i class="fas fa-spinner fa-spin text-green-500 text-2xl"></i></div>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
<script>
const stationId = location.pathname.split('/')[3];
window.onload = async () => {
  try {
    const r = await API.get(\`/stations/owner/stations/\${stationId}/qr\`);
    const el = document.getElementById('qrContent');
    el.innerHTML = \`
      <div class="card max-w-xs mx-auto">
        <canvas id="qrCanvas" class="mx-auto"></canvas>
        <p class="text-xs text-gray-400 mt-3 break-all">\${r.data.qrCode}</p>
      </div>
      <p class="text-sm text-gray-500 mt-4">이 QR 코드를 세차기 앞에 출력하여 부착해주세요</p>
      <button onclick="window.print()" class="btn-primary mt-4" style="max-width:200px">인쇄하기</button>
    \`;
    QRCode.toCanvas(document.getElementById('qrCanvas'), r.data.qrCode, { width: 240, margin: 2 });
  } catch (e) {
    document.getElementById('qrContent').innerHTML = '<p class="text-gray-400">QR 코드를 불러올 수 없습니다.</p>';
  }
};
</script>
` + foot()
}

function ownerMyPage(): string {
  return head('사장님 마이페이지') + `
<div class="min-h-screen px-4 py-6">
  <div class="flex items-center gap-3 mb-6">
    <button onclick="history.back()"><i class="fas fa-arrow-left text-gray-500"></i></button>
    <h1 class="font-bold text-gray-800 text-lg">마이페이지</h1>
  </div>
  <div class="space-y-3">
    <a href="/cs" class="card flex items-center justify-between text-gray-700"><div class="flex items-center gap-3"><i class="fas fa-headset w-5 text-green-500"></i> 고객센터</div><i class="fas fa-chevron-right text-gray-300"></i></a>
    <button onclick="logout()" class="card w-full flex items-center gap-3 text-red-500 text-left"><i class="fas fa-sign-out-alt w-5"></i> 로그아웃</button>
  </div>
</div>
` + foot()
}

// ============ 어드민 페이지들 ============

const adminHead = (title: string) => `
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} - EV-Wash Admin</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .sidebar { width: 220px; min-height: 100vh; background: #111827; }
  .sidebar a { display: flex; align-items: center; gap: 10px; padding: 10px 16px; color: #9ca3af; text-decoration: none; font-size: 14px; border-radius: 6px; margin: 2px 8px; }
  .sidebar a:hover, .sidebar a.active { background: #1f2937; color: white; }
  .sidebar a.active { color: #10b981; }
  .badge { background: #ef4444; color: white; font-size: 10px; padding: 1px 6px; border-radius: 99px; }
  .card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .stat-card { background: white; border-radius: 10px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
  .btn { padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; font-weight: 500; border: none; }
  .btn-green { background: #10b981; color: white; }
  .btn-red { background: #ef4444; color: white; }
  .btn-gray { background: #f3f4f6; color: #374151; }
  .btn-yellow { background: #f59e0b; color: white; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f9fafb; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; border-bottom: 1px solid #f3f4f6; }
  td { padding: 12px; font-size: 13px; color: #374151; border-bottom: 1px solid #f9fafb; }
  tr:hover td { background: #fafafa; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 500; }
  .tag-green { background: #dcfce7; color: #16a34a; }
  .tag-yellow { background: #fef3c7; color: #d97706; }
  .tag-red { background: #fee2e2; color: #dc2626; }
  .tag-gray { background: #f3f4f6; color: #6b7280; }
  .toast { position: fixed; top: 20px; right: 20px; background: #1f2937; color: white; padding: 12px 20px; border-radius: 8px; font-size: 14px; z-index: 9999; display: none; }
</style>
</head>
<body class="bg-gray-100">
<div id="toast" class="toast"></div>
<script>
const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('ev_token');
  if (t) cfg.headers['Authorization'] = 'Bearer ' + t;
  return cfg;
});
function showToast(msg, color='#1f2937') {
  const t = document.getElementById('toast'); t.textContent = msg; t.style.background = color; t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 2500);
}
function getUser() { try { return JSON.parse(localStorage.getItem('ev_user') || 'null'); } catch { return null; } }
function logout() { localStorage.removeItem('ev_token'); localStorage.removeItem('ev_user'); window.location.href = '/admin/login'; }
function formatPrice(n) { return Number(n).toLocaleString() + '원'; }
function formatDate(s) { if (!s) return '-'; return new Date(s).toLocaleString('ko-KR'); }
function formatDateShort(s) { if (!s) return '-'; return new Date(s).toLocaleDateString('ko-KR'); }
</script>
`

const adminSidebar = (active: string) => `
<div class="flex min-h-screen">
<div class="sidebar flex-shrink-0">
  <div class="p-4 border-b border-gray-700">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
        <i class="fas fa-leaf text-white text-sm"></i>
      </div>
      <div>
        <p class="text-white font-bold text-sm">EV-Wash</p>
        <p class="text-gray-400 text-xs">Admin</p>
      </div>
    </div>
  </div>
  <nav class="p-2 mt-2">
    <a href="/admin" class="${active==='dashboard'?'active':''}"><i class="fas fa-chart-pie w-4"></i> 대시보드</a>
    <a href="/admin/applications" class="${active==='applications'?'active':''}"><i class="fas fa-file-alt w-4"></i> 신청 관리 <span id="pendingBadge" class="badge" style="display:none"></span></a>
    <a href="/admin/stations" class="${active==='stations'?'active':''}"><i class="fas fa-gas-pump w-4"></i> 주유소 관리</a>
    <a href="/admin/users" class="${active==='users'?'active':''}"><i class="fas fa-users w-4"></i> 회원 관리</a>
    <a href="/admin/payments" class="${active==='payments'?'active':''}"><i class="fas fa-credit-card w-4"></i> 결제 내역</a>
    <a href="/admin/settlement" class="${active==='settlement'?'active':''}"><i class="fas fa-coins w-4"></i> 정산 관리</a>
    <a href="/admin/settings" class="${active==='settings'?'active':''}"><i class="fas fa-cog w-4"></i> 설정</a>
    <a href="#" onclick="logout()" class="mt-4"><i class="fas fa-sign-out-alt w-4"></i> 로그아웃</a>
  </nav>
</div>
<div class="flex-1 overflow-auto">
`

const adminClose = () => `</div></div></body></html>`

function adminLoginPage(): string {
  return adminHead('관리자 로그인') + `
<div class="min-h-screen flex items-center justify-center bg-gray-900">
  <div class="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
    <div class="text-center mb-6">
      <div class="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <i class="fas fa-leaf text-white text-2xl"></i>
      </div>
      <h1 class="text-2xl font-bold text-gray-800">EV-Wash Admin</h1>
      <p class="text-gray-400 text-sm mt-1">관리자 전용 페이지</p>
    </div>
    <form onsubmit="doLogin(event)" class="space-y-4">
      <input id="email" type="email" placeholder="관리자 이메일" class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm" required>
      <input id="password" type="password" placeholder="비밀번호" class="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-green-500 text-sm" required>
      <button type="submit" class="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition-colors">로그인</button>
    </form>
  </div>
</div>
<script>
async function doLogin(e) {
  e.preventDefault();
  try {
    const r = await API.post('/auth/login', { email: document.getElementById('email').value, password: document.getElementById('password').value });
    if (r.data.user.userType !== 'admin') return showToast('관리자 계정이 아닙니다.', '#ef4444');
    localStorage.setItem('ev_token', r.data.token); localStorage.setItem('ev_user', JSON.stringify(r.data.user));
    window.location.href = '/admin';
  } catch (err) { showToast(err.response?.data?.error || '로그인 실패', '#ef4444'); }
}
</script>
</body></html>
`
}

function adminDashboardPage(): string {
  return adminHead('대시보드') + adminSidebar('dashboard') + `
<div class="p-6">
  <h1 class="text-xl font-bold text-gray-800 mb-6">대시보드</h1>
  <div id="statsGrid" class="grid grid-cols-4 gap-4 mb-6">
    <div class="stat-card"><p class="text-xs text-gray-500">전체 회원</p><p class="text-2xl font-bold text-gray-800 mt-1" id="totalUsers">-</p></div>
    <div class="stat-card"><p class="text-xs text-gray-500">등록 주유소</p><p class="text-2xl font-bold text-gray-800 mt-1" id="totalStations">-</p></div>
    <div class="stat-card"><p class="text-xs text-gray-500">승인 대기</p><p class="text-2xl font-bold text-yellow-600 mt-1" id="pendingApps">-</p></div>
    <div class="stat-card"><p class="text-xs text-gray-500">오늘 사용</p><p class="text-2xl font-bold text-green-600 mt-1" id="todayUsages">-</p></div>
    <div class="stat-card"><p class="text-xs text-gray-500">이번달 매출</p><p class="text-2xl font-bold text-gray-800 mt-1" id="monthAmount">-</p></div>
    <div class="stat-card"><p class="text-xs text-gray-500">누적 쿠폰사용</p><p class="text-2xl font-bold text-gray-800 mt-1" id="totalUsages">-</p></div>
    <div class="stat-card"><p class="text-xs text-gray-500">정산 대기 건수</p><p class="text-2xl font-bold text-yellow-600 mt-1" id="pendingSettlements">-</p></div>
    <div class="stat-card"><p class="text-xs text-gray-500">정산 대기 금액</p><p class="text-2xl font-bold text-yellow-600 mt-1" id="pendingAmount">-</p></div>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <div class="card">
      <h3 class="font-bold text-gray-800 mb-4">빠른 메뉴</h3>
      <div class="space-y-2">
        <a href="/admin/applications" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm text-gray-700">
          <i class="fas fa-file-alt text-yellow-500 w-4"></i> 신청 승인 처리
        </a>
        <a href="/admin/settlement" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm text-gray-700">
          <i class="fas fa-coins text-green-500 w-4"></i> 오늘 정산 처리
        </a>
        <a href="/admin/payments" class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm text-gray-700">
          <i class="fas fa-credit-card text-blue-500 w-4"></i> 결제 내역 확인
        </a>
      </div>
    </div>
    <div class="card">
      <h3 class="font-bold text-gray-800 mb-4">회원 현황</h3>
      <div id="userStats" class="space-y-3"></div>
    </div>
  </div>
</div>
<script>
const user = getUser();
if (!user || user.userType !== 'admin') window.location.href = '/admin/login';

async function loadStats() {
  const r = await API.get('/admin/stats');
  const d = r.data;
  document.querySelectorAll('#totalUsers')[0].textContent = d.users?.total?.toLocaleString() || '0';
  document.querySelectorAll('#totalStations')[0].textContent = d.stations?.total?.toLocaleString() || '0';
  document.querySelectorAll('#pendingApps')[0].textContent = d.stations?.pending || '0';
  document.querySelectorAll('#todayUsages')[0].textContent = d.coupons?.today_usages?.toLocaleString() || '0';
  document.querySelectorAll('#monthAmount')[0].textContent = formatPrice(d.coupons?.month_amount || 0);
  document.querySelectorAll('#totalUsages')[1].textContent = d.coupons?.total_usages?.toLocaleString() || '0';
  document.querySelectorAll('#pendingSettlements')[0].textContent = d.settlements?.pending_count || '0';
  document.querySelectorAll('#pendingAmount')[0].textContent = formatPrice(d.settlements?.pending_amount || 0);
  
  document.getElementById('userStats').innerHTML = \`
    <div class="flex justify-between text-sm"><span class="text-gray-500">일반 고객</span><span class="font-semibold">\${d.users?.customers?.toLocaleString() || 0}명</span></div>
    <div class="flex justify-between text-sm"><span class="text-gray-500">주유소 사장님</span><span class="font-semibold">\${d.users?.owners?.toLocaleString() || 0}명</span></div>
    <div class="flex justify-between text-sm"><span class="text-gray-500">오늘 신규 가입</span><span class="font-semibold text-green-600">\${d.users?.today_new || 0}명</span></div>
  \`;
  
  if (d.stations?.pending > 0) {
    const b = document.getElementById('pendingBadge');
    b.textContent = d.stations.pending; b.style.display = 'inline';
  }
}
window.onload = loadStats;
</script>
` + adminClose()
}

function adminApplicationsPage(): string {
  return adminHead('신청 관리') + adminSidebar('applications') + `
<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-bold text-gray-800">주유소 등록 신청</h1>
    <div class="flex gap-2">
      <select id="statusFilter" onchange="loadApps()" class="px-3 py-2 border border-gray-200 rounded-lg text-sm">
        <option value="">전체</option>
        <option value="pending">대기중</option>
        <option value="approved">승인됨</option>
        <option value="rejected">거절됨</option>
      </select>
    </div>
  </div>
  <div class="card">
    <table>
      <thead><tr>
        <th>신청일</th><th>사장님</th><th>주유소명</th><th>주소</th><th>사업자번호</th><th>상태</th><th>액션</th>
      </tr></thead>
      <tbody id="appTable"></tbody>
    </table>
  </div>
</div>
<script>
const user = getUser();
if (!user || user.userType !== 'admin') window.location.href = '/admin/login';

async function loadApps() {
  const status = document.getElementById('statusFilter').value;
  const r = await API.get('/admin/applications' + (status ? '?status=' + status : ''));
  document.getElementById('appTable').innerHTML = r.data.applications.map(a => \`
    <tr>
      <td class="text-xs text-gray-400">\${formatDateShort(a.applied_at)}</td>
      <td>\${a.owner_name}<br><span class="text-xs text-gray-400">\${a.owner_phone || ''}</span></td>
      <td class="font-medium">\${a.station_name}</td>
      <td class="text-xs text-gray-500 max-w-xs truncate">\${a.address}</td>
      <td class="text-xs">\${a.business_registration}</td>
      <td><span class="tag \${a.status==='approved'?'tag-green':a.status==='rejected'?'tag-red':'tag-yellow'}">\${a.status==='approved'?'승인':a.status==='rejected'?'거절':'대기'}</span></td>
      <td>
        \${a.status === 'pending' ? \`
          <button onclick="review(\${a.id},'approved')" class="btn btn-green mr-1">승인</button>
          <button onclick="rejectApp(\${a.id})" class="btn btn-red">거절</button>
        \` : \`<a href="/admin/applications/\${a.id}" class="btn btn-gray">상세</a>\`}
      </td>
    </tr>
  \`).join('');
}

async function review(id, status, reason) {
  try {
    await API.post(\`/admin/applications/\${id}/review\`, { status, rejectionReason: reason });
    showToast(status === 'approved' ? '승인되었습니다' : '거절되었습니다', status === 'approved' ? '#10b981' : '#ef4444');
    loadApps();
  } catch (err) { showToast(err.response?.data?.error || '처리 실패', '#ef4444'); }
}

function rejectApp(id) {
  const reason = prompt('거절 사유를 입력해주세요:');
  if (reason !== null) review(id, 'rejected', reason);
}

window.onload = loadApps;
</script>
` + adminClose()
}

function adminApplicationDetailPage(): string {
  return adminHead('신청 상세') + adminSidebar('applications') + `
<div class="p-6">
  <div class="flex items-center gap-3 mb-6">
    <a href="/admin/applications" class="text-gray-500 hover:text-gray-700"><i class="fas fa-arrow-left"></i></a>
    <h1 class="text-xl font-bold text-gray-800">신청 상세</h1>
  </div>
  <div id="content" class="card">
    <div class="text-center py-8"><i class="fas fa-spinner fa-spin text-green-500"></i></div>
  </div>
</div>
<script>
const appId = location.pathname.split('/').pop();
window.onload = async () => {
  const r = await API.get(\`/admin/applications/\${appId}\`);
  const a = r.data.application;
  document.getElementById('content').innerHTML = \`
    <div class="grid grid-cols-2 gap-6">
      <div class="space-y-4">
        <h3 class="font-bold text-gray-700 border-b pb-2">주유소 정보</h3>
        <div><p class="text-xs text-gray-400">주유소명</p><p class="font-semibold mt-0.5">\${a.station_name}</p></div>
        <div><p class="text-xs text-gray-400">주소</p><p class="mt-0.5">\${a.address}</p></div>
        <div><p class="text-xs text-gray-400">전화번호</p><p class="mt-0.5">\${a.phone}</p></div>
        <div><p class="text-xs text-gray-400">세차 유형</p><p class="mt-0.5">\${a.car_wash_type}</p></div>
        <div><p class="text-xs text-gray-400">사업자등록번호</p><p class="mt-0.5 font-mono">\${a.business_registration}</p></div>
      </div>
      <div class="space-y-4">
        <h3 class="font-bold text-gray-700 border-b pb-2">사장님 정보</h3>
        <div><p class="text-xs text-gray-400">이름</p><p class="font-semibold mt-0.5">\${a.owner_name}</p></div>
        <div><p class="text-xs text-gray-400">이메일</p><p class="mt-0.5">\${a.owner_email}</p></div>
        <div><p class="text-xs text-gray-400">전화번호</p><p class="mt-0.5">\${a.owner_phone || '-'}</p></div>
        <div><p class="text-xs text-gray-400">계좌정보</p><p class="mt-0.5">\${a.bank_name || '-'} \${a.bank_account || ''} (\${a.bank_holder || '-'})</p></div>
        \${a.business_doc_url ? \`<div><p class="text-xs text-gray-400">사업자등록증</p><a href="/api/admin/r2/\${a.business_doc_url}" target="_blank" class="text-green-600 text-sm">파일 보기</a></div>\` : ''}
        \${a.account_doc_url ? \`<div><p class="text-xs text-gray-400">계좌 사본</p><a href="/api/admin/r2/\${a.account_doc_url}" target="_blank" class="text-green-600 text-sm">파일 보기</a></div>\` : ''}
      </div>
    </div>
    \${a.status === 'pending' ? \`
      <div class="flex gap-3 mt-6 pt-6 border-t">
        <button onclick="review('approved')" class="btn btn-green px-6 py-2">승인</button>
        <button onclick="rejectApp()" class="btn btn-red px-6 py-2">거절</button>
      </div>
    \` : \`<div class="mt-4 pt-4 border-t"><span class="tag \${a.status==='approved'?'tag-green':'tag-red'} text-sm">\${a.status==='approved'?'승인됨':'거절됨'}</span>\${a.rejection_reason ? \`<p class="text-sm text-gray-500 mt-2">사유: \${a.rejection_reason}</p>\` : ''}</div>\`}
  \`;
};
async function review(status, reason) {
  await API.post(\`/admin/applications/\${appId}/review\`, { status, rejectionReason: reason });
  showToast(status === 'approved' ? '승인되었습니다' : '거절되었습니다', '#10b981');
  setTimeout(() => window.location.href = '/admin/applications', 1000);
}
function rejectApp() {
  const r = prompt('거절 사유:');
  if (r !== null) review('rejected', r);
}
</script>
` + adminClose()
}

function adminStationsPage(): string {
  return adminHead('주유소 관리') + adminSidebar('stations') + `
<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-bold text-gray-800">주유소 관리</h1>
    <input id="kw" type="text" placeholder="주유소명/주소 검색" onkeypress="if(event.key==='Enter')loadStations()" class="px-3 py-2 border border-gray-200 rounded-lg text-sm w-56">
  </div>
  <div class="card">
    <table>
      <thead><tr><th>주유소명</th><th>주소</th><th>사장님</th><th>세차유형</th><th>쿠폰수</th><th>총사용</th><th>등록일</th><th>액션</th></tr></thead>
      <tbody id="stationTable"></tbody>
    </table>
  </div>
</div>
<script>
const user = getUser();
if (!user || user.userType !== 'admin') window.location.href = '/admin/login';
async function loadStations() {
  const kw = document.getElementById('kw').value;
  const r = await API.get('/admin/stations' + (kw ? '?keyword=' + encodeURIComponent(kw) : ''));
  document.getElementById('stationTable').innerHTML = r.data.stations.map(s => \`
    <tr>
      <td class="font-medium">\${s.station_name}</td>
      <td class="text-xs text-gray-500 max-w-xs truncate">\${s.address}</td>
      <td>\${s.owner_name}</td>
      <td><span class="tag tag-gray">\${s.car_wash_type}</span></td>
      <td>\${s.active_coupons || 0}종</td>
      <td>\${s.total_usages || 0}회</td>
      <td class="text-xs text-gray-400">\${formatDateShort(s.created_at)}</td>
      <td><button onclick="deleteStation(\${s.id})" class="btn btn-red text-xs">비활성화</button></td>
    </tr>
  \`).join('');
}
async function deleteStation(id) {
  if (!confirm('비활성화 하시겠습니까?')) return;
  await API.delete('/admin/stations/' + id);
  showToast('비활성화되었습니다', '#10b981'); loadStations();
}
window.onload = loadStations;
</script>
` + adminClose()
}

function adminUsersPage(): string {
  return adminHead('회원 관리') + adminSidebar('users') + `
<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-bold text-gray-800">회원 관리</h1>
    <select id="typeFilter" onchange="loadUsers()" class="px-3 py-2 border border-gray-200 rounded-lg text-sm">
      <option value="">전체</option>
      <option value="customer">고객</option>
      <option value="station_owner">사장님</option>
      <option value="admin">관리자</option>
    </select>
  </div>
  <div class="card">
    <table>
      <thead><tr><th>이름</th><th>이메일</th><th>전화번호</th><th>유형</th><th>가입경로</th><th>가입일</th><th>액션</th></tr></thead>
      <tbody id="userTable"></tbody>
    </table>
  </div>
</div>
<script>
const user = getUser();
if (!user || user.userType !== 'admin') window.location.href = '/admin/login';
async function loadUsers() {
  const t = document.getElementById('typeFilter').value;
  const r = await API.get('/admin/users' + (t ? '?userType=' + t : ''));
  document.getElementById('userTable').innerHTML = r.data.users.map(u => \`
    <tr>
      <td class="font-medium">\${u.name}</td>
      <td class="text-sm text-gray-500">\${u.email || '-'}</td>
      <td class="text-sm">\${u.phone || '-'}</td>
      <td><span class="tag \${u.user_type==='admin'?'tag-red':u.user_type==='station_owner'?'tag-yellow':'tag-green'}">\${u.user_type==='admin'?'관리자':u.user_type==='station_owner'?'사장님':'고객'}</span></td>
      <td class="text-xs text-gray-400">\${u.social_provider || '이메일'}</td>
      <td class="text-xs text-gray-400">\${formatDateShort(u.created_at)}</td>
      <td><button onclick="deleteUser(\${u.id})" class="btn btn-red text-xs">비활성화</button></td>
    </tr>
  \`).join('');
}
async function deleteUser(id) {
  if (!confirm('비활성화 하시겠습니까?')) return;
  await API.delete('/admin/users/' + id);
  showToast('비활성화되었습니다', '#10b981'); loadUsers();
}
window.onload = loadUsers;
</script>
` + adminClose()
}

function adminPaymentsPage(): string {
  return adminHead('결제 내역') + adminSidebar('payments') + `
<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-bold text-gray-800">결제 내역</h1>
    <div class="flex gap-2">
      <input type="date" id="startDate" class="px-3 py-2 border border-gray-200 rounded-lg text-sm">
      <input type="date" id="endDate" class="px-3 py-2 border border-gray-200 rounded-lg text-sm">
      <select id="statusFilter" class="px-3 py-2 border border-gray-200 rounded-lg text-sm">
        <option value="">전체</option>
        <option value="completed">완료</option>
        <option value="refunded">환불</option>
        <option value="partial_refunded">부분환불</option>
      </select>
      <button onclick="loadPayments()" class="btn btn-green">검색</button>
    </div>
  </div>
  <div id="summary" class="grid grid-cols-3 gap-4 mb-4"></div>
  <div class="card">
    <table>
      <thead><tr><th>결제일</th><th>고객</th><th>주유소</th><th>쿠폰</th><th>수량</th><th>금액</th><th>상태</th><th>액션</th></tr></thead>
      <tbody id="payTable"></tbody>
    </table>
  </div>
</div>
<script>
const user = getUser();
if (!user || user.userType !== 'admin') window.location.href = '/admin/login';
async function loadPayments() {
  const p = new URLSearchParams();
  const sd = document.getElementById('startDate').value; if (sd) p.append('startDate', sd);
  const ed = document.getElementById('endDate').value; if (ed) p.append('endDate', ed);
  const st = document.getElementById('statusFilter').value; if (st) p.append('status', st);
  const r = await API.get('/admin/payments?' + p);
  document.getElementById('summary').innerHTML = \`
    <div class="stat-card"><p class="text-xs text-gray-500">결제 건수</p><p class="text-xl font-bold mt-1">\${r.data.total}건</p></div>
    <div class="stat-card"><p class="text-xs text-gray-500">총 결제금액</p><p class="text-xl font-bold mt-1">\${formatPrice(r.data.totalAmount)}</p></div>
  \`;
  document.getElementById('payTable').innerHTML = r.data.payments.map(p => \`
    <tr>
      <td class="text-xs text-gray-400">\${formatDateShort(p.purchased_at)}</td>
      <td>\${p.customer_name}</td>
      <td class="text-sm">\${p.station_name}</td>
      <td class="text-sm">\${p.coupon_title}</td>
      <td>\${p.quantity}매 (사용\${p.used_quantity})</td>
      <td class="font-semibold">\${formatPrice(p.total_amount)}</td>
      <td><span class="tag \${p.payment_status==='completed'?'tag-green':p.payment_status==='refunded'?'tag-red':'tag-yellow'}">\${p.payment_status==='completed'?'완료':p.payment_status==='refunded'?'환불':'부분환불'}</span></td>
      <td>\${p.payment_status==='completed'&&(p.quantity-p.used_quantity)>0?
        \`<button onclick="cancelPayment(\${p.id})" class="btn btn-red text-xs">강제취소</button>\`:'-'}</td>
    </tr>
  \`).join('');
}
async function cancelPayment(id) {
  const reason = prompt('취소 사유:');
  if (reason === null) return;
  await API.post('/admin/cancel-payment', { purchaseId: id, cancelReason: reason });
  showToast('취소되었습니다', '#10b981'); loadPayments();
}
window.onload = () => {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.substring(0,7) + '-01';
  document.getElementById('startDate').value = monthStart;
  document.getElementById('endDate').value = today;
  loadPayments();
};
</script>
` + adminClose()
}

function adminSettlementPage(): string {
  return adminHead('정산 관리') + adminSidebar('settlement') + `
<div class="p-6">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-xl font-bold text-gray-800">정산 관리</h1>
    <div class="flex items-center gap-3">
      <input type="date" id="settlDate" class="px-3 py-2 border border-gray-200 rounded-lg text-sm">
      <button onclick="loadSettlement()" class="btn btn-green">조회</button>
      <button onclick="processAll()" class="btn btn-yellow">전체 정산 처리</button>
    </div>
  </div>
  <div id="settlSummary" class="grid grid-cols-3 gap-4 mb-4"></div>
  <div class="card">
    <table>
      <thead><tr><th>주유소명</th><th>사용 건수</th><th>총 사용금액</th><th>수수료(15%)</th><th>정산금액</th><th>계좌정보</th><th>상태</th><th>액션</th></tr></thead>
      <tbody id="settlTable"></tbody>
    </table>
  </div>
</div>
<script>
const user = getUser();
if (!user || user.userType !== 'admin') window.location.href = '/admin/login';
let currentDate = '';

async function loadSettlement() {
  currentDate = document.getElementById('settlDate').value;
  const r = await API.get('/admin/settlement?date=' + currentDate);
  const d = r.data;
  const rate = d.feeRate;
  
  const totalAmount = d.settlements.reduce((s,x) => s + (x.total_amount||0), 0);
  const totalFee = Math.floor(totalAmount * rate);
  document.getElementById('settlSummary').innerHTML = \`
    <div class="stat-card"><p class="text-xs text-gray-500">대상 주유소</p><p class="text-xl font-bold mt-1">\${d.settlements.length}곳</p></div>
    <div class="stat-card"><p class="text-xs text-gray-500">총 정산금액</p><p class="text-xl font-bold text-green-600 mt-1">\${formatPrice(totalAmount - totalFee)}</p></div>
    <div class="stat-card"><p class="text-xs text-gray-500">플랫폼 수수료</p><p class="text-xl font-bold text-gray-800 mt-1">\${formatPrice(totalFee)}</p></div>
  \`;
  
  document.getElementById('settlTable').innerHTML = d.settlements.map(s => {
    const fee = Math.floor((s.total_amount||0) * rate);
    const net = (s.total_amount||0) - fee;
    return \`
      <tr>
        <td class="font-medium">\${s.station_name}</td>
        <td>\${s.usage_count || 0}건</td>
        <td class="font-semibold">\${formatPrice(s.total_amount||0)}</td>
        <td class="text-red-500">-\${formatPrice(fee)}</td>
        <td class="font-bold text-green-600">\${formatPrice(net)}</td>
        <td class="text-xs text-gray-400">\${s.bank_name||''} \${s.bank_account||''}</td>
        <td><span class="tag \${s.status==='completed'?'tag-green':'tag-yellow'}">\${s.status==='completed'?'완료':'대기'}</span></td>
        <td>\${s.status!=='completed'?
          \`<button onclick="processOne(\${s.station_id})" class="btn btn-green text-xs">처리</button>\`:'-'}</td>
      </tr>
    \`;
  }).join('');
}

async function processOne(stationId) {
  await API.post('/admin/settlement/process', { stationId, settlementDate: currentDate });
  showToast('정산 처리되었습니다', '#10b981'); loadSettlement();
}

async function processAll() {
  if (!confirm(\`\${currentDate} 전체 정산을 처리하시겠습니까?\`)) return;
  const r = await API.post('/admin/settlement/process-all', { settlementDate: currentDate });
  showToast(\`\${r.data.processed}건 처리완료\`, '#10b981'); loadSettlement();
}

window.onload = () => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  document.getElementById('settlDate').value = yesterday;
  loadSettlement();
};
</script>
` + adminClose()
}

function adminSettingsPage(): string {
  return adminHead('설정') + adminSidebar('settings') + `
<div class="p-6">
  <h1 class="text-xl font-bold text-gray-800 mb-6">플랫폼 설정</h1>
  <div class="card max-w-2xl">
    <div id="settingsList" class="space-y-4"></div>
  </div>
</div>
<script>
const user = getUser();
if (!user || user.userType !== 'admin') window.location.href = '/admin/login';

async function loadSettings() {
  const r = await API.get('/admin/settings');
  document.getElementById('settingsList').innerHTML = r.data.settings.map(s => \`
    <div class="flex items-center justify-between py-3 border-b last:border-0">
      <div class="flex-1">
        <p class="font-medium text-gray-800">\${s.description || s.setting_key}</p>
        <p class="text-xs text-gray-400 mt-0.5">\${s.setting_key}</p>
      </div>
      <div class="flex items-center gap-2">
        <input id="setting_\${s.setting_key}" type="text" value="\${s.setting_value}" 
          class="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right">
        <button onclick="saveSetting('\${s.setting_key}')" class="btn btn-green text-xs">저장</button>
      </div>
    </div>
  \`).join('');
}

async function saveSetting(key) {
  const val = document.getElementById('setting_' + key).value;
  await API.put('/admin/settings/' + key, { value: val });
  showToast('저장되었습니다', '#10b981');
}

window.onload = loadSettings;
</script>
` + adminClose()
}
