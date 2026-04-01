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
  <div class="grid grid-cols-3 gap-3 mb-5">
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

  <!-- 기간 탭 선택 -->
  <div class="admin-card mb-4" style="padding:0;overflow:hidden">
    <div style="display:flex;border-bottom:1px solid #eef1f7">
      <button class="period-tab" id="ptab-today"     onclick="switchTab('today')"
        style="flex:1;padding:11px 0;font-size:13px;font-weight:700;border:none;background:none;cursor:pointer;border-bottom:2px solid #84cc16;color:#0a1628">오늘</button>
      <button class="period-tab" id="ptab-yesterday" onclick="switchTab('yesterday')"
        style="flex:1;padding:11px 0;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#8e9ab4">어제</button>
      <button class="period-tab" id="ptab-month"     onclick="switchTab('month')"
        style="flex:1;padding:11px 0;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#8e9ab4">이번달</button>
      <button class="period-tab" id="ptab-lmonth"    onclick="switchTab('lmonth')"
        style="flex:1;padding:11px 0;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#8e9ab4">지난달</button>
    </div>

    <!-- ── 쿠폰 구매 (플랫폼 매출) ── -->
    <div style="padding:16px 16px 12px">
      <div class="section-label">
        <i class="fas fa-shopping-cart" style="color:#2563eb;margin-right:5px"></i>
        쿠폰 구매 <span style="color:#8e9ab4;font-weight:500;font-size:11px">플랫폼 매출</span>
      </div>
      <div class="metrics-row">
        <div class="metric-box" style="background:#eff6ff">
          <span class="metric-label" style="color:#2563eb">구매 건수</span>
          <span id="buy-cnt"   class="metric-val" style="color:#1d4ed8">- 건</span>
        </div>
        <div class="metric-box" style="background:#eff6ff">
          <span class="metric-label" style="color:#2563eb">구매 금액</span>
          <span id="buy-amt"   class="metric-val" style="color:#1d4ed8">-</span>
        </div>
        <div class="metric-box" style="background:#ecfdf5">
          <span class="metric-label" style="color:#059669">플랫폼 수익</span>
          <span id="buy-fee"   class="metric-val" style="color:#059669">-</span>
          <span id="fee-badge" class="metric-sub">15%</span>
        </div>
      </div>
    </div>

    <div style="height:1px;background:#f0f4fa;margin:0 16px"></div>

    <!-- ── 세차 사용 (주유소 정산 기준) ── -->
    <div style="padding:12px 16px 16px">
      <div class="section-label">
        <i class="fas fa-car-wash" style="color:#d97706;margin-right:5px"></i>
        세차 사용 <span style="color:#8e9ab4;font-weight:500;font-size:11px">주유소 정산 지급액 기준</span>
      </div>
      <div class="metrics-row">
        <div class="metric-box" style="background:#fffbeb">
          <span class="metric-label" style="color:#d97706">사용 건수</span>
          <span id="use-cnt"   class="metric-val" style="color:#b45309">- 건</span>
        </div>
        <div class="metric-box" style="background:#fffbeb">
          <span class="metric-label" style="color:#d97706">사용 금액</span>
          <span id="use-amt"   class="metric-val" style="color:#b45309">-</span>
        </div>
        <div class="metric-box" style="background:#f0fdf4">
          <span class="metric-label" style="color:#16a34a">정산 지급액</span>
          <span id="use-net"   class="metric-val" style="color:#15803d">-</span>
          <span class="metric-sub">수수료 제외</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 미정산 잔액 -->
  <div class="admin-card mb-5" style="background:linear-gradient(135deg,#0a1628,#1a2f5e);border:none">
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
  <div class="grid grid-cols-2 gap-3 mb-5">
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

  <!-- 주간 차트 -->
  <div class="admin-card">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <h3 class="font-bold" style="color:#0a1628">최근 7일 추이</h3>
      <div style="display:flex;gap:12px;font-size:11px">
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#2563eb;margin-right:4px"></span>구매</span>
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#d97706;margin-right:4px"></span>사용</span>
      </div>
    </div>
    <canvas id="salesChart" height="130"></canvas>
  </div>
</div>

