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
  <div class="mb-6">
    <h2 class="text-xl font-bold" style="color:#0a1628">대시보드</h2>
    <p class="text-sm" style="color:#8e9ab4">EV-Wash 플랫폼 현황</p>
  </div>

  <!-- 통계 카드 -->
  <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
    <div class="admin-card text-center">
      <div class="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center stat-icon-navy">
        <i class="fas fa-users text-lg"></i>
      </div>
      <p id="stat_users" class="text-2xl font-bold" style="color:#0a1628">-</p>
      <p class="text-xs" style="color:#8e9ab4">전체 회원</p>
    </div>
    <div class="admin-card text-center">
      <div class="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center stat-icon-lime">
        <i class="fas fa-gas-pump text-lg"></i>
      </div>
      <p id="stat_stations" class="text-2xl font-bold" style="color:#0a1628">-</p>
      <p class="text-xs" style="color:#8e9ab4">등록 주유소</p>
    </div>
    <div class="admin-card text-center">
      <div class="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center stat-icon-amber">
        <i class="fas fa-file-alt text-lg"></i>
      </div>
      <p id="stat_pending" class="text-2xl font-bold" style="color:#0a1628">-</p>
      <p class="text-xs" style="color:#8e9ab4">심사 대기</p>
    </div>
    <div class="admin-card text-center">
      <div class="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center stat-icon-navy">
        <i class="fas fa-receipt text-lg"></i>
      </div>
      <p id="stat_today_cnt" class="text-2xl font-bold" style="color:#0a1628">-</p>
      <p class="text-xs" style="color:#8e9ab4">오늘 결제</p>
    </div>
    <div class="admin-card text-center">
      <div class="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center stat-icon-lime">
        <i class="fas fa-won-sign text-lg"></i>
      </div>
      <p id="stat_today_sales" class="text-xl font-bold" style="color:#0a1628">-</p>
      <p class="text-xs" style="color:#8e9ab4">오늘 매출</p>
    </div>
    <div class="admin-card text-center">
      <div class="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center stat-icon-amber">
        <i class="fas fa-clock text-lg"></i>
      </div>
      <p id="stat_pending_settle" class="text-xl font-bold" style="color:#0a1628">-</p>
      <p class="text-xs" style="color:#8e9ab4">미정산 금액</p>
    </div>
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

  <!-- 주간 매출 -->
  <div class="admin-card">
    <h3 class="font-bold mb-3" style="color:#0a1628">최근 7일 매출</h3>
    <canvas id="salesChart" height="120"></canvas>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
window.addEventListener('DOMContentLoaded', async () => {
  requireAuth('admin');
  try {
    const r = await API.get('/admin/dashboard');
    document.getElementById('stat_users').textContent = r.total_users?.toLocaleString() || 0;
    document.getElementById('stat_stations').textContent = r.total_stations?.toLocaleString() || 0;
    document.getElementById('stat_pending').textContent = r.pending_applications || 0;
    document.getElementById('stat_today_cnt').textContent = r.today_payment_count || 0;
    document.getElementById('stat_today_sales').textContent = formatPrice(r.today_sales);
    document.getElementById('stat_pending_settle').textContent = formatPrice(r.pending_settlement_amount);
    if (r.pending_applications > 0) {
      const b = document.getElementById('pendingBadge');
      b.textContent = r.pending_applications;
      b.classList.remove('hidden');
    }
    const labels = (r.weekly_sales || []).map(d => d.day?.slice(5));
    const data = (r.weekly_sales || []).map(d => d.total || 0);
    new Chart(document.getElementById('salesChart'), {
      type: 'bar',
      data: { labels, datasets: [{ label: '매출(원)', data, backgroundColor: '#84cc16', borderRadius: 6 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => (v/10000).toFixed(0)+'만' } } } }
    });
  } catch(e) { console.error(e); }
});
</script>
`)
}
