// 어드민 페이지들
import { htmlPage } from '../layout'

export function adminLoginPage(): string {
  return htmlPage('관리자 로그인', `
<div class="min-h-screen flex items-center justify-center px-5">
  <div class="w-full max-w-sm">
    <div class="text-center mb-8">
      <div class="text-4xl mb-3">⚡</div>
      <h1 class="text-xl font-bold text-gray-800">EV-Wash 관리자</h1>
    </div>
    <form onsubmit="doLogin(event)" class="space-y-4">
      <input id="email" type="email" placeholder="이메일" class="input" required>
      <input id="pw" type="password" placeholder="비밀번호" class="input" required>
      <button type="submit" id="btn" class="btn btn-primary">로그인</button>
    </form>
  </div>
</div>

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

const ADMIN_NAV = `
<aside id="adminSidebar" class="fixed left-0 top-0 h-full w-56 bg-gray-900 text-white z-50 transition-transform md:translate-x-0 -translate-x-full" style="transition:transform .3s">
  <div class="p-5 border-b border-gray-700">
    <div class="flex items-center gap-2">
      <span class="text-2xl">⚡</span>
      <span class="font-bold text-lg">EV-Wash 관리자</span>
    </div>
  </div>
  <nav class="p-3 space-y-1">
    <a href="/admin" class="nav-item"><i class="fas fa-chart-bar w-5"></i>대시보드</a>
    <a href="/admin/applications" class="nav-item"><i class="fas fa-file-alt w-5"></i>신청 심사 <span id="pendingBadge" class="bg-red-500 text-xs px-1.5 rounded-full ml-auto hidden"></span></a>
    <a href="/admin/stations" class="nav-item"><i class="fas fa-gas-pump w-5"></i>주유소 관리</a>
    <a href="/admin/users" class="nav-item"><i class="fas fa-users w-5"></i>회원 관리</a>
    <a href="/admin/payments" class="nav-item"><i class="fas fa-credit-card w-5"></i>결제 내역</a>
    <a href="/admin/settlement" class="nav-item"><i class="fas fa-money-bill-wave w-5"></i>정산 관리</a>
    <a href="/admin/settings" class="nav-item"><i class="fas fa-cog w-5"></i>설정</a>
  </nav>
  <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
    <button onclick="doAdminLogout()" class="text-gray-400 text-sm w-full text-left">
      <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
    </button>
  </div>
</aside>
<button id="menuToggle" onclick="toggleSidebar()" class="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-gray-900 text-white rounded-lg flex items-center justify-center">
  <i class="fas fa-bars"></i>
</button>
<div id="overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden md:hidden" onclick="toggleSidebar()"></div>

<style>
  .nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; color:#9ca3af; text-decoration:none; font-size:14px; transition:all .15s; }
  .nav-item:hover, .nav-item.active { background:#374151; color:#fff; }
  @media(min-width:768px) { .main-content { margin-left: 224px; } }
</style>
<script>
function toggleSidebar() {
  const sb = document.getElementById('adminSidebar');
  const ov = document.getElementById('overlay');
  const open = sb.style.transform === 'translateX(0px)';
  sb.style.transform = open ? '' : 'translateX(0px)';
  ov.classList.toggle('hidden', open);
}
// 현재 페이지 nav active
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(a => {
    if (location.pathname === a.getAttribute('href') || (a.getAttribute('href') !== '/admin' && location.pathname.startsWith(a.getAttribute('href')))) {
      a.classList.add('active');
    }
  });
});
function doAdminLogout() {
  showDialog({ icon:'👋', title:'로그아웃', msg:'로그아웃 하시겠습니까?', confirmText:'로그아웃', confirmClass:'btn-danger', onConfirm: logout });
}
</script>
`

export function adminDashboardPage(): string {
  return htmlPage('대시보드', `
${ADMIN_NAV}
<div class="main-content min-h-screen p-4 md:p-6 pt-16 md:pt-6">
  <h2 class="text-xl font-bold text-gray-800 mb-6">대시보드</h2>

  <!-- 통계 카드 -->
  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
    <div class="card text-center">
      <i class="fas fa-users text-2xl text-blue-400 mb-2"></i>
      <p id="stat_users" class="text-2xl font-bold text-gray-800">-</p>
      <p class="text-xs text-gray-400">전체 회원</p>
    </div>
    <div class="card text-center">
      <i class="fas fa-gas-pump text-2xl text-green-400 mb-2"></i>
      <p id="stat_stations" class="text-2xl font-bold text-gray-800">-</p>
      <p class="text-xs text-gray-400">등록 주유소</p>
    </div>
    <div class="card text-center">
      <i class="fas fa-file-alt text-2xl text-amber-400 mb-2"></i>
      <p id="stat_pending" class="text-2xl font-bold text-gray-800">-</p>
      <p class="text-xs text-gray-400">심사 대기</p>
    </div>
    <div class="card text-center">
      <i class="fas fa-receipt text-2xl text-purple-400 mb-2"></i>
      <p id="stat_today_cnt" class="text-2xl font-bold text-gray-800">-</p>
      <p class="text-xs text-gray-400">오늘 결제</p>
    </div>
    <div class="card text-center">
      <i class="fas fa-won-sign text-2xl text-green-500 mb-2"></i>
      <p id="stat_today_sales" class="text-xl font-bold text-gray-800">-</p>
      <p class="text-xs text-gray-400">오늘 매출</p>
    </div>
    <div class="card text-center">
      <i class="fas fa-clock text-2xl text-orange-400 mb-2"></i>
      <p id="stat_pending_settle" class="text-xl font-bold text-gray-800">-</p>
      <p class="text-xs text-gray-400">미정산 금액</p>
    </div>
  </div>

  <!-- 빠른 메뉴 -->
  <div class="grid grid-cols-2 gap-3 mb-6">
    <a href="/admin/applications" class="card flex items-center gap-3 hover:border-green-300 border border-transparent transition-colors">
      <div class="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
        <i class="fas fa-file-check text-amber-500"></i>
      </div>
      <div>
        <p class="font-semibold text-gray-800 text-sm">신청 심사</p>
        <p class="text-xs text-gray-400">등록 검토하기</p>
      </div>
    </a>
    <a href="/admin/settlement" class="card flex items-center gap-3 hover:border-green-300 border border-transparent transition-colors">
      <div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
        <i class="fas fa-money-bill-wave text-green-500"></i>
      </div>
      <div>
        <p class="font-semibold text-gray-800 text-sm">정산 처리</p>
        <p class="text-xs text-gray-400">익일 정산하기</p>
      </div>
    </a>
  </div>

  <!-- 주간 매출 -->
  <div class="card">
    <h3 class="font-bold text-gray-800 mb-3">최근 7일 매출</h3>
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
    // 차트
    const labels = (r.weekly_sales || []).map(d => d.day?.slice(5));
    const data = (r.weekly_sales || []).map(d => d.total || 0);
    new Chart(document.getElementById('salesChart'), {
      type: 'bar',
      data: { labels, datasets: [{ label: '매출(원)', data, backgroundColor: '#10b981', borderRadius: 6 }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: v => (v/10000).toFixed(0)+'만' } } } }
    });
  } catch(e) { console.error(e); }
});
</script>
`)
}

export function adminApplicationsPage(): string {
  return htmlPage('신청 심사', `
