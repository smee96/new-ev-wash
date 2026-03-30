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
    <button onclick="loadApps('pending')" id="btn_pending" class="tab-btn-active flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-green-500 text-white">심사 대기</button>
    <button onclick="loadApps('approved')" id="btn_approved" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600">승인됨</button>
    <button onclick="loadApps('rejected')" id="btn_rejected" class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600">반려됨</button>
  </div>

  <div id="list" class="space-y-3"></div>
</div>

<!-- 상세 모달 -->
<div id="detailModal" class="modal-bg hidden" onclick="closeAppModal()">
  <div class="modal overflow-y-auto" onclick="event.stopPropagation()" style="max-height:85vh">
    <div class="modal-handle"></div>
    <div id="modalContent"></div>
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
let currentStatus = 'pending', _rejectId = null;
window.addEventListener('DOMContentLoaded', () => { requireAuth('admin'); loadApps('pending'); });

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
      <div class="card cursor-pointer hover:shadow-md transition-shadow" onclick="showDetail(\${a.id})">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-gray-800">\${a.station_name}</h3>
            <p class="text-xs text-gray-400 mt-0.5">\${a.address}</p>
            <p class="text-xs text-gray-400">\${a.owner_email || ''} · \${a.owner_phone || ''}</p>
          </div>
          <div class="text-right ml-3">
            <span class="badge \${a.status==='approved'?'badge-green':a.status==='rejected'?'badge-red':'badge-amber'}">
              \${a.status==='approved'?'승인':a.status==='rejected'?'반려':'대기'}
            </span>
            <p class="text-xs text-gray-300 mt-1">\${formatDate(a.created_at)}</p>
          </div>
        </div>
        \${a.reject_reason?'<p class="text-xs text-red-400 mt-2"><i class="fas fa-exclamation-circle mr-1"></i>'+a.reject_reason+'</p>':''}
      </div>
    \`).join('');
  } catch { el.innerHTML = '<div class="card text-center py-8 text-red-400">불러올 수 없습니다</div>'; }
}

async function showDetail(id) {
  document.getElementById('detailModal').classList.remove('hidden');
  document.getElementById('modalContent').innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-green-400 text-xl"></i></div>';
  try {
    const r = await API.get('/admin/applications/' + id);
    const a = r.application;
    document.getElementById('modalContent').innerHTML = \`
      <h3 class="font-bold text-gray-800 mb-4 text-lg">\${a.station_name}</h3>
      <div class="space-y-2 text-sm mb-4">
        <div class="flex justify-between"><span class="text-gray-400">주소</span><span class="text-gray-700">\${a.address}\${a.address_detail?' '+a.address_detail:''}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">전화</span><span>\${a.phone||'-'}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">세차유형</span><span>\${a.car_wash_type==='automatic'?'자동':a.car_wash_type==='self'?'셀프':'자동+셀프'}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">사업자번호</span><span>\${a.business_reg_number}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">은행</span><span>\${a.bank_name}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">계좌</span><span>\${a.account_number}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">예금주</span><span>\${a.account_holder}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">신청자</span><span>\${a.owner_name} (\${a.owner_email})</span></div>
        <div class="flex justify-between"><span class="text-gray-400">신청일</span><span>\${formatDate(a.created_at)}</span></div>
      </div>
      \${a.business_reg_image_key?'<a href="/api/stations/files/'+a.business_reg_image_key+'" target="_blank" class="btn btn-outline btn-sm mb-2">사업자등록증 보기</a>':''}
      \${a.account_image_key?'<a href="/api/stations/files/'+a.account_image_key+'" target="_blank" class="btn btn-outline btn-sm mb-4">통장사본 보기</a>':''}
      \${a.status === 'pending' ? \`
        <div class="flex gap-3 mt-4">
          <button onclick="approveApp(\${a.id})" class="btn btn-primary" style="flex:1">승인</button>
          <button onclick="openRejectModal(\${a.id})" class="btn btn-danger" style="flex:1">반려</button>
        </div>
      \` : ''}
      \${a.status === 'rejected' ? '<p class="text-sm text-red-400 mt-3"><b>반려사유:</b> '+a.reject_reason+'</p>' : ''}
      <button onclick="closeAppModal()" class="btn btn-gray mt-3">닫기</button>
    \`;
  } catch { document.getElementById('modalContent').innerHTML = '<p class="text-red-400">불러올 수 없습니다</p>'; }
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
        closeAppModal();
        loadApps(currentStatus);
      } catch(e) { showToast(e.message, 'error'); }
    }
  });
}

function openRejectModal(id) {
  _rejectId = id;
  document.getElementById('rejectReason').value = '';
  openModal('rejectModal');
}
async function submitReject() {
  const reason = document.getElementById('rejectReason').value.trim();
  if (!reason) return showToast('반려 사유를 입력해주세요.', 'error');
  try {
    await API.post('/admin/applications/' + _rejectId + '/reject', { reason });
    showToast('반려되었습니다.');
    closeModal('rejectModal');
    closeAppModal();
    loadApps(currentStatus);
  } catch(e) { showToast(e.message, 'error'); }
}

function closeAppModal() { closeModal('detailModal'); }
</script>
`)
}

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
    document.getElementById('modalContent').innerHTML = \`
      <h3 class="font-bold text-lg text-gray-800 mb-4">\${s.station_name}</h3>
      <div class="space-y-2 text-sm mb-4">
        <div class="flex justify-between"><span class="text-gray-400">주소</span><span>\${s.address}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">전화</span><span>\${s.phone||'-'}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">사업자번호</span><span>\${s.business_reg_number}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">계좌</span><span>\${s.bank_name} \${s.account_number} (\${s.account_holder})</span></div>
        <div class="flex justify-between"><span class="text-gray-400">사장님</span><span>\${s.owner_name} (\${s.owner_email})</span></div>
        <div class="flex justify-between"><span class="text-gray-400">등록일</span><span>\${formatDate(s.created_at)}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">상태</span><span>\${s.is_closed?'폐업':s.is_active?'운영중':'비활성'}</span></div>
      </div>
      \${!s.is_closed ? \`<button onclick="closeStation(\${s.id})" class="btn btn-danger mb-3">폐업 처리 (미사용 쿠폰 환불)</button>\` : ''}
      <button onclick="closeStationModal()" class="btn btn-gray">닫기</button>
    \`;
  } catch {}
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
