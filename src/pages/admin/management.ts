// 관리자 회원관리, 결제내역, 정산관리, 설정 페이지
import { htmlPage } from '../layout'
import { ADMIN_NAV } from './layout'

export function adminUsersPage(): string {
  return htmlPage('회원 관리', `
${ADMIN_NAV}
<div class="main-content p-4 md:p-6 pt-16 md:pt-6">
  <div class="mb-5">
    <h2 class="text-xl font-bold" style="color:#0a1628">회원 관리</h2>
  </div>

  <div class="flex gap-2 mb-4 flex-wrap">
    <input id="keyword" type="search" placeholder="이름 또는 이메일" class="input" style="max-width:200px" oninput="debounce()">
    <select id="userType" class="input" style="max-width:140px" onchange="loadUsers(1)">
      <option value="">전체</option>
      <option value="customer">고객</option>
      <option value="station_owner">사장님</option>
      <option value="admin">관리자</option>
    </select>
  </div>
  <p class="text-xs mb-3" style="color:#8e9ab4" id="total_info"></p>

  <div class="overflow-x-auto admin-card">
    <table class="w-full text-sm">
      <thead>
        <tr class="text-xs border-b" style="color:#8e9ab4;border-color:#eef1f7">
          <th class="text-left py-2 px-2">이름</th>
          <th class="text-left py-2 px-2">이메일</th>
          <th class="text-left py-2 px-2">유형</th>
          <th class="text-left py-2 px-2">가입일</th>
          <th class="text-left py-2 px-2">상태</th>
          <th class="py-2 px-2"></th>
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
      <tr class="border-b hover:bg-solarate" style="border-color:#eef1f7">
        <td class="py-2 px-2 font-medium" style="color:#0a1628">\${u.name}</td>
        <td class="py-2 px-2" style="color:#8e9ab4">\${u.email||u.social_provider||'-'}</td>
        <td class="py-2 px-2"><span class="badge \${u.user_type==='admin'?'badge-red':u.user_type==='station_owner'?'badge-amber':'badge-green'}">\${u.user_type==='admin'?'관리자':u.user_type==='station_owner'?'사장님':'고객'}</span></td>
        <td class="py-2 px-2" style="color:#8e9ab4">\${formatDate(u.created_at)}</td>
        <td class="py-2 px-2"><span class="badge \${u.is_active?'badge-green':'badge-red'}">\${u.is_active?'활성':'비활성'}</span></td>
        <td class="py-2 px-2">
          <button onclick="toggleUser(\${u.id})" class="text-xs" style="color:#8e9ab4;background:none;border:none;cursor:pointer">
            \${u.is_active?'비활성화':'활성화'}
          </button>
        </td>
      </tr>
    \`).join('') || '<tr><td colspan="6" class="text-center py-8" style="color:#8e9ab4">결과가 없습니다</td></tr>';
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
<div class="main-content p-4 md:p-6 pt-16 md:pt-6">
  <div class="mb-5">
    <h2 class="text-xl font-bold" style="color:#0a1628">결제 내역</h2>
  </div>

  <select id="status" class="input mb-4" style="max-width:150px" onchange="loadPayments(1)">
    <option value="">전체 상태</option>
    <option value="active">활성</option>
    <option value="used">사용완료</option>
    <option value="refunded">환불됨</option>
    <option value="partial_refunded">부분환불</option>
  </select>
  <p class="text-xs mb-3" style="color:#8e9ab4" id="total_info"></p>

  <div class="overflow-x-auto admin-card">
    <table class="w-full text-sm min-w-max">
      <thead>
        <tr class="text-xs border-b" style="color:#8e9ab4;border-color:#eef1f7">
          <th class="text-left py-2 px-2">주문ID</th>
          <th class="text-left py-2 px-2">구매자</th>
          <th class="text-left py-2 px-2">주유소</th>
          <th class="text-left py-2 px-2">쿠폰</th>
          <th class="text-right py-2 px-2">금액</th>
          <th class="text-left py-2 px-2">상태</th>
          <th class="text-left py-2 px-2">날짜</th>
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
      <tr class="border-b" style="border-color:#eef1f7">
        <td class="py-2 px-2 text-xs" style="color:#8e9ab4">\${p.order_id?.slice(-10)}</td>
        <td class="py-2 px-2" style="color:#0a1628">\${p.user_name}</td>
        <td class="py-2 px-2" style="color:#4a5568">\${p.station_name}</td>
        <td class="py-2 px-2" style="color:#4a5568">\${p.coupon_title}</td>
        <td class="py-2 px-2 text-right font-medium" style="color:#0a1628">\${formatPrice(p.total_amount)}</td>
        <td class="py-2 px-2"><span class="badge \${p.status==='active'?'badge-green':p.status==='refunded'?'badge-red':p.status==='used'?'badge-gray':'badge-amber'}">\${p.status}</span></td>
        <td class="py-2 px-2 text-xs" style="color:#8e9ab4">\${formatDate(p.created_at)}</td>
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
<div class="main-content p-4 md:p-6 pt-16 md:pt-6">
  <div class="mb-5">
    <h2 class="text-xl font-bold" style="color:#0a1628">정산 관리</h2>
  </div>

  <!-- 정산 실행 -->
  <div class="admin-card mb-6">
    <h3 class="font-semibold mb-3" style="color:#1a2f5e">익일 정산 처리</h3>
    <div class="flex gap-3 items-end flex-wrap">
      <div>
        <label class="text-xs mb-1 block" style="color:#8e9ab4">정산 기준일</label>
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
  // KST 어제 날짜 (UTC+9 기준)
  const kstYesterday = new Date(Date.now() + 9*60*60*1000 - 86400000).toISOString().substring(0,10);
  document.getElementById('settleDate').value = kstYesterday;
  loadSettlements();
});

async function loadPending() {
  const date = document.getElementById('settleDate').value;
  const el = document.getElementById('pendingList');
  el.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#84cc16"></i>';
  try {
    const r = await API.get('/admin/settlements/pending?date=' + date);
    const items = r.items || [];
    if (!items.length) { el.innerHTML = '<p class="text-sm" style="color:#8e9ab4">정산 대상이 없습니다.</p>'; return; }
    el.innerHTML = \`
      <p class="text-xs mb-2" style="color:#8e9ab4">\${date} 기준 \${items.length}개 주유소 · 수수료율 \${Math.round(r.fee_rate*100)}%</p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-max">
          <thead><tr class="text-xs border-b" style="color:#8e9ab4;border-color:#eef1f7">
            <th class="text-left py-1 px-1">주유소</th>
            <th class="text-right py-1 px-1">사용금액</th>
            <th class="text-right py-1 px-1">수수료</th>
            <th class="text-right py-1 px-1">지급액</th>
            <th class="text-left py-1 px-1">계좌</th>
          </tr></thead>
          <tbody>
            \${items.map(i=>\`
              <tr class="border-b" style="border-color:#eef1f7">
                <td class="py-1 px-1" style="color:#0a1628">\${i.station_name}</td>
                <td class="py-1 px-1 text-right" style="color:#1a202c">\${formatPrice(i.gross_amount)}</td>
                <td class="py-1 px-1 text-right" style="color:#ef4444">\${formatPrice(i.platform_fee)}</td>
                <td class="py-1 px-1 text-right font-bold" style="color:#65a30d">\${formatPrice(i.net_amount)}</td>
                <td class="py-1 px-1 text-xs" style="color:#8e9ab4">\${i.bank_name} \${i.account_number}</td>
              </tr>
            \`).join('')}
          </tbody>
        </table>
      </div>
    \`;
  } catch(e) { el.innerHTML = '<p class="text-sm" style="color:#ef4444">'+e.message+'</p>'; }
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
  el.innerHTML = '<div class="admin-card text-center py-6"><i class="fas fa-spinner fa-spin" style="color:#84cc16"></i></div>';
  try {
    const r = await API.get('/admin/settlements');
    el.innerHTML = (r.settlements||[]).map(s=>\`
      <div class="admin-card">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-medium" style="color:#0a1628">\${s.station_name}</h3>
            <p class="text-xs" style="color:#8e9ab4">\${s.settlement_date} · \${s.usage_count}건</p>
            <p class="text-xs" style="color:#8e9ab4">\${s.bank_name} \${s.account_number} (\${s.account_holder})</p>
          </div>
          <div class="text-right">
            <p class="font-bold" style="color:#65a30d">\${formatPrice(s.net_amount)}</p>
            <p class="text-xs" style="color:#c0c8d8">수수료 \${formatPrice(s.platform_fee)}</p>
            <span class="badge \${s.status==='completed'?'badge-green':'badge-amber'}">\${s.status==='completed'?'완료':'처리중'}</span>
          </div>
        </div>
      </div>
    \`).join('') || '<div class="admin-card text-center py-8" style="color:#8e9ab4">정산 내역이 없습니다</div>';
  } catch {}
}
</script>
`)
}

export function adminSettingsPage(): string {
  return htmlPage('설정', `
${ADMIN_NAV}
<div class="main-content p-4 md:p-6 pt-16 md:pt-6">
  <div class="mb-5">
    <h2 class="text-xl font-bold" style="color:#0a1628">플랫폼 설정</h2>
  </div>

  <div id="settings" class="space-y-4"></div>
</div>

<script>
window.addEventListener('DOMContentLoaded', async () => {
  requireAuth('admin');
  try {
    const r = await API.get('/admin/settings');
    const el = document.getElementById('settings');
    el.innerHTML = (r.settings||[]).map(s=>\`
      <div class="admin-card">
        <label class="text-xs mb-1 block" style="color:#8e9ab4">\${s.description || s.key}</label>
        <div class="flex gap-2">
          <input id="setting_\${s.key}" value="\${s.value}" class="input" style="flex:1">
          <button onclick="saveSetting('\${s.key}')" class="btn btn-primary btn-sm" style="width:auto;padding:10px 16px">저장</button>
        </div>
        \${s.key==='platform_fee_rate'?'<p class="text-xs mt-1" style="color:#c0c8d8">0~1 사이 숫자 (예: 0.15 = 15%)</p>':''}
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
