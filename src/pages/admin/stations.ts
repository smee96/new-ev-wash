// 관리자 주유소 관리 페이지
import { htmlPage } from '../layout'
import { ADMIN_NAV } from './layout'

export function adminStationsPage(): string {
  return htmlPage('주유소 관리', `
${ADMIN_NAV}
<div class="main-content p-4 md:p-6 pt-16 md:pt-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-bold" style="color:#0a1628">주유소 관리</h2>
  </div>

  <div class="flex gap-2 mb-4">
    <input id="keyword" type="search" placeholder="주유소명 검색" class="input" oninput="debounce()">
  </div>
  <p class="text-xs mb-3" style="color:#8e9ab4" id="total_info"></p>
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
  el.innerHTML = '<div class="admin-card text-center py-8"><i class="fas fa-spinner fa-spin" style="color:#84cc16"></i></div>';
  try {
    const r = await API.get('/admin/stations?page='+page+(kw?'&keyword='+encodeURIComponent(kw):''));
    document.getElementById('total_info').textContent = '총 '+r.total+'개';
    el.innerHTML = (r.stations||[]).map(s=>\`
      <div class="admin-card cursor-pointer hover:shadow-md transition-shadow" onclick="showDetail(\${s.id})">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold" style="color:#0a1628">\${s.station_name}</h3>
            <p class="text-xs" style="color:#8e9ab4">\${s.address}</p>
            <p class="text-xs" style="color:#8e9ab4">\${s.owner_name} · \${s.owner_email}</p>
          </div>
          <div class="text-right">
            \${s.is_closed?'<span class="badge badge-red">폐업</span>':s.is_active?'<span class="badge badge-green">운영중</span>':'<span class="badge badge-gray">비활성</span>'}
            <p class="text-xs mt-1" style="color:#c0c8d8">쿠폰\${s.coupon_count}종</p>
          </div>
        </div>
      </div>
    \`).join('') || '<div class="admin-card text-center py-8" style="color:#8e9ab4">결과가 없습니다</div>';
  } catch {}
}

async function showDetail(id) {
  document.getElementById('detailModal').classList.remove('hidden');
  document.getElementById('modalContent').innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin" style="color:#84cc16"></i></div>';
  try {
    const r = await API.get('/admin/stations/' + id);
    const s = r.station;
    const washLabel = s.car_wash_type === 'automatic' ? '자동 세차기' : s.car_wash_type === 'self' ? '셀프 세차' : '자동+셀프';

    const token = localStorage.getItem('ev_token');
    const qrApiUrl = '/api/stations/my-stations/' + id + '/qr-image?token=' + encodeURIComponent(token);
    let qrBlobUrl = '';
    try {
      const res = await fetch(qrApiUrl);
      if (res.ok) qrBlobUrl = URL.createObjectURL(await res.blob());
    } catch {}

    document.getElementById('modalContent').innerHTML = \`
      <div class="flex items-start justify-between mb-4">
        <h3 class="font-bold text-lg flex-1 mr-3" style="color:#0a1628">\${s.station_name}</h3>
        \${s.is_closed ? '<span class="badge badge-red">폐업</span>' : s.is_active ? '<span class="badge badge-green">운영중</span>' : '<span class="badge badge-gray">비활성</span>'}
      </div>

      <div class="space-y-2 text-sm mb-4 rounded-xl p-3" style="background:#f0ffd4">
        <div class="flex justify-between gap-3"><span style="color:#8e9ab4" class="flex-shrink-0">주소</span><span class="text-right" style="color:#1a202c">\${s.address}\${s.address_detail ? ' ' + s.address_detail : ''}</span></div>
        <div class="flex justify-between gap-3"><span style="color:#8e9ab4" class="flex-shrink-0">전화</span><span style="color:#1a202c">\${s.phone || '-'}</span></div>
        <div class="flex justify-between gap-3"><span style="color:#8e9ab4" class="flex-shrink-0">세차유형</span><span style="color:#1a202c">\${washLabel}</span></div>
        <div class="flex justify-between gap-3"><span style="color:#8e9ab4" class="flex-shrink-0">사업자번호</span><span style="color:#1a202c" class="font-mono">\${s.business_reg_number}</span></div>
        <div class="flex justify-between gap-3"><span style="color:#8e9ab4" class="flex-shrink-0">정산계좌</span><span class="text-right" style="color:#1a202c">\${s.bank_name} \${s.account_number}<br><span style="font-size:12px;color:#8e9ab4">(\${s.account_holder})</span></span></div>
        <div class="flex justify-between gap-3"><span style="color:#8e9ab4" class="flex-shrink-0">사장님</span><span class="text-right" style="color:#1a202c">\${s.owner_name}<br><span style="font-size:12px;color:#8e9ab4">\${s.owner_email || ''}</span></span></div>
        <div class="flex justify-between gap-3"><span style="color:#8e9ab4" class="flex-shrink-0">등록일</span><span style="color:#1a202c">\${formatDate(s.created_at)}</span></div>
      </div>

      <div class="rounded-xl p-3 mb-4" style="background:#eef1f7">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-semibold text-sm" style="color:#1a2f5e">
            <i class="fas fa-qrcode mr-2" style="color:#84cc16"></i>QR 코드
          </h4>
          <button onclick="printQR('\${id}', '\${s.station_name}', '\${s.address}')"
            class="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            style="background:#1a2f5e;color:#bef264;border:none;cursor:pointer">
            <i class="fas fa-print"></i> 인쇄
          </button>
        </div>
        \${qrBlobUrl ? \`
          <div class="flex flex-col items-center">
            <img src="\${qrBlobUrl}" alt="QR코드" width="180" height="180"
              class="rounded-lg mb-2" style="border:1px solid #dde3ef">
            <p class="text-xs break-all text-center" style="color:#c0c8d8">\${s.qr_code || ''}</p>
          </div>
        \` : '<p class="text-xs text-center py-3" style="color:#ef4444">QR 코드를 불러올 수 없습니다.</p>'}
      </div>

      \${!s.is_closed ? \`<button onclick="closeStation(\${s.id})" class="btn btn-danger w-full mb-3"><i class="fas fa-store-slash mr-2"></i>폐업 처리 (미사용 쿠폰 환불)</button>\` : ''}
      <button onclick="closeStationModal()" class="btn btn-gray w-full">닫기</button>
    \`;
  } catch(e) {
    document.getElementById('modalContent').innerHTML = '<p class="text-center py-4" style="color:#ef4444">불러올 수 없습니다: ' + (e.message||'') + '</p>';
  }
}

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
    .print-page { width:148mm; min-height:105mm; margin:0 auto; padding:10mm; display:flex; flex-direction:column; align-items:center; text-align:center; border:2px solid #dde3ef; border-radius:8px; margin-top:10mm; }
    .logo { font-size:28px; margin-bottom:4px; }
    .brand { font-size:18px; font-weight:800; color:#1a2f5e; margin-bottom:2px; }
    .station-name { font-size:22px; font-weight:700; color:#0a1628; margin:8px 0 2px; }
    .address { font-size:11px; color:#8e9ab4; margin-bottom:12px; }
    .qr-wrap { background:#f0ffd4; padding:12px; border-radius:12px; margin-bottom:12px; border:1px solid #bef264; }
    .qr-wrap img { width:200px; height:200px; display:block; }
    .guide { font-size:13px; color:#1a2f5e; font-weight:600; margin-bottom:4px; }
    .guide-sub { font-size:11px; color:#8e9ab4; margin-bottom:12px; }
    .divider { width:100%; border-top:1px dashed #dde3ef; margin:8px 0; }
    .steps { display:flex; gap:16px; justify-content:center; margin-top:6px; }
    .step { display:flex; flex-direction:column; align-items:center; gap:4px; }
    .step-num { width:22px; height:22px; background:#84cc16; color:#0a1628; border-radius:50%; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; }
    .step-text { font-size:10px; color:#8e9ab4; text-align:center; max-width:60px; line-height:1.3; }
    .footer { font-size:10px; color:#c0c8d8; margin-top:10px; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } .no-print { display:none; } .print-page { border:2px solid #dde3ef !important; margin-top:0; } }
  </style>
</head>
<body>
<div class="no-print" style="text-align:center;padding:12px;background:#f0ffd4;border-bottom:1px solid #bef264">
  <button onclick="window.print()" style="background:#1a2f5e;color:#bef264;border:none;padding:8px 24px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-right:8px">🖨️ 인쇄하기</button>
  <span style="font-size:12px;color:#8e9ab4">인쇄 후 코팅하여 주유소에 부착해주세요</span>
</div>
<div class="print-page">
  <div class="logo">⚡</div>
  <div class="brand">EV-Wash</div>
  <div class="station-name">\${stationName}</div>
  <div class="address">\${address}</div>
  <div class="qr-wrap"><img src="\${qrUrl}" alt="QR코드"></div>
  <div class="guide">세차 완료 후 QR 코드를 스캔해주세요</div>
  <div class="guide-sub">EV-Wash 앱 → 내 쿠폰 → QR 스캔</div>
  <div class="divider"></div>
  <div class="steps">
    <div class="step"><div class="step-num">1</div><div class="step-text">앱 실행</div></div>
    <div class="step"><div class="step-num">2</div><div class="step-text">내 쿠폰 선택</div></div>
    <div class="step"><div class="step-num">3</div><div class="step-text">QR 스캔</div></div>
    <div class="step"><div class="step-num">4</div><div class="step-text">사용 완료</div></div>
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
    msg: '폐업 처리하시겠습니까? 미사용 쿠폰이 모두 환불됩니다.',
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
