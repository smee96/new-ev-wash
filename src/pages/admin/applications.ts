// 관리자 신청 심사 페이지 (목록 + 상세)
import { htmlPage } from '../layout'
import { ADMIN_NAV } from './layout'

export function adminApplicationsPage(): string {
  return htmlPage('신청 심사', `
${ADMIN_NAV}
<div class="main-content p-4 md:p-6 pt-16 md:pt-6">
  <div class="mb-5">
    <h2 class="text-xl font-bold" style="color:#0a1628">주유소 신청 심사</h2>
  </div>

  <!-- 상태 탭 -->
  <div class="flex gap-2 mb-4 overflow-x-auto pb-1">
    <button onclick="loadApps('pending')" id="btn_pending"
      class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium"
      style="background:#1a2f5e;color:#bef264">심사 대기</button>
    <button onclick="loadApps('approved')" id="btn_approved"
      class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium"
      style="background:#fff;color:#8e9ab4;border:1.5px solid #dde3ef">승인됨</button>
    <button onclick="loadApps('rejected')" id="btn_rejected"
      class="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium"
      style="background:#fff;color:#8e9ab4;border:1.5px solid #dde3ef">반려됨</button>
  </div>

  <div id="list" class="space-y-3"></div>
</div>
<script>
let currentStatus = 'pending';
window.addEventListener('DOMContentLoaded', () => {
  requireAuth('admin');
  const tab = new URLSearchParams(location.search).get('tab') || 'pending';
  loadApps(tab);
});

function setTabStyle(activeId) {
  ['pending','approved','rejected'].forEach(s => {
    const b = document.getElementById('btn_'+s);
    if (s === activeId) {
      b.style.background = '#1a2f5e';
      b.style.color = '#bef264';
      b.style.border = 'none';
    } else {
      b.style.background = '#fff';
      b.style.color = '#8e9ab4';
      b.style.border = '1.5px solid #dde3ef';
    }
  });
}

async function loadApps(status) {
  currentStatus = status;
  setTabStyle(status);
  const el = document.getElementById('list');
  el.innerHTML = '<div class="admin-card text-center py-8"><i class="fas fa-spinner fa-spin" style="color:#84cc16"></i></div>';
  try {
    const r = await API.get('/admin/applications?status=' + status);
    const apps = r.applications || [];
    if (!apps.length) { el.innerHTML = '<div class="admin-card text-center py-8" style="color:#8e9ab4">항목이 없습니다</div>'; return; }
    el.innerHTML = apps.map(a => \`
      <a href="/admin/applications/\${a.id}?from=\${status}" class="admin-card block hover:shadow-md transition-shadow active:scale-[0.99]" style="-webkit-tap-highlight-color:transparent;text-decoration:none">
        <div class="flex justify-between items-start">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold truncate" style="color:#0a1628">\${a.station_name}</h3>
            <p class="text-xs mt-0.5 truncate" style="color:#8e9ab4">\${a.address}</p>
            <p class="text-xs" style="color:#8e9ab4">\${a.owner_email || ''}\${a.owner_phone ? ' · ' + a.owner_phone : ''}</p>
          </div>
          <div class="text-right ml-3 flex-shrink-0">
            <span class="badge \${a.status==='approved'?'badge-green':a.status==='rejected'?'badge-red':'badge-amber'}">
              \${a.status==='approved'?'승인':a.status==='rejected'?'반려':'대기'}
            </span>
            <p class="text-xs mt-1" style="color:#c0c8d8">\${formatDate(a.created_at)}</p>
          </div>
        </div>
        \${a.reject_reason?'<p class="text-xs mt-2 truncate" style="color:#ef4444"><i class="fas fa-exclamation-circle mr-1"></i>'+a.reject_reason+'</p>':''}
      </a>
    \`).join('');
  } catch { el.innerHTML = '<div class="admin-card text-center py-8" style="color:#ef4444">불러올 수 없습니다</div>'; }
}
</script>
`)}

