// 관리자 로그인, 대시보드 페이지
import { htmlPage } from '../layout'
import { ADMIN_NAV } from './layout'

export function adminLoginPage(): string {
  return htmlPage('관리자 로그인', `
<div class="min-h-screen flex items-center justify-center px-5"
  style="background:#0a1628">
  <div class="w-full max-w-sm">
    <div class="text-center mb-8">
      <div style="font-size:52px;margin-bottom:16px;filter:drop-shadow(0 0 20px rgba(132,204,22,.5))">⚡</div>
      <h1 class="text-2xl font-bold" style="color:#bef264">EV-Wash 관리자</h1>
      <p style="color:rgba(255,255,255,.4);font-size:14px;margin-top:4px">관리자 전용 대시보드</p>
    </div>
    <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:24px 20px;">
      <form onsubmit="doLogin(event)" class="space-y-4">
        <input id="email" type="email" placeholder="이메일" class="input" required
          style="background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.35);color:#fff;">
        <input id="pw" type="password" placeholder="비밀번호" class="input" required
          style="background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.35);color:#fff;">
        <button type="submit" id="btn" class="btn btn-primary">로그인</button>
      </form>
    </div>
  </div>
</div>
<style>.input::placeholder { color: rgba(255,255,255,.6) !important; }</style>
<script>
async function doLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('btn');
  btn.disabled = true; btn.textContent = '로그인 중...';
  try {
    const r = await API.post('/auth/login', {
      email: document.getElementById('email').value,
      password: document.getElementById('pw').value,
    });
    if (r.user.userType !== 'admin') return showToast('관리자 계정으로 로그인해주세요.', 'error');
    setUser(r.token, r.user);
    window.location.href = '/admin';
  } catch(e) {
    showToast(e.message || '로그인 실패', 'error');
    btn.disabled = false; btn.textContent = '로그인';
  }
}
</script>
`)
}