<style>
.section-label { font-size:12px;font-weight:700;color:#374151;margin-bottom:10px;display:flex;align-items:center; }
.metrics-row   { display:grid;grid-template-columns:repeat(3,1fr);gap:8px; }
.metric-box    { border-radius:12px;padding:12px 8px;display:flex;flex-direction:column;align-items:center;gap:3px; }
.metric-label  { font-size:10px;font-weight:600; }
.metric-val    { font-size:14px;font-weight:800;line-height:1.2;text-align:center; }
.metric-sub    { font-size:10px;color:#8e9ab4; }
@media(max-width:360px){ .metric-val{font-size:12px} }
</style>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
let _r = null;
let _chart = null;
function fp(v){ return (v||0).toLocaleString()+'원'; }

const TABS = ['today','yesterday','month','lmonth'];
function switchTab(tab) {
  TABS.forEach(t => {
    const btn = document.getElementById('ptab-'+t);
    const on  = t === tab;
    btn.style.borderBottomColor = on ? '#84cc16' : 'transparent';
    btn.style.color      = on ? '#0a1628' : '#8e9ab4';
    btn.style.fontWeight = on ? '700' : '600';
  });
  if (!_r) return;
  const p = tab === 'today'     ? { buy_cnt:_r.today_buy_cnt,     buy_amt:_r.today_buy_sales,     buy_fee:_r.today_platform_fee,  use_cnt:_r.today_use_cnt,     use_amt:_r.today_use_sales,     use_net:_r.today_net_pay }
          : tab === 'yesterday' ? { buy_cnt:_r.yesterday_buy_cnt, buy_amt:_r.yesterday_buy_sales, buy_fee:_r.yesterday_platform_fee, use_cnt:_r.yesterday_use_cnt, use_amt:_r.yesterday_use_sales, use_net:_r.yesterday_net_pay }
          : tab === 'month'     ? { buy_cnt:_r.month_buy_cnt,     buy_amt:_r.month_buy_sales,     buy_fee:_r.month_platform_fee,  use_cnt:_r.month_use_cnt,     use_amt:_r.month_use_sales,     use_net:_r.month_net_pay }
          :                       { buy_cnt:_r.lmonth_buy_cnt,    buy_amt:_r.lmonth_buy_sales,    buy_fee:_r.lmonth_platform_fee, use_cnt:_r.lmonth_use_cnt,    use_amt:_r.lmonth_use_sales,    use_net:_r.lmonth_net_pay };
  document.getElementById('buy-cnt').textContent = (p.buy_cnt||0)+'건';
  document.getElementById('buy-amt').textContent = fp(p.buy_amt);
  document.getElementById('buy-fee').textContent = fp(p.buy_fee);
  document.getElementById('use-cnt').textContent = (p.use_cnt||0)+'건';
  document.getElementById('use-amt').textContent = fp(p.use_amt);
  document.getElementById('use-net').textContent = fp(p.use_net);
}

window.addEventListener('DOMContentLoaded', async () => {
  requireAuth('admin');
  try {
    _r = await API.get('/admin/dashboard');

    document.getElementById('stat_users').textContent          = (_r.total_users||0).toLocaleString();
    document.getElementById('stat_stations').textContent       = (_r.total_stations||0).toLocaleString();
    document.getElementById('stat_pending').textContent        = _r.pending_applications||0;
    document.getElementById('stat_pending_settle').textContent = fp(_r.pending_settlement_amount);
    document.getElementById('fee-badge').textContent           = ((_r.fee_rate||0.15)*100).toFixed(0)+'%';

    if (_r.pending_applications > 0) {
      const b = document.getElementById('pendingBadge');
      if(b){ b.textContent = _r.pending_applications; b.classList.remove('hidden'); }
    }

    switchTab('today');

    // 최근 7일 차트 (구매 + 사용 겹쳐서)
    const buyMap = {};
    (_r.weekly_buy||[]).forEach(d => buyMap[d.day] = d.total||0);
    const useMap = {};
    (_r.weekly_use||[]).forEach(d => useMap[d.day] = d.total||0);

    // 최근 7일 날짜 배열 생성
    const days = [];
    for(let i=6;i>=0;i--) {
      const d = new Date(Date.now() + 9*3600000 - i*86400000);
      days.push(d.toISOString().substring(0,10));
    }
    const labels   = days.map(d => d.substring(5));
    const buyData  = days.map(d => buyMap[d]||0);
    const useData  = days.map(d => useMap[d]||0);

    _chart = new Chart(document.getElementById('salesChart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label:'구매', data:buyData, backgroundColor:'#2563eb', borderRadius:4, barPercentage:0.4, categoryPercentage:0.8 },
          { label:'사용', data:useData, backgroundColor:'#d97706', borderRadius:4, barPercentage:0.4, categoryPercentage:0.8 },
        ]
      },
      options: {
        plugins:{ legend:{display:false} },
        scales:{ y:{ ticks:{ callback: v => v>=10000?(v/10000).toFixed(0)+'만':v } } }
      }
    });
  } catch(e) { console.error(e); }
});
</script>
`)
}