export function adminApplicationDetailPage(): string {
  return htmlPage('신청 심사 상세', `
${ADMIN_NAV}
<div class="main-content p-4 md:p-6 pt-16 md:pt-6">
  <div class="flex items-center gap-3 mb-5">
    <button onclick="goBack()" class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
      style="background:#fff;color:#1a2f5e;border:1.5px solid #dde3ef">
      <i class="fas fa-arrow-left"></i>
    </button>
    <h2 class="text-xl font-bold" style="color:#0a1628">신청 심사 상세</h2>
  </div>

  <div id="content">
    <div class="admin-card text-center py-12"><i class="fas fa-spinner fa-spin text-2xl" style="color:#84cc16"></i></div>
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
      <div class="admin-card mb-4">
        <div class="flex items-start justify-between mb-1">
          <h3 class="text-lg font-bold flex-1 mr-3" style="color:#0a1628">\${a.station_name}</h3>
          \${statusBadge}
        </div>
        <p class="text-xs" style="color:#8e9ab4">\${formatDate(a.created_at)} 신청</p>
      </div>

      <div class="admin-card mb-4">
        <h4 class="font-semibold text-sm mb-3" style="color:#1a2f5e">
          <i class="fas fa-info-circle mr-2" style="color:#84cc16"></i>기본 정보
        </h4>
        <div class="space-y-2.5 text-sm">
          <div class="flex justify-between gap-4">
            <span style="color:#8e9ab4" class="flex-shrink-0">주소</span>
            <span style="color:#1a202c" class="text-right">\${a.address}\${a.address_detail ? ' ' + a.address_detail : ''}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span style="color:#8e9ab4" class="flex-shrink-0">전화</span>
            <span style="color:#1a202c">\${a.phone || '-'}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span style="color:#8e9ab4" class="flex-shrink-0">세차 유형</span>
            <span style="color:#1a202c">\${washType}</span>
          </div>
        </div>
      </div>

      <div class="admin-card mb-4">
        <h4 class="font-semibold text-sm mb-3" style="color:#1a2f5e">
          <i class="fas fa-building mr-2" style="color:#84cc16"></i>사업자 정보
        </h4>
        <div class="space-y-2.5 text-sm">
          <div class="flex justify-between gap-4">
            <span style="color:#8e9ab4" class="flex-shrink-0">사업자번호</span>
            <span style="color:#1a202c" class="font-mono">\${a.business_reg_number}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span style="color:#8e9ab4" class="flex-shrink-0">신청자</span>
            <span style="color:#1a202c" class="text-right">\${a.owner_name}<br><span style="color:#8e9ab4;font-size:12px">\${a.owner_email}</span></span>
          </div>
        </div>
        <div class="mt-3 pt-3 space-y-2" style="border-top:1px solid #eef1f7">
          \${a.business_reg_image_key ? \`
            <button onclick="viewFile('\${a.business_reg_image_key}', '사업자등록증')"
              class="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
              style="background:#f0ffd4;border:none;cursor:pointer">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style="background:rgba(132,204,22,.15)">
                <i class="fas fa-file-alt" style="color:#65a30d"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium" style="color:#1a202c">사업자등록증</p>
                <p class="text-xs" style="color:#8e9ab4">클릭하여 보기</p>
              </div>
              <i class="fas fa-chevron-right" style="color:#c0c8d8"></i>
            </button>
          \` : '<p class="text-xs py-1" style="color:#8e9ab4">사업자등록증 미첨부</p>'}
          \${a.account_image_key ? \`
            <button onclick="viewFile('\${a.account_image_key}', '통장사본')"
              class="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
              style="background:#eef1f7;border:none;cursor:pointer">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style="background:rgba(26,47,94,.1)">
                <i class="fas fa-university" style="color:#1a2f5e"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium" style="color:#1a202c">통장사본</p>
                <p class="text-xs" style="color:#8e9ab4">클릭하여 보기</p>
              </div>
              <i class="fas fa-chevron-right" style="color:#c0c8d8"></i>
            </button>
          \` : '<p class="text-xs py-1" style="color:#8e9ab4">통장사본 미첨부</p>'}
        </div>
      </div>

      <div class="admin-card mb-4">
        <h4 class="font-semibold text-sm mb-3" style="color:#1a2f5e">
          <i class="fas fa-piggy-bank mr-2" style="color:#84cc16"></i>정산 계좌
        </h4>
        <div class="space-y-2.5 text-sm">
          <div class="flex justify-between gap-4">
            <span style="color:#8e9ab4" class="flex-shrink-0">은행</span>
            <span style="color:#1a202c">\${a.bank_name}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span style="color:#8e9ab4" class="flex-shrink-0">계좌번호</span>
            <span style="color:#1a202c" class="font-mono">\${a.account_number}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span style="color:#8e9ab4" class="flex-shrink-0">예금주</span>
            <span style="color:#1a202c">\${a.account_holder}</span>
          </div>
        </div>
      </div>

      \${a.status === 'rejected' ? \`
        <div class="admin-card mb-4" style="border:1px solid #fecaca;background:#fff5f5">
          <h4 class="font-semibold text-sm mb-2" style="color:#ef4444">
            <i class="fas fa-times-circle mr-2"></i>반려 사유
          </h4>
          <p class="text-sm" style="color:#dc2626">\${a.reject_reason}</p>
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
    document.getElementById('content').innerHTML = '<div class="admin-card text-center py-8" style="color:#ef4444">불러올 수 없습니다</div>';
  }
}

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