export function adminDashboardPage(): string {
  return htmlPage('대시보드', `
${ADMIN_NAV}
<div class="main-content p-4 md:p-6 pt-16 md:pt-6">
  <div class="mb-5">
    <h2 class="text-xl font-bold" style="color:#0a1628">대시보드</h2>
    <p class="text-sm" style="color:#8e9ab4">EV-Wash 플랫폼 현황</p>
  </div>

  <!-- 기본 현황 카드 -->
  <div class="grid grid-cols-3 gap-3 mb-6">
    <div class="admin-card text-center">
      <div class="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center stat-icon-navy">
        <i class="fas fa-users"></i>
      </div>
      <p id="stat_users" class="text-2xl font-bold" style="color:#0a1628">-</p>
      <p class="text-xs" style="color:#8e9ab4">전체 회원</p>
    </div>
    <div class="admin-card text-center">
      <div class="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center stat-icon-lime">
        <i class="fas fa-gas-pump"></i>
      </div>
      <p id="stat_stations" class="text-2xl font-bold" style="color:#0a1628">-</p>
      <p class="text-xs" style="color:#8e9ab4">등록 주유소</p>
    </div>
    <div class="admin-card text-center">
      <div class="w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center stat-icon-amber">
        <i class="fas fa-file-alt"></i>
      </div>
      <p id="stat_pending" class="text-2xl font-bold" style="color:#0a1628">-</p>
      <p class="text-xs" style="color:#8e9ab4">심사 대기</p>
    </div>
  </div>

  <!-- 매출 분석 탭 -->
  <div class="admin-card mb-6" style="padding:0;overflow:hidden">
    <!-- 탭 헤더 -->
    <div style="display:flex;border-bottom:1px solid #eef1f7">
      <button class="sales-tab active" onclick="switchSalesTab('today')" id="stab-today"
        style="flex:1;padding:12px 0;font-size:13px;font-weight:700;border:none;background:none;cursor:pointer;border-bottom:2px solid #84cc16;color:#0a1628">오늘</button>
      <button class="sales-tab" onclick="switchSalesTab('yesterday')" id="stab-yesterday"
        style="flex:1;padding:12px 0;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#8e9ab4">어제</button>
      <button class="sales-tab" onclick="switchSalesTab('month')" id="stab-month"
        style="flex:1;padding:12px 0;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#8e9ab4">이번달</button>
      <button class="sales-tab" onclick="switchSalesTab('lmonth')" id="stab-lmonth"
        style="flex:1;padding:12px 0;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#8e9ab4">지난달</button>
    </div>
    <!-- 탭 패널 -->
    <div id="spanel-today" class="sales-panel" style="padding:20px 16px">
      <div class="sales-row-header">오늘 매출 현황</div>
      <div class="sales-grid">
        <div class="sales-metric">
          <span class="sales-label">총 매출</span>
          <span id="td-sales" class="sales-value main">-</span>
          <span id="td-cnt" class="sales-sub">- 건</span>
        </div>
        <div class="sales-metric">
          <span class="sales-label">정산 예정</span>
          <span id="td-settle" class="sales-value settle">-</span>
          <span class="sales-sub">수수료 제외</span>
        </div>
        <div class="sales-metric">
          <span class="sales-label">플랫폼 수익</span>
          <span id="td-fee" class="sales-value fee">-</span>
          <span id="td-feerate" class="sales-sub">- %</span>
        </div>
      </div>
    </div>
    <div id="spanel-yesterday" class="sales-panel" style="padding:20px 16px;display:none">
      <div class="sales-row-header">어제 매출 현황</div>
      <div class="sales-grid">
        <div class="sales-metric">
          <span class="sales-label">총 매출</span>
          <span id="yd-sales" class="sales-value main">-</span>
          <span id="yd-cnt" class="sales-sub">- 건</span>
        </div>
        <div class="sales-metric">
          <span class="sales-label">정산 예정</span>
          <span id="yd-settle" class="sales-value settle">-</span>
          <span class="sales-sub">수수료 제외</span>
        </div>
        <div class="sales-metric">
          <span class="sales-label">플랫폼 수익</span>
          <span id="yd-fee" class="sales-value fee">-</span>
          <span id="yd-feerate" class="sales-sub">- %</span>
        </div>
      </div>
    </div>
    <div id="spanel-month" class="sales-panel" style="padding:20px 16px;display:none">
      <div class="sales-row-header">이번달 매출 현황</div>
      <div class="sales-grid">
        <div class="sales-metric">
          <span class="sales-label">총 매출</span>
          <span id="mo-sales" class="sales-value main">-</span>
          <span id="mo-cnt" class="sales-sub">- 건</span>
        </div>
        <div class="sales-metric">
          <span class="sales-label">정산 예정</span>
          <span id="mo-settle" class="sales-value settle">-</span>
          <span class="sales-sub">수수료 제외</span>
        </div>
        <div class="sales-metric">
          <span class="sales-label">플랫폼 수익</span>
          <span id="mo-fee" class="sales-value fee">-</span>
          <span id="mo-feerate" class="sales-sub">- %</span>
        </div>
      </div>
    </div>
    <div id="spanel-lmonth" class="sales-panel" style="padding:20px 16px;display:none">
      <div class="sales-row-header">지난달 매출 현황</div>
      <div class="sales-grid">
        <div class="sales-metric">
          <span class="sales-label">총 매출</span>
          <span id="lm-sales" class="sales-value main">-</span>
          <span id="lm-cnt" class="sales-sub">- 건</span>
        </div>
        <div class="sales-metric">
          <span class="sales-label">정산 예정</span>
          <span id="lm-settle" class="sales-value settle">-</span>
          <span class="sales-sub">수수료 제외</span>
        </div>
        <div class="sales-metric">
          <span class="sales-label">플랫폼 수익</span>
          <span id="lm-fee" class="sales-value fee">-</span>
          <span id="lm-feerate" class="sales-sub">- %</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 미정산 잔액 -->
  <div class="admin-card mb-6" style="background:linear-gradient(135deg,#0a1628,#1a2f5e);border:none">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <p style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:4px">누적 미정산 (정산 대기 중)</p>
        <p id="stat_pending_settle" class="text-2xl font-bold" style="color:#bef264">-</p>
      </div>
      <div style="width:44px;height:44px;border-radius:14px;background:rgba(190,242,100,.15);display:flex;align-items:center;justify-content:center">
        <i class="fas fa-clock" style="color:#bef264;font-size:18px"></i>
      </div>
    </div>
    <a href="/admin/settlement" style="display:inline-flex;align-items:center;gap:6px;margin-top:14px;font-size:13px;font-weight:700;color:#bef264;text-decoration:none">
      정산 처리하기 <i class="fas fa-arrow-right" style="font-size:11px"></i>
    </a>
  </div>

  <!-- 빠른 메뉴 -->
  <div class="grid grid-cols-2 gap-3 mb-6">
    <a href="/admin/applications" class="quick-card">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 stat-icon-amber">
        <i class="fas fa-file-check"></i>
      </div>
      <div>
        <p class="font-semibold text-sm" style="color:#0a1628">신청 심사</p>
        <p class="text-xs" style="color:#8e9ab4">등록 검토하기</p>
      </div>
    </a>
    <a href="/admin/settlement" class="quick-card">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 stat-icon-lime">
        <i class="fas fa-money-bill-wave"></i>
      </div>
      <div>
        <p class="font-semibold text-sm" style="color:#0a1628">정산 처리</p>
        <p class="text-xs" style="color:#8e9ab4">익일 정산하기</p>
      </div>
    </a>
  </div>

  <!-- 주간 매출 차트 -->
  <div class="admin-card">
    <h3 class="font-bold mb-3" style="color:#0a1628">최근 7일 매출</h3>
    <canvas id="salesChart" height="120"></canvas>
  </div>
</div>

<style>
.sales-row-header { font-size:12px;font-weight:700;color:#8e9ab4;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:14px; }
.sales-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:10px; }
.sales-metric { background:#f4f7fb;border-radius:14px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;gap:4px; }
.sales-label { font-size:11px;color:#8e9ab4;font-weight:600; }
.sales-value { font-size:15px;font-weight:800;line-height:1.2;text-align:center; }
.sales-value.main  { color:#0a1628; }
.sales-value.settle{ color:#2563eb; }
.sales-value.fee   { color:#84cc16; }
.sales-sub { font-size:11px;color:#8e9ab4; }
@media(max-width:360px){ .sales-value{font-size:13px} }
</style>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
let _r = null;
function fp(v){ return (v||0).toLocaleString()+'원'; }
function switchSalesTab(tab) {
  ['today','yesterday','month','lmonth'].forEach(t => {
    const btn = document.getElementById('stab-'+t);
    const panel = document.getElementById('spanel-'+t);
    const active = t === tab;
    panel.style.display = active ? '' : 'none';
    btn.style.borderBottomColor = active ? '#84cc16' : 'transparent';
    btn.style.color = active ? '#0a1628' : '#8e9ab4';
    btn.style.fontWeight = active ? '700' : '600';
  });
}
function fillSalesData(r) {
  const fr = (r.fee_rate*100).toFixed(0);
  // 오늘
  document.getElementById('td-sales').textContent   = fp(r.today_sales);
  document.getElementById('td-cnt').textContent     = (r.today_payment_count||0)+'건';
  document.getElementById('td-settle').textContent  = fp(r.today_settle_expected);
  document.getElementById('td-fee').textContent     = fp(r.today_platform_fee);
  document.getElementById('td-feerate').textContent = fr+'% 수수료';
  // 어제
  document.getElementById('yd-sales').textContent   = fp(r.yesterday_sales);
  document.getElementById('yd-cnt').textContent     = (r.yesterday_payment_count||0)+'건';
  document.getElementById('yd-settle').textContent  = fp(r.yesterday_settle_expected);
  document.getElementById('yd-fee').textContent     = fp(r.yesterday_platform_fee);
  document.getElementById('yd-feerate').textContent = fr+'% 수수료';
  // 이번달
  document.getElementById('mo-sales').textContent   = fp(r.month_sales);
  document.getElementById('mo-cnt').textContent     = (r.month_payment_count||0)+'건';
  document.getElementById('mo-settle').textContent  = fp(r.month_settle_expected);
  document.getElementById('mo-fee').textContent     = fp(r.month_platform_fee);
  document.getElementById('mo-feerate').textContent = fr+'% 수수료';
  // 지난달
  document.getElementById('lm-sales').textContent   = fp(r.last_month_sales);
  document.getElementById('lm-cnt').textContent     = (r.last_month_payment_count||0)+'건';
  document.getElementById('lm-settle').textContent  = fp(r.last_month_settle_expected);
  document.getElementById('lm-fee').textContent     = fp(r.last_month_platform_fee);
  document.getElementById('lm-feerate').textContent = fr+'% 수수료';
}
window.addEventListener('DOMContentLoaded', async () => {
  requireAuth('admin');
  try {
    _r = await API.get('/admin/dashboard');
    document.getElementById('stat_users').textContent         = (_r.total_users||0).toLocaleString();
    document.getElementById('stat_stations').textContent      = (_r.total_stations||0).toLocaleString();
    document.getElementById('stat_pending').textContent       = _r.pending_applications||0;
    document.getElementById('stat_pending_settle').textContent= fp(_r.pending_settlement_amount);
    if (_r.pending_applications > 0) {
      const b = document.getElementById('pendingBadge');
      if(b){ b.textContent = _r.pending_applications; b.classList.remove('hidden'); }
    }
    fillSalesData(_r);
    // 차트
    const labels = (_r.weekly_sales||[]).map(d => d.day?.slice(5));
    const data   = (_r.weekly_sales||[]).map(d => d.total||0);
    new Chart(document.getElementById('salesChart'), {
      type: 'bar',
      data: { labels, datasets:[{ label:'매출(원)', data, backgroundColor:'#84cc16', borderRadius:6 }] },
      options: { plugins:{ legend:{display:false} }, scales:{ y:{ ticks:{ callback: v => v>=10000?(v/10000).toFixed(0)+'만':v } } } }
    });
  } catch(e) { console.error(e); }
});
</script>
`)
}
