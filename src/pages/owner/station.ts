// 사장님 주유소 관리 페이지 (쿠폰/QR/사용내역/정산/정보수정 탭)
import { htmlPage } from '../layout'

export function ownerStationPage(): string {
  return htmlPage('주유소 관리', `
<!-- ★ 스크립트 먼저 정의 -->
<script>

/* ── 전역 상태 ── */
const stationId = location.pathname.split('/').pop();
let _currentTab = 'coupons';
let _editCouponId = null;

/* ── 탭 전환 ── */
function showTab(tab) {
  _currentTab = tab;
  ['coupons','qr','usage','settlement','info'].forEach(t => {
    const btn = document.getElementById('tab_' + t);
    const ct  = document.getElementById('ct_' + t);
    if (!btn || !ct) return;
    const isActive = t === tab;
    btn.style.color = isActive ? '#65a30d' : '#8e9ab4';
    btn.style.borderBottomColor = isActive ? '#84cc16' : 'transparent';
    btn.style.fontWeight = isActive ? '700' : '500';
    ct.classList.toggle('hidden', !isActive);
  });
  if (tab === 'coupons')    loadCoupons();
  else if (tab === 'qr')    loadQR();
  else if (tab === 'usage') loadUsages();
  else if (tab === 'info')  loadInfo();
  else                      loadSettlements();
}

/* ══════════════════════════════════
   정보수정 탭
══════════════════════════════════ */
async function loadInfo() {
  const el = document.getElementById('ct_info');
  el.innerHTML = spinner();
  try {
    const r = await API.get('/stations/my-stations/' + stationId);
    const s = r.station;
    el.innerHTML = \`
      <!-- 주유소명 수정 (즉시 적용) -->
      <div class="card mb-4">
        <h3 class="font-semibold text-sm mb-3" style="color:#1a2f5e"><i class="fas fa-store mr-2" style="color:#84cc16"></i>주유소명</h3>
        <input id="edit_name" type="text" class="input mb-3" value="\${s.station_name||''}" placeholder="주유소명">
        <p class="text-xs mb-3" style="color:#8e9ab4">명칭 변경은 즉시 적용됩니다.</p>
        <button onclick="saveStationName()" class="btn btn-primary w-full">저장</button>
      </div>

      <!-- 전화번호 / 세차기 유형 수정 (즉시 적용) -->
      <div class="card mb-4">
        <h3 class="font-semibold text-sm mb-3" style="color:#1a2f5e"><i class="fas fa-phone mr-2" style="color:#84cc16"></i>연락처 · 세차기 유형</h3>
        <label class="text-xs mb-1 block" style="color:#4a5568">전화번호</label>
        <input id="edit_phone" type="tel" class="input mb-3" value="\${s.phone||''}"
          placeholder="02-1234-5678" oninput="formatPhone(this)" maxlength="13" inputmode="numeric">
        <label class="text-xs mb-1 block" style="color:#4a5568">세차기 유형</label>
        <select id="edit_wash_type" class="input mb-3">
          <option value="automatic" \${s.car_wash_type==='automatic'?'selected':''}>🚗 자동 세차기</option>
          <option value="self"      \${s.car_wash_type==='self'?'selected':''}>💧 셀프 세차</option>
          <option value="both"      \${s.car_wash_type==='both'?'selected':''}>🚗 자동 + 셀프</option>
        </select>
        <p class="text-xs mb-3" style="color:#8e9ab4">변경은 즉시 적용됩니다.</p>
        <button onclick="saveStationBasic()" class="btn btn-primary w-full">저장</button>
      </div>

      <!-- 계좌 변경 (재승인 필요) -->
      <div class="card mb-4" style="border:1.5px solid #fde68a">
        <h3 class="font-semibold text-sm mb-1" style="color:#1a2f5e"><i class="fas fa-university mr-2" style="color:#84cc16"></i>계좌 변경</h3>
        <div class="rounded-xl p-3 mb-3 text-xs" style="background:#fef3c7;color:#92400e">
          <i class="fas fa-exclamation-triangle mr-1"></i>계좌 변경 시 <b>관리자 재승인</b>이 필요합니다. 심사 중에는 쿠폰 판매가 일시 중지됩니다.
        </div>
        <label class="text-xs mb-1 block" style="color:#4a5568">은행명</label>
        <input id="edit_bank" type="text" class="input mb-3" placeholder="예: 국민은행">
        <label class="text-xs mb-1 block" style="color:#4a5568">계좌번호</label>
        <input id="edit_account_num" type="text" class="input mb-3" placeholder="계좌번호 (숫자만)" inputmode="numeric">
        <label class="text-xs mb-1 block" style="color:#4a5568">예금주</label>
        <input id="edit_account_holder" type="text" class="input mb-3" placeholder="예금주명">
        <label class="text-xs mb-1 block" style="color:#4a5568">통장 사본 재업로드 <span style="color:#ef4444">*</span></label>
        <input id="edit_account_img" type="file" accept="image/*" class="input mb-3" style="padding:8px">
        <button onclick="saveAccountChange()" class="btn w-full" style="background:#1a2f5e;color:#fff">재승인 요청</button>
      </div>
    \`;
  } catch(e) { el.innerHTML = errBox(e.message); }
}

function formatPhone(input) {
  let v = input.value.replace(/[^0-9]/g, '').substring(0, 11);
  if (v.length < 4) input.value = v;
  else if (v.length < 8) input.value = v.slice(0,3) + '-' + v.slice(3);
  else input.value = v.slice(0,3) + '-' + v.slice(3,7) + '-' + v.slice(7);
}

async function saveStationName() {
  const name = document.getElementById('edit_name').value.trim();
  if (!name) return showToast('주유소명을 입력해주세요.', 'error');
  try {
    await API.patch('/stations/my-stations/' + stationId, { station_name: name });
    document.getElementById('pageTitle').textContent = name;
    showToast('주유소명이 변경되었습니다.');
  } catch(e) { showToast(e.message || '저장 실패', 'error'); }
}

async function saveStationBasic() {
  const phone     = document.getElementById('edit_phone').value.trim();
  const washType  = document.getElementById('edit_wash_type').value;
  try {
    await API.patch('/stations/my-stations/' + stationId, { phone: phone || null, car_wash_type: washType });
    showToast('정보가 변경되었습니다.');
  } catch(e) { showToast(e.message || '저장 실패', 'error'); }
}

async function saveAccountChange() {
  const bank   = document.getElementById('edit_bank').value.trim();
  const accNum = document.getElementById('edit_account_num').value.trim();
  const holder = document.getElementById('edit_account_holder').value.trim();
  const file   = document.getElementById('edit_account_img').files[0];
  if (!bank || !accNum || !holder) return showToast('은행명, 계좌번호, 예금주를 모두 입력해주세요.', 'error');
  if (!file) return showToast('통장 사본을 업로드해주세요.', 'error');
  try {
    const fd = new FormData(); fd.append('file', file); fd.append('type', 'account');
    const up = await API.upload('/auth/upload', fd);
    await API.post('/stations/my-stations/' + stationId + '/request-account-change', {
      bank_name: bank, account_number: accNum, account_holder: holder,
      account_image_key: up.key
    });
    showToast('재승인 요청이 접수되었습니다. 심사 후 반영됩니다.');
    loadInfo();
  } catch(e) { showToast(e.message || '요청 실패', 'error'); }
}

/* ══════════════════════════════════
   쿠폰 탭
══════════════════════════════════ */
async function loadCoupons() {
  const el = document.getElementById('ct_coupons');
  el.innerHTML = spinner();
  try {
    const r = await API.get('/coupons/owner/stations/' + stationId + '/coupons');
    const coupons = r.coupons || [];
    let html = \`
      <button onclick="openCouponModal()" class="btn btn-primary w-full mb-4">
        <i class="fas fa-plus mr-2"></i>쿠폰 추가
      </button>
    \`;
    if (coupons.length) {
      html += coupons.map(c => {
        const pct = Math.round((1 - c.discount_price / c.original_price) * 100);
        const stockTxt = c.total_stock != null
          ? \`재고 \${c.remaining_stock ?? c.total_stock}/\${c.total_stock}\`
          : '무제한';
        return \`
        <div class="card mb-3" style="border:1px solid #eef1f7">
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1 min-w-0 pr-3">
              <h3 class="font-semibold truncate" style="color:#1a202c">\${c.title}</h3>
              \${c.description ? '<p class="text-xs mt-0.5 truncate" style="color:#8e9ab4">' + c.description + '</p>' : ''}
            </div>
            <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input type="checkbox" \${c.is_active ? 'checked' : ''}
                onchange="toggleCoupon(\${c.id}, this.checked)" class="sr-only peer">
              <div class="w-11 h-6 rounded-full transition-all peer-checked:bg-lime-400 bg-gray-200
                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                peer-checked:after:translate-x-5" style="--tw-bg-opacity:1"></div>
            </label>
          </div>
          <div class="flex items-baseline gap-2 mb-2">
            <span class="text-xl font-bold" style="color:#65a30d">\${formatPrice(c.discount_price)}</span>
            <span class="text-sm line-through" style="color:#dde3ef">\${formatPrice(c.original_price)}</span>
            <span class="badge badge-red">\${pct}%</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex gap-3 text-xs" style="color:#8e9ab4">
              <span><i class="fas fa-sync-alt mr-1"></i>\${c.wash_count}회권</span>
              <span><i class="fas fa-box mr-1"></i>\${stockTxt}</span>
              <span><i class="fas fa-shopping-cart mr-1"></i>\${c.active_purchases || 0}건</span>
            </div>
            <button onclick="openCouponModal(\${c.id})" class="text-xs px-2 py-1 rounded-lg" style="color:#8e9ab4;background:#f4f7fb">
              <i class="fas fa-pen"></i>
            </button>
          </div>
        </div>\`;
      }).join('');
    } else {
      html += \`<div class="card text-center py-14" style="color:#8e9ab4">
        <i class="fas fa-ticket-alt text-4xl mb-3" style="color:#dde3ef"></i>
        <p class="font-medium">등록된 쿠폰이 없습니다</p>
        <p class="text-xs mt-1">쿠폰 추가 버튼을 눌러 첫 쿠폰을 등록해보세요</p>
      </div>\`;
    }
    el.innerHTML = html;
  } catch(e) { el.innerHTML = errBox(e.message); }
}

async function toggleCoupon(id, active) {
  try {
    await API.patch('/coupons/owner/coupons/' + id, { is_active: active ? 1 : 0 });
    showToast(active ? '쿠폰이 활성화되었습니다.' : '쿠폰이 비활성화되었습니다.');
  } catch(e) { showToast(e.message || '변경 실패', 'error'); loadCoupons(); }
}

async function openCouponModal(id = null) {
  _editCouponId = id;
  const title = document.getElementById('couponModalTitle');
  ['c_title','c_desc','c_orig','c_disc','c_stock'].forEach(f => {
    const el = document.getElementById(f);
    if (el) el.value = '';
  });
  document.getElementById('c_count').value = '1';
  document.getElementById('c_discount_pct').textContent = '';
  if (id) {
    title.textContent = '쿠폰 수정';
    try {
      const r = await API.get('/coupons/owner/stations/' + stationId + '/coupons');
      const c = (r.coupons || []).find(x => x.id === id);
      if (c) {
        document.getElementById('c_title').value = c.title;
        document.getElementById('c_desc').value  = c.description || '';
        document.getElementById('c_orig').value  = c.original_price;
        document.getElementById('c_disc').value  = c.discount_price;
        document.getElementById('c_count').value = c.wash_count;
        document.getElementById('c_stock').value = c.total_stock || '';
        updateDiscountPct();
      }
    } catch {}
  } else {
    title.textContent = '쿠폰 추가';
  }
  openModal('couponModal');
}

function updateDiscountPct() {
  const orig = parseInt(document.getElementById('c_orig').value) || 0;
  const disc = parseInt(document.getElementById('c_disc').value) || 0;
  const el = document.getElementById('c_discount_pct');
  if (orig > 0 && disc > 0 && disc < orig) {
    const pct = Math.round((1 - disc / orig) * 100);
    el.textContent = pct + '% 할인';
    el.style.color = '#65a30d';
  } else if (orig > 0 && disc >= orig) {
    el.textContent = '판매가는 정가보다 낮아야 합니다';
    el.style.color = '#ef4444';
  } else {
    el.textContent = '';
  }
}

async function saveCoupon() {
  const title = document.getElementById('c_title').value.trim();
  const orig  = parseInt(document.getElementById('c_orig').value);
  const disc  = parseInt(document.getElementById('c_disc').value);
  const count = parseInt(document.getElementById('c_count').value);
  const stock = document.getElementById('c_stock').value;
  if (!title) return showToast('쿠폰명을 입력해주세요.', 'error');
  if (!orig || !disc) return showToast('가격을 입력해주세요.', 'error');
  if (disc >= orig) return showToast('판매가는 정가보다 낮아야 합니다.', 'error');
  const payload = {
    title,
    description: document.getElementById('c_desc').value.trim() || undefined,
    original_price: orig,
    discount_price: disc,
    wash_count: count,
    total_stock: stock ? parseInt(stock) : undefined
  };
  try {
    if (_editCouponId) {
      await API.patch('/coupons/owner/coupons/' + _editCouponId, payload);
      showToast('쿠폰이 수정되었습니다!');
    } else {
      await API.post('/coupons/owner/stations/' + stationId + '/coupons', payload);
      showToast('쿠폰이 등록되었습니다!');
    }
    closeModal('couponModal');
    loadCoupons();
  } catch(e) { showToast(e.message || '저장 실패', 'error'); }
}

/* ══════════════════════════════════
   QR 탭
══════════════════════════════════ */
async function loadQR() {
  const el = document.getElementById('ct_qr');
  el.innerHTML = spinner();
  try {
    const r = await API.get('/stations/my-stations/' + stationId + '/qr');
    if (!r || !r.qr_code) throw new Error('QR 코드 데이터가 없습니다.');

    const token = localStorage.getItem('ev_token');
    const qrApiUrl = '/api/stations/my-stations/' + stationId + '/qr-image?token=' + encodeURIComponent(token);

    let qrBlobUrl = qrApiUrl;
    try {
      const res = await fetch(qrApiUrl);
      if (res.ok) {
        const blob = await res.blob();
        qrBlobUrl = URL.createObjectURL(blob);
      }
    } catch {}

    el.innerHTML = \`
      <div class="card text-center py-6" style="border:1px solid #eef1f7">
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style="background:#f0ffd4">
          <i class="fas fa-qrcode text-2xl" style="color:#65a30d"></i>
        </div>
        <h3 class="font-bold text-lg mb-1" style="color:#1a202c">\${r.station_name}</h3>
        <p class="text-xs mb-6" style="color:#8e9ab4">고객이 세차 완료 후 이 QR을 스캔합니다</p>
        <div class="inline-block rounded-2xl p-4 mb-5" style="background:#fff;box-shadow:0 2px 12px rgba(10,22,40,.08);border:1px solid #eef1f7">
          <img id="qrImg" src="\${qrBlobUrl}" alt="QR코드" width="240" height="240" style="display:block">
        </div>
        <p class="text-xs break-all px-4 mb-5" style="color:#dde3ef">\${r.qr_code}</p>
        <div class="flex gap-3">
          <button onclick="downloadQR('\${qrBlobUrl}', '\${r.station_name}')" class="btn btn-primary flex-1">
            <i class="fas fa-download mr-2"></i>이미지 저장
          </button>
          <button onclick="copyQR('\${r.qr_code}')" class="btn btn-outline flex-1">
            <i class="fas fa-copy mr-2"></i>코드 복사
          </button>
        </div>
      </div>
    \`;
  } catch(e) {
    const msg = e?.data?.error || e?.message || '알 수 없는 오류';
    el.innerHTML = errBox('QR 코드를 불러올 수 없습니다: ' + msg);
  }
}

async function downloadQR(src, name) {
  try {
    showToast('이미지 저장 중...', 'info');
    const res = await fetch(src);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = (name || 'ev-wash') + '-qr.png';
    a.href = url;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } catch { showToast('이미지 저장에 실패했습니다.', 'error'); }
}
function copyQR(url) {
  navigator.clipboard.writeText(url).then(() => showToast('URL이 복사되었습니다.'))
    .catch(() => showToast('복사에 실패했습니다.', 'error'));
}

/* ══════════════════════════════════
   사용내역 탭
══════════════════════════════════ */
async function loadUsages(page = 1) {
  const el = document.getElementById('ct_usage');
  el.innerHTML = spinner();
  try {
    const r = await API.get('/stations/my-stations/' + stationId + '/usages?page=' + page);
    const usages = r.usages || [];
    const total  = r.total || 0;
    let html = \`
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="card text-center py-4" style="border:1px solid #eef1f7">
          <p class="text-2xl font-bold" style="color:#1a2f5e">\${total}</p>
          <p class="text-xs mt-1" style="color:#8e9ab4">총 사용건수</p>
        </div>
        <div class="card text-center py-4" style="border:1px solid #eef1f7">
          <p class="text-2xl font-bold" style="color:#65a30d">\${formatPrice(r.total_revenue || 0)}</p>
          <p class="text-xs mt-1" style="color:#8e9ab4">총 매출</p>
        </div>
      </div>
      <h3 class="section-title">사용 내역</h3>
    \`;
    if (usages.length) {
      html += usages.map(u => \`
        <div class="card mb-2" style="border:1px solid #eef1f7">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0 pr-3">
              <p class="text-sm font-medium truncate" style="color:#1a202c">\${u.coupon_title}</p>
              <p class="text-xs mt-0.5" style="color:#8e9ab4">
                <i class="fas fa-user mr-1"></i>\${u.user_name}
                <span class="mx-1">·</span>
                <i class="fas fa-clock mr-1"></i>\${formatDateTime(u.used_at)}
              </p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="font-semibold" style="color:#1a202c">\${formatPrice(u.unit_price)}</p>
              <span class="badge \${u.settled ? 'badge-gray' : 'badge-lime'} text-xs">
                \${u.settled ? '정산완료' : '정산대기'}
              </span>
            </div>
          </div>
        </div>
      \`).join('');

      const totalPages = Math.ceil(total / 20);
      if (totalPages > 1) {
        html += '<div class="flex justify-center gap-2 mt-4">';
        for (let i = 1; i <= totalPages; i++) {
          const active = i === page;
          html += \`<button onclick="loadUsages(\${i})" class="w-9 h-9 rounded-full text-sm font-medium"
            style="background:\${active ? '#1a2f5e' : '#f4f7fb'};color:\${active ? '#fff' : '#4a5568'}">\${i}</button>\`;
        }
        html += '</div>';
      }
    } else {
      html += \`<div class="card text-center py-14" style="color:#8e9ab4">
        <i class="fas fa-history text-4xl mb-3" style="color:#dde3ef"></i>
        <p class="font-medium">아직 사용 내역이 없습니다</p>
      </div>\`;
    }
    el.innerHTML = html;
  } catch(e) { el.innerHTML = errBox(e.message); }
}

/* ══════════════════════════════════
   정산 탭 - 연/월 선택기
══════════════════════════════════ */
let _settleYear, _settleMonth;

function initSettleMonth() {
  const now = new Date(Date.now() + 9*60*60*1000);
  _settleYear  = now.getFullYear();
  _settleMonth = now.getMonth() + 1;
}

function shiftSettleMonth(d) {
  _settleMonth += d;
  if (_settleMonth > 12) { _settleMonth = 1;  _settleYear++; }
  if (_settleMonth < 1)  { _settleMonth = 12; _settleYear--; }
  loadSettlements();
}

function getSettleYM() {
  return _settleYear + '-' + String(_settleMonth).padStart(2,'0');
}

async function loadSettlements() {
  const el = document.getElementById('ct_settlement');
  el.innerHTML = spinner();

  // 미래 달 방지
  const now = new Date(Date.now() + 9*60*60*1000);
  const isFuture = (_settleYear > now.getFullYear()) ||
    (_settleYear === now.getFullYear() && _settleMonth > now.getMonth()+1);
  if (isFuture) { _settleMonth--; if (_settleMonth < 1) { _settleMonth=12; _settleYear--; } }

  const ym = getSettleYM();
  const lastDay = new Date(_settleYear, _settleMonth, 0).getDate();
  const mm = String(_settleMonth).padStart(2,'0');
  const isThisMonth = (_settleYear===now.getFullYear() && _settleMonth===now.getMonth()+1);

  try {
    const r = await API.get('/stations/my-stations/' + stationId + '/settlements?year_month=' + ym);
    const list = r.settlements || [];

    const pendingGross = r.pending_gross  || 0;
    const pendingNet   = r.pending_amount || 0;
    const settledAmt   = r.settled_amount || 0;
    const pendingCnt   = r.pending_count  || 0;
    const settledCnt   = r.settled_count  || 0;

    // 미래 달 버튼 비활성
    const nextDisabled = isThisMonth ? 'opacity:0.3;pointer-events:none' : '';

    let html = \`
      <!-- 연/월 선택기 -->
      <div class="flex items-center justify-between rounded-2xl px-4 py-3 mb-4" style="background:#0a1628">
        <button onclick="shiftSettleMonth(-1)" class="w-9 h-9 rounded-full flex items-center justify-center" style="background:rgba(255,255,255,.12)">
          <i class="fas fa-chevron-left text-sm" style="color:#fff"></i>
        </button>
        <div class="text-center">
          <p class="text-lg font-black" style="color:#bef264">\${_settleYear}년 \${_settleMonth}월</p>
          <p class="text-xs mt-0.5" style="color:rgba(255,255,255,.4)">\${_settleYear}.\${mm}.01 ~ \${mm}.\${String(lastDay).padStart(2,'0')}</p>
        </div>
        <button onclick="shiftSettleMonth(1)" class="w-9 h-9 rounded-full flex items-center justify-center" style="background:rgba(255,255,255,.12);\${nextDisabled}">
          <i class="fas fa-chevron-right text-sm" style="color:#fff"></i>
        </button>
      </div>

      <!-- 정산 요약 2칸 -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="card text-center py-4" style="border:1px solid #eef1f7">
          <p class="text-xs mb-1" style="color:#8e9ab4"><i class="fas fa-clock mr-1" style="color:#fbbf24"></i>정산 대기</p>
          <p class="text-xl font-bold" style="color:#d97706">\${formatPrice(pendingNet)}</p>
          <p class="text-xs mt-0.5" style="color:#8e9ab4">사용액 \${formatPrice(pendingGross)} · \${pendingCnt}건</p>
        </div>
        <div class="card text-center py-4" style="border:1px solid #eef1f7">
          <p class="text-xs mb-1" style="color:#8e9ab4"><i class="fas fa-check-circle mr-1" style="color:#4ade80"></i>정산 완료</p>
          <p class="text-xl font-bold" style="color:#16a34a">\${formatPrice(settledAmt)}</p>
          <p class="text-xs mt-0.5" style="color:#8e9ab4">\${settledCnt}건 완료</p>
        </div>
      </div>

      <div class="card mb-4" style="background:#f4f7fb;border:1px solid #eef1f7">
        <h4 class="text-xs font-semibold mb-2" style="color:#1a2f5e"><i class="fas fa-info-circle mr-1" style="color:#84cc16"></i>정산 안내</h4>
        <ul class="text-xs space-y-1" style="color:#4a5568">
          <li>· 사용액의 15%가 플랫폼 수수료로 차감됩니다</li>
          <li>· 정산은 매주 월요일 기준으로 처리됩니다</li>
          <li>· 지급은 처리 다음 영업일에 완료됩니다</li>
        </ul>
      </div>

      <h3 class="section-title">정산 상세 내역</h3>
    \`;

    if (list.length) {
      html += list.map(s => {
        const grossStr = formatPrice(s.gross_amount || (s.net_amount + s.platform_fee));
        const feeStr   = formatPrice(s.platform_fee);
        const netStr   = formatPrice(s.net_amount);
        const isCompleted = s.status === 'completed';
        return \`
        <div class="card mb-3" style="border:1px solid #eef1f7">
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="font-semibold" style="color:#1a202c">\${s.settlement_date || formatDate(s.created_at)}</p>
              <p class="text-xs mt-0.5" style="color:#8e9ab4">\${s.usage_count}건 사용</p>
            </div>
            <span class="badge \${isCompleted ? 'badge-green' : 'badge-amber'}">
              \${isCompleted ? '지급완료' : '처리중'}
            </span>
          </div>
          <div class="pt-2 mt-1 space-y-1 text-sm border-t" style="border-color:#eef1f7">
            <div class="flex justify-between">
              <span style="color:#8e9ab4">사용 합계</span>
              <span style="color:#1a202c">\${grossStr}</span>
            </div>
            <div class="flex justify-between">
              <span style="color:#8e9ab4">수수료 (15%)</span>
              <span style="color:#ef4444">-\${feeStr}</span>
            </div>
            <div class="flex justify-between font-semibold pt-1 mt-1 border-t" style="border-color:#eef1f7">
              <span style="color:#1a202c">실 지급액</span>
              <span style="color:#65a30d">\${netStr}</span>
            </div>
          </div>
        </div>\`;
      }).join('');
    } else {
      html += \`<div class="card text-center py-12" style="color:#8e9ab4">
        <i class="fas fa-money-bill-wave text-4xl mb-3" style="color:#dde3ef"></i>
        <p class="font-medium">이 달 정산 내역이 없습니다</p>
      </div>\`;
    }
    el.innerHTML = html;
  } catch(e) { el.innerHTML = errBox(e.message); }
}

/* ── 공통 헬퍼 ── */
function spinner() { return '<div class="text-center py-14"><i class="fas fa-spinner fa-spin text-2xl" style="color:#84cc16"></i></div>'; }
function errBox(msg) { return '<div class="card text-center py-8" style="color:#ef4444"><i class="fas fa-exclamation-circle mb-2 text-xl"></i><p>' + (msg || '불러올 수 없습니다') + '</p></div>'; }

/* ── 초기화 ── */
window.addEventListener('DOMContentLoaded', async () => {
  const u = requireAuth('station_owner');
  if (!u) return;
  initSettleMonth();
  try {
    const r = await API.get('/stations/my-stations/' + stationId);
    document.getElementById('pageTitle').textContent = r.station.station_name;
  } catch {}
  showTab('coupons');
});
</script>

<div class="min-h-screen pb-6">
  <div class="page-header">
    <button onclick="history.back()" class="back-btn"><i class="fas fa-arrow-left"></i></button>
    <span id="pageTitle" class="page-header-title">주유소 관리</span>
  </div>

  <!-- 탭 바 -->
  <div class="bg-white border-b flex sticky top-14 z-40" style="border-color:#eef1f7">
    <button id="tab_coupons"    onclick="showTab('coupons')"    class="flex-1 py-3.5 text-sm border-b-2 transition-all" style="color:#65a30d;border-bottom-color:#84cc16;font-weight:700">쿠폰</button>
    <button id="tab_qr"         onclick="showTab('qr')"         class="flex-1 py-3.5 text-sm border-b-2 transition-all" style="color:#8e9ab4;border-bottom-color:transparent;font-weight:500">QR</button>
    <button id="tab_usage"      onclick="showTab('usage')"      class="flex-1 py-3.5 text-sm border-b-2 transition-all" style="color:#8e9ab4;border-bottom-color:transparent;font-weight:500">사용내역</button>
    <button id="tab_settlement" onclick="showTab('settlement')" class="flex-1 py-3.5 text-sm border-b-2 transition-all" style="color:#8e9ab4;border-bottom-color:transparent;font-weight:500">정산</button>
    <button id="tab_info"       onclick="showTab('info')"       class="flex-1 py-3.5 text-sm border-b-2 transition-all" style="color:#8e9ab4;border-bottom-color:transparent;font-weight:500">수정</button>
  </div>

  <!-- 탭 콘텐츠 -->
  <div class="p-4">
    <div id="ct_coupons"></div>
    <div id="ct_qr"         class="hidden"></div>
    <div id="ct_usage"      class="hidden"></div>
    <div id="ct_settlement" class="hidden"></div>
    <div id="ct_info"       class="hidden"></div>
  </div>
</div>

<!-- ── 쿠폰 추가/수정 모달 ── -->
<div id="couponModal" class="modal-bg hidden">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-handle"></div>
    <div id="couponModalTitle" class="modal-title">쿠폰 추가</div>
    <div class="space-y-3 mb-5">
      <div>
        <label class="text-xs mb-1 block" style="color:#4a5568">쿠폰명 <span style="color:#ef4444">*</span></label>
        <input id="c_title" type="text" placeholder="예: 기본 세차 3회권" class="input">
      </div>
      <div>
        <label class="text-xs mb-1 block" style="color:#4a5568">설명 (선택)</label>
        <input id="c_desc" type="text" placeholder="쿠폰에 대한 간단한 설명" class="input">
      </div>
      <div class="flex gap-3">
        <div style="flex:1">
          <label class="text-xs mb-1 block" style="color:#4a5568">정가 (원) <span style="color:#ef4444">*</span></label>
          <input id="c_orig" type="number" placeholder="10000" class="input" min="100" inputmode="numeric" oninput="updateDiscountPct()">
        </div>
        <div style="flex:1">
          <label class="text-xs mb-1 block" style="color:#4a5568">판매가 (원) <span style="color:#ef4444">*</span></label>
          <input id="c_disc" type="number" placeholder="9000" class="input" min="100" inputmode="numeric" oninput="updateDiscountPct()">
        </div>
      </div>
      <p id="c_discount_pct" class="text-xs font-semibold -mt-1"></p>
      <div>
        <label class="text-xs mb-1.5 block" style="color:#4a5568">이용 횟수 <span style="color:#ef4444">*</span></label>
        <select id="c_count" class="input">
          <option value="1">1회권</option><option value="2">2회권</option><option value="3">3회권</option>
          <option value="4">4회권</option><option value="5">5회권</option><option value="6">6회권</option>
          <option value="7">7회권</option><option value="8">8회권</option><option value="9">9회권</option>
          <option value="10">10회권</option>
        </select>
      </div>
      <div>
        <label class="text-xs mb-1 block" style="color:#4a5568">판매 수량 (비워두면 무제한)</label>
        <input id="c_stock" type="number" placeholder="무제한" class="input" min="1" inputmode="numeric">
      </div>
    </div>
    <div class="flex gap-3">
      <button onclick="closeModal('couponModal')" class="btn btn-gray" style="flex:1">취소</button>
      <button onclick="saveCoupon()" class="btn btn-primary" style="flex:1">저장</button>
    </div>
  </div>
</div>
`)
}