${ADMIN_NAV}
<div class="main-content min-h-screen p-4 md:p-6 pt-16 md:pt-6">
  <h2 class="text-xl font-bold text-gray-800 mb-4">주유소 신청 심사</h2>

  <!-- 상태 탭 -->
  <div class="flex gap-2 mb-4 overflow-x-auto pb-1">
    <button onclick="loadApps('pending')" id="btn_pending" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-green-500 text-white">심사 대기</button>
    <button onclick="loadApps('approved')" id="btn_approved" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600">승인됨</button>
    <button onclick="loadApps('rejected')" id="btn_rejected" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600">반려됨</button>
  </div>

  <div id="list" class="space-y-3"></div>
</div>
<script>
let currentStatus = 'pending';
window.addEventListener('DOMContentLoaded', () => {
  requireAuth('admin');
  // URL 파라미터로 탭 상태 복원
  const tab = new URLSearchParams(location.search).get('tab') || 'pending';
  loadApps(tab);
});

async function loadApps(status) {
  currentStatus = status;
  ['pending','approved','rejected'].forEach(s => {
    const b = document.getElementById('btn_'+s);
    b.className = s === status
      ? 'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-green-500 text-white'
      : 'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600';
  });
  const el = document.getElementById('list');
  el.innerHTML = '<div class="card text-center py-8"><i class="fas fa-spinner fa-spin text-green-400"></i></div>';
  try {
    const r = await API.get('/admin/applications?status=' + status);
    const apps = r.applications || [];
    if (!apps.length) { el.innerHTML = '<div class="card text-center py-8 text-gray-400">항목이 없습니다</div>'; return; }
    el.innerHTML = apps.map(a => \`
      <a href="/admin/applications/\${a.id}?from=\${status}" class="card block hover:shadow-md transition-shadow active:scale-[0.99]" style="-webkit-tap-highlight-color:transparent">
        <div class="flex justify-between items-start">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-800 truncate">\${a.station_name}</h3>
            <p class="text-xs text-gray-400 mt-0.5 truncate">\${a.address}</p>
            <p class="text-xs text-gray-400">\${a.owner_email || ''}\${a.owner_phone ? ' · ' + a.owner_phone : ''}</p>
          </div>
          <div class="text-right ml-3 flex-shrink-0">
            <span class="badge \${a.status==='approved'?'badge-green':a.status==='rejected'?'badge-red':'badge-amber'}">
              \${a.status==='approved'?'승인':a.status==='rejected'?'반려':'대기'}
            </span>
            <p class="text-xs text-gray-300 mt-1">\${formatDate(a.created_at)}</p>
          </div>
        </div>
        \${a.reject_reason?'<p class="text-xs text-red-400 mt-2 truncate"><i class="fas fa-exclamation-circle mr-1"></i>'+a.reject_reason+'</p>':''}
      </a>
    \`).join('');
  } catch { el.innerHTML = '<div class="card text-center py-8 text-red-400">불러올 수 없습니다</div>'; }
}
</script>
`)}

export function adminApplicationDetailPage(): string {
  return htmlPage('신청 심사 상세', `
${ADMIN_NAV}
<div class="main-content min-h-screen p-4 md:p-6 pt-16 md:pt-6">
  <!-- 상단 헤더 -->
  <div class="flex items-center gap-3 mb-5">
    <button onclick="goBack()" class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
      <i class="fas fa-arrow-left text-gray-600"></i>
    </button>
    <h2 class="text-xl font-bold text-gray-800">신청 심사 상세</h2>
  </div>

  <!-- 로딩 / 콘텐츠 영역 -->
  <div id="content">
    <div class="card text-center py-12"><i class="fas fa-spinner fa-spin text-green-400 text-2xl"></i></div>
  </div>
</div>

<!-- 반려 사유 모달 -->
<div id="rejectModal" class="modal-bg hidden">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-handle"></div>
    <div class="modal-title">반려 사유 입력</div>
    <textarea id="rejectReason" class="input mt-3 mb-4" rows="3" placeholder="반려 사유를 입력해주세요" style="resize:none;height:100px"></textarea>
    <div class="flex gap-3">
      <button onclick="closeModal('rejectModal')" class="btn btn-gray" style="flex:1">취소</button>
      <button onclick="submitReject()" class="btn btn-danger" style="flex:1">반려</button>
    </div>
  </div>
</div>

<script>
let _appId = null;
const _fromTab = new URLSearchParams(location.search).get('from') || 'pending';

function goBack() {
  window.location.href = '/admin/applications?tab=' + _fromTab;
}

window.addEventListener('DOMContentLoaded', async () => {
  requireAuth('admin');
  const id = location.pathname.split('/').pop();
  _appId = id;
  await loadDetail(id);
});

async function loadDetail(id) {
  try {
    const r = await API.get('/admin/applications/' + id);
    const a = r.application;
    const washType = a.car_wash_type === 'automatic' ? '자동 세차기' : a.car_wash_type === 'self' ? '셀프 세차' : '자동 + 셀프';
    const statusBadge = a.status === 'approved'
      ? '<span class="badge badge-green">승인됨</span>'
      : a.status === 'rejected'
      ? '<span class="badge badge-red">반려됨</span>'
      : '<span class="badge badge-amber">심사 대기</span>';

    document.getElementById('content').innerHTML = \`
      <!-- 주유소명 + 상태 -->
      <div class="card mb-4">
        <div class="flex items-start justify-between mb-1">
          <h3 class="text-lg font-bold text-gray-800 flex-1 mr-3">\${a.station_name}</h3>
          \${statusBadge}
        </div>
        <p class="text-xs text-gray-400">\${formatDate(a.created_at)} 신청</p>
      </div>

      <!-- 기본 정보 -->
      <div class="card mb-4">
        <h4 class="font-semibold text-gray-700 text-sm mb-3"><i class="fas fa-info-circle text-green-400 mr-2"></i>기본 정보</h4>
        <div class="space-y-2.5 text-sm">
          <div class="flex justify-between gap-4">
            <span class="text-gray-400 flex-shrink-0">주소</span>
            <span class="text-gray-700 text-right">\${a.address}\${a.address_detail ? ' ' + a.address_detail : ''}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-gray-400 flex-shrink-0">전화</span>
            <span class="text-gray-700">\${a.phone || '-'}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-gray-400 flex-shrink-0">세차 유형</span>
            <span class="text-gray-700">\${washType}</span>
          </div>
        </div>
      </div>

      <!-- 사업자 정보 -->
      <div class="card mb-4">
        <h4 class="font-semibold text-gray-700 text-sm mb-3"><i class="fas fa-building text-green-400 mr-2"></i>사업자 정보</h4>
        <div class="space-y-2.5 text-sm">
          <div class="flex justify-between gap-4">
            <span class="text-gray-400 flex-shrink-0">사업자번호</span>
            <span class="text-gray-700 font-mono">\${a.business_reg_number}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-gray-400 flex-shrink-0">신청자</span>
            <span class="text-gray-700 text-right">\${a.owner_name}<br><span class="text-gray-400 text-xs">\${a.owner_email}</span></span>
          </div>
        </div>
        <!-- 첨부파일 -->
        <div class="mt-3 pt-3 border-t border-gray-100 space-y-2">
          \${a.business_reg_image_key ? \`
            <button onclick="viewFile('\${a.business_reg_image_key}', '사업자등록증')"
              class="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors text-left">
              <div class="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <i class="fas fa-file-alt text-green-500"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-700">사업자등록증</p>
                <p class="text-xs text-gray-400">클릭하여 보기</p>
              </div>
              <i class="fas fa-chevron-right text-gray-300"></i>
            </button>
          \` : '<p class="text-xs text-gray-400 py-1">사업자등록증 미첨부</p>'}
          \${a.account_image_key ? \`
            <button onclick="viewFile('\${a.account_image_key}', '통장사본')"
              class="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors text-left">
              <div class="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <i class="fas fa-university text-blue-500"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-700">통장사본</p>
                <p class="text-xs text-gray-400">클릭하여 보기</p>
              </div>
              <i class="fas fa-chevron-right text-gray-300"></i>
            </button>
          \` : '<p class="text-xs text-gray-400 py-1">통장사본 미첨부</p>'}
        </div>
      </div>

      <!-- 정산 계좌 -->
      <div class="card mb-4">
        <h4 class="font-semibold text-gray-700 text-sm mb-3"><i class="fas fa-piggy-bank text-green-400 mr-2"></i>정산 계좌</h4>
        <div class="space-y-2.5 text-sm">
          <div class="flex justify-between gap-4">
            <span class="text-gray-400 flex-shrink-0">은행</span>
            <span class="text-gray-700">\${a.bank_name}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-gray-400 flex-shrink-0">계좌번호</span>
            <span class="text-gray-700 font-mono">\${a.account_number}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-gray-400 flex-shrink-0">예금주</span>
            <span class="text-gray-700">\${a.account_holder}</span>
          </div>
        </div>
      </div>

      \${a.status === 'rejected' ? \`
        <div class="card mb-4 border border-red-100 bg-red-50">
          <h4 class="font-semibold text-red-600 text-sm mb-2"><i class="fas fa-times-circle mr-2"></i>반려 사유</h4>
          <p class="text-sm text-red-700">\${a.reject_reason}</p>
        </div>
      \` : ''}

      \${a.status === 'pending' ? \`
        <div class="flex gap-3 mt-2 pb-6">
          <button onclick="approveApp(\${a.id})" class="btn btn-primary" style="flex:1">
            <i class="fas fa-check mr-2"></i>승인
          </button>
          <button onclick="openRejectModal(\${a.id})" class="btn btn-danger" style="flex:1">
            <i class="fas fa-times mr-2"></i>반려
          </button>
        </div>
      \` : \`
        <div class="pb-6">
          <button onclick="goBack()" class="btn btn-gray w-full">목록으로 돌아가기</button>
        </div>
      \`}
    \`;
  } catch(e) {
    document.getElementById('content').innerHTML = '<div class="card text-center py-8 text-red-400">불러올 수 없습니다</div>';
  }
}

// 첨부파일 보기 - 토큰 인증 후 Blob URL로 열기
async function viewFile(key, label) {
  showToast(label + ' 불러오는 중...', 'info');
  try {
    const token = localStorage.getItem('ev_token');
    const res = await fetch('/api/stations/files/' + key, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('파일을 불러올 수 없습니다.');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    // PDF면 새 탭, 이미지면 새 탭 미리보기
    window.open(url, '_blank');
  } catch(e) {
    showToast(e.message || '파일 오류', 'error');
  }
}

async function approveApp(id) {
  showDialog({
    icon: '✅',
    title: '승인',
    msg: '이 신청을 승인하시겠습니까?',
    confirmText: '승인',
    onConfirm: async () => {
      try {
        await API.post('/admin/applications/' + id + '/approve', {});
        showToast('승인되었습니다!');
        setTimeout(() => goBack(), 800);
      } catch(e) { showToast(e.message, 'error'); }
    }
  });
}

function openRejectModal(id) {
  _appId = id;
  document.getElementById('rejectReason').value = '';
  openModal('rejectModal');
}
async function submitReject() {
  const reason = document.getElementById('rejectReason').value.trim();
  if (!reason) return showToast('반려 사유를 입력해주세요.', 'error');
  try {
    await API.post('/admin/applications/' + _appId + '/reject', { reason });
    showToast('반려되었습니다.');
    closeModal('rejectModal');
    setTimeout(() => goBack(), 800);
  } catch(e) { showToast(e.message, 'error'); }
}
</script>
`)}



export function adminStationsPage(): string {
  return htmlPage('주유소 관리', `
${ADMIN_NAV}
<div class="main-content min-h-screen p-4 md:p-6 pt-16 md:pt-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-bold text-gray-800">주유소 관리</h2>
  </div>

  <div class="flex gap-2 mb-4">
    <input id="keyword" type="search" placeholder="주유소명 검색" class="input" oninput="debounce()">
  </div>
  <p class="text-xs text-gray-400 mb-3" id="total_info"></p>
  <div id="list" class="space-y-2"></div>
  <div id="pagination" class="flex justify-center gap-2 mt-4"></div>
</div>

<!-- 상세 모달 -->
<div id="detailModal" class="modal-bg hidden" onclick="closeStationModal()">
  <div class="modal overflow-y-auto" style="max-height:85vh" onclick="event.stopPropagation()">
    <div class="modal-handle"></div>
    <div id="modalContent"></div>
  </div>
</div>

<script>
let debTimer, currentPage = 1;
function debounce() { clearTimeout(debTimer); debTimer = setTimeout(() => loadStations(1), 400); }
window.addEventListener('DOMContentLoaded', () => { requireAuth('admin'); loadStations(1); });

async function loadStations(page) {
  currentPage = page;
  const kw = document.getElementById('keyword').value;
  const el = document.getElementById('list');
  el.innerHTML = '<div class="card text-center py-8"><i class="fas fa-spinner fa-spin text-green-400"></i></div>';
  try {
    const r = await API.get('/admin/stations?page='+page+(kw?'&keyword='+encodeURIComponent(kw):''));
    document.getElementById('total_info').textContent = '총 '+r.total+'개';
    el.innerHTML = (r.stations||[]).map(s=>\`
      <div class="card cursor-pointer hover:shadow-md transition-shadow" onclick="showDetail(\${s.id})">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-gray-800">\${s.station_name}</h3>
            <p class="text-xs text-gray-400">\${s.address}</p>
            <p class="text-xs text-gray-400">\${s.owner_name} · \${s.owner_email}</p>
          </div>
          <div class="text-right">
            \${s.is_closed?'<span class="badge badge-red">폐업</span>':s.is_active?'<span class="badge badge-green">운영중</span>':'<span class="badge badge-gray">비활성</span>'}
            <p class="text-xs text-gray-300 mt-1">쿠폰\${s.coupon_count}종</p>
          </div>
        </div>
      </div>
    \`).join('') || '<div class="card text-center py-8 text-gray-400">결과가 없습니다</div>';
  } catch {}
}

async function showDetail(id) {
  document.getElementById('detailModal').classList.remove('hidden');
  document.getElementById('modalContent').innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-green-400"></i></div>';
  try {
    const r = await API.get('/admin/stations/' + id);
    const s = r.station;
    const washLabel = s.car_wash_type === 'automatic' ? '자동 세차기' : s.car_wash_type === 'self' ? '셀프 세차' : '자동+셀프';

    // QR 이미지 Blob URL 미리 로드
    const token = localStorage.getItem('ev_token');
    const qrApiUrl = '/api/stations/my-stations/' + id + '/qr-image?token=' + encodeURIComponent(token);
    let qrBlobUrl = '';
    try {
      const res = await fetch(qrApiUrl);
      if (res.ok) qrBlobUrl = URL.createObjectURL(await res.blob());
    } catch {}

    document.getElementById('modalContent').innerHTML = \`
      <!-- 주유소명 + 상태 -->
      <div class="flex items-start justify-between mb-4">
        <h3 class="font-bold text-lg text-gray-800 flex-1 mr-3">\${s.station_name}</h3>
        \${s.is_closed ? '<span class="badge badge-red">폐업</span>' : s.is_active ? '<span class="badge badge-green">운영중</span>' : '<span class="badge badge-gray">비활성</span>'}
      </div>

      <!-- 기본 정보 -->
      <div class="space-y-2 text-sm mb-4 bg-gray-50 rounded-xl p-3">
        <div class="flex justify-between gap-3"><span class="text-gray-400 flex-shrink-0">주소</span><span class="text-right text-gray-700">\${s.address}\${s.address_detail ? ' ' + s.address_detail : ''}</span></div>
        <div class="flex justify-between gap-3"><span class="text-gray-400 flex-shrink-0">전화</span><span class="text-gray-700">\${s.phone || '-'}</span></div>
        <div class="flex justify-between gap-3"><span class="text-gray-400 flex-shrink-0">세차유형</span><span class="text-gray-700">\${washLabel}</span></div>
        <div class="flex justify-between gap-3"><span class="text-gray-400 flex-shrink-0">사업자번호</span><span class="text-gray-700 font-mono">\${s.business_reg_number}</span></div>
        <div class="flex justify-between gap-3"><span class="text-gray-400 flex-shrink-0">정산계좌</span><span class="text-right text-gray-700">\${s.bank_name} \${s.account_number}<br><span class="text-xs text-gray-400">(\${s.account_holder})</span></span></div>
        <div class="flex justify-between gap-3"><span class="text-gray-400 flex-shrink-0">사장님</span><span class="text-right text-gray-700">\${s.owner_name}<br><span class="text-xs text-gray-400">\${s.owner_email || ''}</span></span></div>
        <div class="flex justify-between gap-3"><span class="text-gray-400 flex-shrink-0">등록일</span><span class="text-gray-700">\${formatDate(s.created_at)}</span></div>
      </div>

      <!-- QR 코드 섹션 -->
      <div class="bg-gray-50 rounded-xl p-3 mb-4">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-semibold text-gray-700 text-sm"><i class="fas fa-qrcode text-green-400 mr-2"></i>QR 코드</h4>
          <button onclick="printQR('\${id}', '\${s.station_name}', '\${s.address}')"
            class="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-green-600">
            <i class="fas fa-print"></i> 인쇄
          </button>
        </div>
        \${qrBlobUrl ? \`
          <div class="flex flex-col items-center">
            <img src="\${qrBlobUrl}" alt="QR코드" width="180" height="180"
              class="rounded-lg border border-gray-200 mb-2">
            <p class="text-xs text-gray-300 break-all text-center">\${s.qr_code || ''}</p>
          </div>
        \` : '<p class="text-xs text-red-400 text-center py-3">QR 코드를 불러올 수 없습니다.</p>'}
      </div>

      <!-- 액션 버튼 -->
      \${!s.is_closed ? \`<button onclick="closeStation(\${s.id})" class="btn btn-danger w-full mb-3"><i class="fas fa-store-slash mr-2"></i>폐업 처리 (미사용 쿠폰 환불)</button>\` : ''}
      <button onclick="closeStationModal()" class="btn btn-gray w-full">닫기</button>
    \`;
  } catch(e) {
    document.getElementById('modalContent').innerHTML = '<p class="text-red-400 text-center py-4">불러올 수 없습니다: ' + (e.message||'') + '</p>';
  }
}

// QR 인쇄 전용 팝업 (코팅 인쇄용 고품질)
async function printQR(stationId, stationName, address) {
  const token = localStorage.getItem('ev_token');
  const qrApiUrl = '/api/stations/my-stations/' + stationId + '/qr-image?token=' + encodeURIComponent(token);

  try {
    const res = await fetch(qrApiUrl);
    if (!res.ok) throw new Error('QR 이미지 로드 실패');
    const blob = await res.blob();
    const qrUrl = URL.createObjectURL(blob);

    const win = window.open('', '_blank', 'width=600,height=700');
    win.document.write(\`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>QR 코드 인쇄 - \${stationName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; background:#fff; }
    .print-page {
      width: 148mm; /* A5 가로 */
      min-height: 105mm;
      margin: 0 auto;
      padding: 10mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      margin-top: 10mm;
    }
    .logo { font-size: 28px; margin-bottom: 4px; }
    .brand { font-size: 18px; font-weight: 800; color: #10b981; margin-bottom: 2px; }
    .station-name { font-size: 22px; font-weight: 700; color: #1f2937; margin: 8px 0 2px; }
    .address { font-size: 11px; color: #6b7280; margin-bottom: 12px; }
    .qr-wrap { background:#f9fafb; padding:12px; border-radius:12px; margin-bottom:12px; border:1px solid #e5e7eb; }
    .qr-wrap img { width:200px; height:200px; display:block; }
    .guide { font-size: 13px; color: #374151; font-weight: 600; margin-bottom: 4px; }
    .guide-sub { font-size: 11px; color: #9ca3af; margin-bottom: 12px; }
    .divider { width:100%; border-top:1px dashed #d1d5db; margin:8px 0; }
    .steps { display:flex; gap:16px; justify-content:center; margin-top:6px; }
    .step { display:flex; flex-direction:column; align-items:center; gap:4px; }
    .step-num { width:22px; height:22px; background:#10b981; color:#fff; border-radius:50%; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; }
    .step-text { font-size:10px; color:#6b7280; text-align:center; max-width:60px; line-height:1.3; }
    .footer { font-size:10px; color:#d1d5db; margin-top:10px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display:none; }
      .print-page { border:2px solid #e5e7eb !important; margin-top:0; }
    }
  </style>
</head>
<body>
<div class="no-print" style="text-align:center;padding:12px;background:#f0fdf4;border-bottom:1px solid #a7f3d0">
  <button onclick="window.print()" style="background:#10b981;color:#fff;border:none;padding:8px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-right:8px">
    🖨️ 인쇄하기
  </button>
  <span style="font-size:12px;color:#6b7280">인쇄 후 코팅하여 주유소에 부착해주세요</span>
</div>
<div class="print-page">
  <div class="logo">⚡</div>
  <div class="brand">EV-Wash</div>
  <div class="station-name">\${stationName}</div>
  <div class="address">\${address}</div>
  <div class="qr-wrap">
    <img src="\${qrUrl}" alt="QR코드">
  </div>
  <div class="guide">세차 완료 후 QR 코드를 스캔해주세요</div>
  <div class="guide-sub">EV-Wash 앱 → 내 쿠폰 → QR 스캔</div>
  <div class="divider"></div>
  <div class="steps">
    <div class="step">
      <div class="step-num">1</div>
      <div class="step-text">앱 실행</div>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <div class="step-text">내 쿠폰 선택</div>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <div class="step-text">QR 스캔</div>
    </div>
    <div class="step">
      <div class="step-num">4</div>
      <div class="step-text">사용 완료</div>
    </div>
  </div>
  <div class="footer">www.ev-wash.com</div>
</div>
</body>
</html>\`);
    win.document.close();
    setTimeout(() => URL.revokeObjectURL(qrUrl), 30000);
  } catch(e) { showToast('인쇄 준비 실패: ' + e.message, 'error'); }
}

async function closeStation(id) {
  showDialog({
    icon: '⚠️',
    title: '폐업 처리',
    msg: '폐업 처리하시겠습니까?\n미사용 쿠폰이 모두 환불됩니다.',
    confirmText: '폐업 처리',
    confirmClass: 'btn-danger',
    onConfirm: async () => {
      try {
        const r = await API.post('/admin/stations/' + id + '/close', {});
        showToast(r.message);
        closeStationModal();
        loadStations(currentPage);
      } catch(e) { showToast(e.message, 'error'); }
    }
  });
}

function closeStationModal() { closeModal('detailModal'); }
</script>
`)
}

export function adminUsersPage(): string {
  return htmlPage('회원 관리', `
${ADMIN_NAV}
<div class="main-content min-h-screen p-4 md:p-6 pt-16 md:pt-6">
  <h2 class="text-xl font-bold text-gray-800 mb-4">회원 관리</h2>

  <div class="flex gap-2 mb-4 flex-wrap">
    <input id="keyword" type="search" placeholder="이름 또는 이메일" class="input" style="max-width:200px" oninput="debounce()">
    <select id="userType" class="input" style="max-width:140px" onchange="loadUsers(1)">
      <option value="">전체</option>
      <option value="customer">고객</option>
      <option value="station_owner">사장님</option>
      <option value="admin">관리자</option>
    </select>
  </div>
  <p class="text-xs text-gray-400 mb-3" id="total_info"></p>

  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="text-xs text-gray-400 border-b border-gray-100">
          <th class="text-left py-2 px-1">이름</th>
          <th class="text-left py-2 px-1">이메일</th>
          <th class="text-left py-2 px-1">유형</th>
          <th class="text-left py-2 px-1">가입일</th>
          <th class="text-left py-2 px-1">상태</th>
          <th class="py-2 px-1"></th>
        </tr>
      </thead>
      <tbody id="tbody"></tbody>
    </table>
  </div>
  <div id="pagination" class="flex justify-center gap-2 mt-4"></div>
</div>

<script>
let debTimer, currentPage = 1;
function debounce() { clearTimeout(debTimer); debTimer = setTimeout(() => loadUsers(1), 400); }
window.addEventListener('DOMContentLoaded', () => { requireAuth('admin'); loadUsers(1); });

async function loadUsers(page) {
  currentPage = page;
  const kw = document.getElementById('keyword').value;
  const ut = document.getElementById('userType').value;
  try {
    const r = await API.get('/admin/users?page='+page+(kw?'&keyword='+encodeURIComponent(kw):'')+(ut?'&user_type='+ut:''));
    document.getElementById('total_info').textContent = '총 '+r.total+'명';
    const tb = document.getElementById('tbody');
    tb.innerHTML = (r.users||[]).map(u=>\`
      <tr class="border-b border-gray-50 hover:bg-gray-50">
        <td class="py-2 px-1 font-medium">\${u.name}</td>
        <td class="py-2 px-1 text-gray-400">\${u.email||u.social_provider||'-'}</td>
        <td class="py-2 px-1"><span class="badge \${u.user_type==='admin'?'badge-red':u.user_type==='station_owner'?'badge-amber':'badge-green'}">\${u.user_type==='admin'?'관리자':u.user_type==='station_owner'?'사장님':'고객'}</span></td>
        <td class="py-2 px-1 text-gray-400">\${formatDate(u.created_at)}</td>
        <td class="py-2 px-1"><span class="badge \${u.is_active?'badge-green':'badge-red'}">\${u.is_active?'활성':'비활성'}</span></td>
        <td class="py-2 px-1">
          <button onclick="toggleUser(\${u.id})" class="text-xs text-gray-400 hover:text-gray-700">
            \${u.is_active?'비활성화':'활성화'}
          </button>
        </td>
      </tr>
    \`).join('') || '<tr><td colspan="6" class="text-center py-8 text-gray-400">결과가 없습니다</td></tr>';
  } catch {}
}

async function toggleUser(id) {
  try {
    const r = await API.patch('/admin/users/'+id+'/toggle', {});
    showToast(r.message);
    loadUsers(currentPage);
  } catch(e) { showToast(e.message, 'error'); }
}
</script>
`)
}

export function adminPaymentsPage(): string {
  return htmlPage('결제 내역', `
${ADMIN_NAV}
<div class="main-content min-h-screen p-4 md:p-6 pt-16 md:pt-6">
  <h2 class="text-xl font-bold text-gray-800 mb-4">결제 내역</h2>

  <select id="status" class="input mb-4" style="max-width:150px" onchange="loadPayments(1)">
    <option value="">전체 상태</option>
    <option value="active">활성</option>
    <option value="used">사용완료</option>
    <option value="refunded">환불됨</option>
    <option value="partial_refunded">부분환불</option>
  </select>
  <p class="text-xs text-gray-400 mb-3" id="total_info"></p>

  <div class="overflow-x-auto">
    <table class="w-full text-sm min-w-max">
      <thead>
        <tr class="text-xs text-gray-400 border-b">
          <th class="text-left py-2 px-1">주문ID</th>
          <th class="text-left py-2 px-1">구매자</th>
          <th class="text-left py-2 px-1">주유소</th>
          <th class="text-left py-2 px-1">쿠폰</th>
          <th class="text-right py-2 px-1">금액</th>
          <th class="text-left py-2 px-1">상태</th>
          <th class="text-left py-2 px-1">날짜</th>
        </tr>
      </thead>
      <tbody id="tbody"></tbody>
    </table>
  </div>
  <div id="pagination" class="flex justify-center gap-2 mt-4"></div>
</div>

<script>
let currentPage = 1;
window.addEventListener('DOMContentLoaded', () => { requireAuth('admin'); loadPayments(1); });

async function loadPayments(page) {
  currentPage = page;
  const status = document.getElementById('status').value;
  try {
    const r = await API.get('/admin/payments?page='+page+(status?'&status='+status:''));
    document.getElementById('total_info').textContent = '총 '+r.total+'건';
    document.getElementById('tbody').innerHTML = (r.payments||[]).map(p=>\`
      <tr class="border-b border-gray-50 hover:bg-gray-50">
        <td class="py-2 px-1 text-xs text-gray-400">\${p.order_id?.slice(-10)}</td>
        <td class="py-2 px-1">\${p.user_name}</td>
        <td class="py-2 px-1 text-gray-600">\${p.station_name}</td>
        <td class="py-2 px-1 text-gray-600">\${p.coupon_title}</td>
        <td class="py-2 px-1 text-right font-medium">\${formatPrice(p.total_amount)}</td>
        <td class="py-2 px-1"><span class="badge \${p.status==='active'?'badge-green':p.status==='refunded'?'badge-red':p.status==='used'?'badge-gray':'badge-amber'}">\${p.status}</span></td>
        <td class="py-2 px-1 text-xs text-gray-400">\${formatDate(p.created_at)}</td>
      </tr>
    \`).join('');
  } catch {}
}
</script>
`)
}

export function adminSettlementPage(): string {
  return htmlPage('정산 관리', `
${ADMIN_NAV}
<div class="main-content min-h-screen p-4 md:p-6 pt-16 md:pt-6">
  <h2 class="text-xl font-bold text-gray-800 mb-4">정산 관리</h2>

  <!-- 정산 실행 -->
  <div class="card mb-6">
    <h3 class="font-semibold text-gray-700 mb-3">익일 정산 처리</h3>
    <div class="flex gap-3 items-end flex-wrap">
      <div>
        <label class="text-xs text-gray-400 mb-1 block">정산 기준일</label>
        <input type="date" id="settleDate" class="input" style="max-width:160px">
      </div>
      <button onclick="loadPending()" class="btn btn-outline btn-sm" style="width:auto;padding:10px 16px">
        <i class="fas fa-search mr-1"></i> 정산 대상 조회
      </button>
      <button onclick="processAll()" class="btn btn-primary btn-sm" style="width:auto;padding:10px 16px">
        <i class="fas fa-check mr-1"></i> 전체 정산 처리
      </button>
    </div>
    <div id="pendingList" class="mt-4"></div>
  </div>

  <!-- 정산 내역 -->
  <h3 class="section-title">정산 내역</h3>
  <div id="list" class="space-y-2"></div>
</div>

<script>
window.addEventListener('DOMContentLoaded', () => {
  requireAuth('admin');
  const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
  document.getElementById('settleDate').value = yesterday;
  loadSettlements();
});

async function loadPending() {
  const date = document.getElementById('settleDate').value;
  const el = document.getElementById('pendingList');
  el.innerHTML = '<i class="fas fa-spinner fa-spin text-green-400"></i>';
  try {
    const r = await API.get('/admin/settlements/pending?date=' + date);
    const items = r.items || [];
    if (!items.length) { el.innerHTML = '<p class="text-gray-400 text-sm">정산 대상이 없습니다.</p>'; return; }
    el.innerHTML = \`
      <p class="text-xs text-gray-400 mb-2">\${date} 기준 \${items.length}개 주유소 · 수수료율 \${Math.round(r.fee_rate*100)}%</p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-max">
          <thead><tr class="text-xs text-gray-400 border-b">
            <th class="text-left py-1">주유소</th>
            <th class="text-right py-1">사용금액</th>
            <th class="text-right py-1">수수료</th>
            <th class="text-right py-1">지급액</th>
            <th class="text-left py-1">계좌</th>
          </tr></thead>
          <tbody>
            \${items.map(i=>\`
              <tr class="border-b border-gray-50">
                <td class="py-1">\${i.station_name}</td>
                <td class="py-1 text-right">\${formatPrice(i.gross_amount)}</td>
                <td class="py-1 text-right text-red-400">\${formatPrice(i.platform_fee)}</td>
                <td class="py-1 text-right font-bold text-green-600">\${formatPrice(i.net_amount)}</td>
                <td class="py-1 text-xs text-gray-400">\${i.bank_name} \${i.account_number}</td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      </div>
    \`;
  } catch(e) { el.innerHTML = '<p class="text-red-400 text-sm">'+e.message+'</p>'; }
}

async function processAll() {
  const date = document.getElementById('settleDate').value;
  showDialog({
    icon: '💰',
    title: '정산 처리',
    msg: date + ' 기준 정산을 처리하시겠습니까?',
    confirmText: '처리',
    onConfirm: async () => {
      try {
        const r = await API.post('/admin/settlements/process', { date });
        showToast(r.message);
        loadSettlements();
        document.getElementById('pendingList').innerHTML = '';
      } catch(e) { showToast(e.message, 'error'); }
    }
  });
}

async function loadSettlements() {
  const el = document.getElementById('list');
  el.innerHTML = '<div class="card text-center py-6"><i class="fas fa-spinner fa-spin text-green-400"></i></div>';
  try {
    const r = await API.get('/admin/settlements');
    el.innerHTML = (r.settlements||[]).map(s=>\`
      <div class="card">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-medium text-gray-800">\${s.station_name}</h3>
            <p class="text-xs text-gray-400">\${s.settlement_date} · \${s.usage_count}건</p>
            <p class="text-xs text-gray-400">\${s.bank_name} \${s.account_number} (\${s.account_holder})</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-green-600">\${formatPrice(s.net_amount)}</p>
            <p class="text-xs text-gray-300">수수료 \${formatPrice(s.platform_fee)}</p>
            <span class="badge \${s.status==='completed'?'badge-green':'badge-amber'}">\${s.status==='completed'?'완료':'처리중'}</span>
          </div>
        </div>
      </div>
    \`).join('') || '<div class="card text-center py-8 text-gray-400">정산 내역이 없습니다</div>';
  } catch {}
}
</script>
`)
}

export function adminSettingsPage(): string {
  return htmlPage('설정', `
${ADMIN_NAV}
<div class="main-content min-h-screen p-4 md:p-6 pt-16 md:pt-6">
  <h2 class="text-xl font-bold text-gray-800 mb-4">플랫폼 설정</h2>

  <div id="settings" class="space-y-4"></div>
</div>

<script>
window.addEventListener('DOMContentLoaded', async () => {
  requireAuth('admin');
  try {
    const r = await API.get('/admin/settings');
    const el = document.getElementById('settings');
    el.innerHTML = (r.settings||[]).map(s=>\`
      <div class="card">
        <label class="text-xs text-gray-400 mb-1 block">\${s.description || s.key}</label>
        <div class="flex gap-2">
          <input id="setting_\${s.key}" value="\${s.value}" class="input" style="flex:1">
          <button onclick="saveSetting('\${s.key}')" class="btn btn-primary btn-sm" style="width:auto;padding:10px 16px">저장</button>
        </div>
        \${s.key==='platform_fee_rate'?'<p class="text-xs text-gray-300 mt-1">0~1 사이 숫자 (예: 0.15 = 15%)</p>':''}
      </div>
    \`).join('');
  } catch {}
});

async function saveSetting(key) {
  const value = document.getElementById('setting_' + key).value;
  try {
    await API.put('/admin/settings/' + key, { value });
    showToast('저장되었습니다.');
  } catch(e) { showToast(e.message, 'error'); }
}
</script>
`)
}
