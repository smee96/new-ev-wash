// 사장님 페이지들 - EV-Wash
import { htmlPage } from '../layout'

export function ownerLoginPage(kakaoClientId = '', naverClientId = ''): string {
  return htmlPage('사장님 로그인', `
<div class="min-h-screen px-5 flex flex-col" style="padding-top:max(40px,env(safe-area-inset-top));padding-bottom:env(safe-area-inset-bottom)">
  <div class="text-center mb-8 mt-4">
    <div class="text-5xl mb-3">⚡</div>
    <h1 class="text-2xl font-bold text-gray-800">EV-Wash 사장님</h1>
    <p class="text-gray-400 text-sm mt-1">주유소 관리 대시보드</p>
  </div>
  <form onsubmit="doLogin(event)" class="space-y-4">
    <input id="email" type="email" placeholder="이메일" class="input" required autocomplete="email">
    <input id="pw" type="password" placeholder="비밀번호" class="input" required autocomplete="current-password">
    <button type="submit" id="btn" class="btn btn-primary">로그인</button>
  </form>
  <div class="divider my-6">소셜 로그인</div>
  <div class="space-y-3">
    <button onclick="socialLogin('kakao')" class="btn" style="background:#FEE500;color:#3C1E1E"><i class="fas fa-comment mr-2"></i>카카오로 로그인</button>
    <button onclick="socialLogin('naver')" class="btn" style="background:#03C75A;color:#fff"><span class="font-bold mr-1">N</span>네이버로 로그인</button>
  </div>
  <p class="text-center text-sm text-gray-400 mt-6">계정이 없으신가요? <a href="/register" class="ev-green font-semibold">회원가입</a></p>
</div>
<script>
const KAKAO_CLIENT_ID = '${kakaoClientId}';
const NAVER_CLIENT_ID = '${naverClientId}';
async function doLogin(e) {
  e.preventDefault();
  const btn=document.getElementById('btn'); btn.disabled=true; btn.textContent='로그인 중...';
  try {
    const r=await API.post('/auth/login',{email:document.getElementById('email').value,password:document.getElementById('pw').value});
    if(r.user.userType!=='station_owner')return showToast('사장님 계정으로 로그인해주세요.','error');
    setUser(r.token,r.user); window.location.href='/owner';
  } catch(e){showToast(e.message||'로그인 실패','error');btn.disabled=false;btn.textContent='로그인';}
}
function socialLogin(provider) {
  if(!KAKAO_CLIENT_ID && provider==='kakao'){showToast('카카오 로그인이 준비되지 않았습니다.','error');return;}
  if(!NAVER_CLIENT_ID && provider==='naver'){showToast('네이버 로그인이 준비되지 않았습니다.','error');return;}
  const redirect=encodeURIComponent(location.origin+'/api/auth/'+provider+'/callback');
  const url=provider==='kakao'?'https://kauth.kakao.com/oauth/authorize?client_id='+KAKAO_CLIENT_ID+'&redirect_uri='+redirect+'&response_type=code':'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id='+NAVER_CLIENT_ID+'&redirect_uri='+redirect+'&state='+Math.random().toString(36).slice(2);
  window.open(url,'social_login','width=520,height=620');
  window.addEventListener('message',e=>{if(e.data?.type==='social_login'){if(e.data.user?.userType!=='station_owner'){showToast('사장님 계정으로 로그인해주세요.','error');return;}setUser(e.data.token,e.data.user);window.location.href='/owner';}},{once:true});
}
</script>
`)
}

export function ownerDashboardPage(): string {
  return htmlPage('사장님 대시보드', `
<div class="min-h-screen pb-6">
  <div class="ev-bg text-white px-5 pb-6" style="padding-top:max(48px,env(safe-area-inset-top))">
    <div class="flex justify-between items-center">
      <div>
        <p class="text-sm opacity-75" id="ownerName">사장님</p>
        <h1 class="text-2xl font-bold mt-0.5">대시보드</h1>
      </div>
      <button onclick="doLogout()" class="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
        <i class="fas fa-sign-out-alt text-white"></i>
      </button>
    </div>
  </div>
  <div class="p-4 space-y-4">
    <div id="applicationStatus"></div>
    <div id="stationList"></div>
  </div>
</div>
<script>
window.addEventListener('DOMContentLoaded',async()=>{
  const u=requireAuth('station_owner'); if(!u)return;
  document.getElementById('ownerName').textContent=u.name+'님';
  await Promise.all([loadApplications(),loadStations()]);
});
async function loadApplications() {
  try {
    const r=await API.get('/stations/my-applications'); const apps=r.applications||[];
    const pending=apps.filter(a=>a.status==='pending');
    const rejected=apps.filter(a=>a.status==='rejected');
    const el=document.getElementById('applicationStatus');
    if(pending.length){el.innerHTML='<div class="card border-l-4 border-amber-400"><div class="flex items-center gap-3"><i class="fas fa-clock text-amber-400 text-lg"></i><div><p class="font-semibold text-gray-800">심사 중</p><p class="text-xs text-gray-400 mt-0.5">'+pending[0].station_name+' · 1~2 영업일 소요</p></div></div></div>';}
    else if(rejected.length&&!apps.find(a=>a.status==='approved')){el.innerHTML='<div class="card border-l-4 border-red-400"><p class="font-semibold text-red-600 mb-1">신청이 반려되었습니다</p><p class="text-sm text-gray-600 mb-3">'+(rejected[0].reject_reason||'')+'</p><a href="/owner/apply" class="btn btn-primary">재신청하기</a></div>';}
  } catch {}
}
async function loadStations() {
  try {
    const r=await API.get('/stations/my-stations'); const list=r.stations||[];
    const el=document.getElementById('stationList');
    if(!list.length){el.innerHTML='<div class="card text-center py-12"><i class="fas fa-gas-pump text-5xl text-gray-200 mb-4"></i><p class="text-gray-500 mb-1 font-medium">등록된 주유소가 없습니다</p><p class="text-sm text-gray-400 mb-5">주유소를 등록하여 쿠폰을 판매하세요</p><a href="/owner/apply" class="btn btn-primary" style="width:auto;display:inline-block;padding:13px 28px">주유소 등록 신청</a></div>';return;}
    el.innerHTML='<h2 class="section-title">내 주유소</h2>'+list.map(s=>'<a href="/owner/stations/'+s.id+'" class="card block mb-3 fade-in"><div class="flex items-center justify-between"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><h3 class="font-semibold text-gray-800 truncate">'+s.station_name+'</h3>'+(s.is_closed?'<span class="badge badge-red flex-shrink-0">폐업</span>':s.is_active?'<span class="badge badge-green flex-shrink-0">운영중</span>':'<span class="badge badge-gray flex-shrink-0">비활성</span>')+'</div><p class="text-xs text-gray-400 truncate">'+s.address+'</p><div class="flex gap-4 mt-1.5 text-xs text-gray-500"><span>쿠폰 <b>'+s.coupon_count+'</b>종</span><span>이번달 <b>'+s.monthly_usages+'</b>건</span></div></div><i class="fas fa-chevron-right text-gray-200 ml-2"></i></div></a>').join('')
    +'<a href="/owner/apply" class="btn btn-outline mt-2"><i class="fas fa-plus mr-2"></i>주유소 추가 등록</a>';
  } catch {}
}
function doLogout() {
  showDialog({ icon:'👋', title:'로그아웃', msg:'로그아웃 하시겠습니까?', confirmText:'로그아웃', confirmClass:'btn-danger', onConfirm: logout });
}
</script>
`)
}

export function ownerApplyPage(): string {
  return htmlPage('주유소 등록 신청', `
<div class="min-h-screen pb-10">
  <div class="page-header">
    <button onclick="history.back()" class="back-btn"><i class="fas fa-arrow-left"></i></button>
    <span class="page-header-title">주유소 등록 신청</span>
  </div>
  <form onsubmit="doApply(event)" class="p-4 space-y-4">
    <div class="card">
      <h3 class="font-semibold text-gray-700 mb-3">기본 정보</h3>
      <div class="space-y-3">
        <input id="station_name" type="text" placeholder="주유소명" class="input" required>
        <!-- 주소 검색 영역 -->
        <div>
          <div class="flex gap-2">
            <input id="postcode" type="text" placeholder="우편번호" class="input" readonly
              style="flex:0 0 110px; background:#f9fafb; color:#6b7280; cursor:default;">
            <button type="button" onclick="openAddrSearch()"
              class="btn btn-primary flex-1" style="white-space:nowrap;">
              <i class="fas fa-search mr-1.5"></i>주소 검색
            </button>
          </div>
          <input id="address" type="text" placeholder="도로명 주소 (검색 후 자동 입력)" class="input mt-2"
            readonly required style="background:#f9fafb; color:#374151; cursor:default;">
          <input id="address_detail" type="text" placeholder="상세주소 (동·호수 등)" class="input mt-2">
        </div>
        <input id="phone" type="tel" placeholder="주유소 전화번호 (선택)" class="input"
          oninput="formatPhone(this)" maxlength="13" inputmode="numeric">
        <div>
          <label class="text-xs text-gray-500 mb-1.5 block">세차기 유형</label>
          <select id="car_wash_type" class="input">
            <option value="automatic">🚗 자동 세차기</option>
            <option value="self">💧 셀프 세차</option>
            <option value="both">🚗 자동 + 셀프</option>
          </select>
        </div>
      </div>
    </div>
    <div class="card">
      <h3 class="font-semibold text-gray-700 mb-3">사업자 정보</h3>
      <div class="space-y-3">
        <input id="business_reg_number" type="text" placeholder="사업자등록번호" class="input" required>
        <div>
          <label class="text-xs text-gray-500 mb-1.5 block">사업자등록증 사진</label>
          <input id="biz_file" type="file" accept="image/*,.pdf" class="input" style="padding:12px">
        </div>
      </div>
    </div>
    <div class="card">
      <h3 class="font-semibold text-gray-700 mb-3">정산 계좌</h3>
      <div class="space-y-3">
        <input id="bank_name" type="text" placeholder="은행명" class="input" required>
        <input id="account_number" type="text" placeholder="계좌번호" class="input" required>
        <input id="account_holder" type="text" placeholder="예금주명" class="input" required>
        <div>
          <label class="text-xs text-gray-500 mb-1.5 block">통장 사본</label>
          <input id="acc_file" type="file" accept="image/*,.pdf" class="input" style="padding:12px">
        </div>
      </div>
    </div>
    <p class="text-xs text-gray-400 text-center py-1">승인까지 1~2 영업일 소요</p>
    <button type="submit" id="submitBtn" class="btn btn-primary">신청하기</button>
  </form>
</div>
<script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
<script>
window.addEventListener('DOMContentLoaded',()=>requireAuth('station_owner'));

function formatPhone(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 11);
  if (v.length < 4) input.value = v;
  else if (v.length < 8) input.value = v.slice(0,3) + '-' + v.slice(3);
  else input.value = v.slice(0,3) + '-' + v.slice(3,7) + '-' + v.slice(7);
}

function openAddrSearch() {
  new daum.Postcode({
    oncomplete: function(data) {
      // 도로명 주소 우선, 없으면 지번 주소
      const addr = data.roadAddress || data.jibunAddress;
      document.getElementById('postcode').value = data.zonecode;
      document.getElementById('address').value = addr;
      // 상세주소 입력창으로 포커스
      document.getElementById('address_detail').focus();
    },
    // 모바일 전체화면으로 열기
    width: '100%',
    height: '100%',
    maxSuggestItems: 5
  }).open({ autoClose: true });
}

async function uploadFile(file) {
  if(!file)return null;
  const fd=new FormData(); fd.append('file',file);
  const res=await fetch('/api/stations/upload',{method:'POST',headers:{Authorization:'Bearer '+localStorage.getItem('ev_token')},body:fd});
  if(!res.ok)throw new Error('파일 업로드 실패');
  return (await res.json()).key;
}
async function doApply(e) {
  e.preventDefault();
  if (!document.getElementById('address').value) {
    showToast('주소 검색 버튼을 눌러 주소를 입력해주세요.', 'error');
    return;
  }
  const btn=document.getElementById('submitBtn'); btn.disabled=true; btn.textContent='제출 중...';
  try {
    const [bizKey,accKey]=await Promise.all([uploadFile(document.getElementById('biz_file').files[0]),uploadFile(document.getElementById('acc_file').files[0])]);
    const phoneRaw = document.getElementById('phone').value.replace(/\D/g, '');
    await API.post('/stations/apply',{
      station_name: document.getElementById('station_name').value,
      address: document.getElementById('address').value,
      address_detail: document.getElementById('address_detail').value || undefined,
      phone: phoneRaw || undefined,
      car_wash_type: document.getElementById('car_wash_type').value,
      business_reg_number: document.getElementById('business_reg_number').value,
      bank_name: document.getElementById('bank_name').value,
      account_number: document.getElementById('account_number').value,
      account_holder: document.getElementById('account_holder').value,
      business_reg_image_key: bizKey || undefined,
      account_image_key: accKey || undefined
    });
    showToast('신청이 접수되었습니다!');
    setTimeout(()=>window.location.href='/owner',1200);
  } catch(e){showToast(e.message||'신청 실패','error');btn.disabled=false;btn.textContent='신청하기';}
}
</script>
`)
}

export function ownerStationPage(): string {
  return htmlPage('주유소 관리', `
<!-- ★ 스크립트를 body 최상단에 먼저 정의해야 onclick="showTab(...)" 참조 오류 없음 -->
<script>

/* ── 전역 상태 ── */
const stationId = location.pathname.split('/').pop();
let _currentTab = 'coupons';
let _editCouponId = null;

/* ── 탭 전환 ── */
function showTab(tab) {
  _currentTab = tab;
  ['coupons','qr','usage','settlement'].forEach(t => {
    const btn = document.getElementById('tab_' + t);
    const ct  = document.getElementById('ct_' + t);
    if (!btn || !ct) return;
    btn.className = 'flex-1 py-3.5 text-sm font-semibold border-b-2 transition-colors ' +
      (t === tab ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400');
    ct.classList.toggle('hidden', t !== tab);
  });
  if (tab === 'coupons')    loadCoupons();
  else if (tab === 'qr')    loadQR();
  else if (tab === 'usage') loadUsages();
  else                      loadSettlements();
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
        <div class="card mb-3">
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1 min-w-0 pr-3">
              <h3 class="font-semibold text-gray-800 truncate">\${c.title}</h3>
              \${c.description ? '<p class="text-xs text-gray-400 mt-0.5 truncate">' + c.description + '</p>' : ''}
            </div>
            <!-- 활성화 토글 -->
            <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input type="checkbox" \${c.is_active ? 'checked' : ''}
                onchange="toggleCoupon(\${c.id}, this.checked)" class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-checked:bg-green-500 rounded-full transition-all
                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                peer-checked:after:translate-x-5"></div>
            </label>
          </div>
          <!-- 가격 정보 -->
          <div class="flex items-baseline gap-2 mb-2">
            <span class="text-xl font-bold text-green-600">\${formatPrice(c.discount_price)}</span>
            <span class="text-sm text-gray-300 line-through">\${formatPrice(c.original_price)}</span>
            <span class="badge badge-red">\${pct}%</span>
          </div>
          <!-- 하단 메타 -->
          <div class="flex items-center justify-between">
            <div class="flex gap-3 text-xs text-gray-400">
              <span><i class="fas fa-sync-alt mr-1"></i>\${c.wash_count}회권</span>
              <span><i class="fas fa-box mr-1"></i>\${stockTxt}</span>
              <span><i class="fas fa-shopping-cart mr-1"></i>\${c.active_purchases || 0}건 판매</span>
            </div>
            <button onclick="openCouponModal(\${c.id})" class="text-xs text-gray-400 hover:text-green-500 px-2 py-1">
              <i class="fas fa-pen"></i>
            </button>
          </div>
        </div>\`;
      }).join('');
    } else {
      html += \`<div class="card text-center py-14 text-gray-400">
        <i class="fas fa-ticket-alt text-4xl mb-3 text-gray-200"></i>
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
  const modal = document.getElementById('couponModal');
  const title = document.getElementById('couponModalTitle');

  // 입력 필드 초기화
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
    el.className = 'text-xs text-green-500 font-semibold mt-1';
  } else if (orig > 0 && disc >= orig) {
    el.textContent = '판매가는 정가보다 낮아야 합니다';
    el.className = 'text-xs text-red-500 mt-1';
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

    // 서버에서 직접 SVG 생성 (토큰 인증 포함)
    const token = localStorage.getItem('ev_token');
    const qrApiUrl = '/api/stations/my-stations/' + stationId + '/qr-image?token=' + encodeURIComponent(token);

    // Blob URL로 변환 (img src에 토큰 노출 방지 + CORS 없음)
    let qrBlobUrl = qrApiUrl; // 기본값: 직접 URL
    try {
      const res = await fetch(qrApiUrl);
      if (res.ok) {
        const blob = await res.blob();
        qrBlobUrl = URL.createObjectURL(blob);
      }
    } catch {}

    el.innerHTML = \`
      <div class="card text-center py-6">
        <div class="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <i class="fas fa-qrcode text-green-500 text-2xl"></i>
        </div>
        <h3 class="font-bold text-gray-800 text-lg mb-1">\${r.station_name}</h3>
        <p class="text-xs text-gray-400 mb-6">고객이 세차 완료 후 이 QR을 스캔합니다</p>
        <div class="bg-white rounded-2xl p-4 inline-block shadow-sm border border-gray-100 mb-5">
          <img id="qrImg" src="\${qrBlobUrl}" alt="QR코드"
            width="240" height="240"
            style="display:block">
        </div>
        <p class="text-xs text-gray-300 break-all px-4 mb-5">\${r.qr_code}</p>
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
        <div class="card text-center py-4">
          <p class="text-2xl font-bold text-green-600">\${total}</p>
          <p class="text-xs text-gray-400 mt-1">총 사용건수</p>
        </div>
        <div class="card text-center py-4">
          <p class="text-2xl font-bold text-blue-500">\${formatPrice(r.total_revenue || 0)}</p>
          <p class="text-xs text-gray-400 mt-1">총 매출</p>
        </div>
      </div>
      <h3 class="section-title">사용 내역</h3>
    \`;
    if (usages.length) {
      html += usages.map(u => \`
        <div class="card mb-2">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0 pr-3">
              <p class="text-sm font-medium text-gray-800 truncate">\${u.coupon_title}</p>
              <p class="text-xs text-gray-400 mt-0.5">
                <i class="fas fa-user mr-1"></i>\${u.user_name}
                <span class="mx-1">·</span>
                <i class="fas fa-clock mr-1"></i>\${formatDateTime(u.used_at)}
              </p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="font-semibold text-gray-800">\${formatPrice(u.unit_price)}</p>
              <span class="badge \${u.settled ? 'badge-gray' : 'badge-amber'} text-xs">
                \${u.settled ? '정산완료' : '정산대기'}
              </span>
            </div>
          </div>
        </div>
      \`).join('');

      // 페이지네이션
      const totalPages = Math.ceil(total / 20);
      if (totalPages > 1) {
        html += '<div class="flex justify-center gap-2 mt-4">';
        for (let i = 1; i <= totalPages; i++) {
          html += \`<button onclick="loadUsages(\${i})" class="w-9 h-9 rounded-full text-sm \${i === page ? 'bg-green-500 text-white font-bold' : 'bg-gray-100 text-gray-600'}">\${i}</button>\`;
        }
        html += '</div>';
      }
    } else {
      html += \`<div class="card text-center py-14 text-gray-400">
        <i class="fas fa-history text-4xl mb-3 text-gray-200"></i>
        <p class="font-medium">아직 사용 내역이 없습니다</p>
      </div>\`;
    }
    el.innerHTML = html;
  } catch(e) { el.innerHTML = errBox(e.message); }
}

/* ══════════════════════════════════
   정산 탭
══════════════════════════════════ */
async function loadSettlements() {
  const el = document.getElementById('ct_settlement');
  el.innerHTML = spinner();
  try {
    const r = await API.get('/stations/my-stations/' + stationId + '/settlements');
    const list = r.settlements || [];

    let html = \`
      <!-- 정산 대기 금액 카드 -->
      <div class="card mb-4" style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #a7f3d0">
        <p class="text-xs text-gray-500 mb-1.5"><i class="fas fa-clock text-green-400 mr-1"></i>정산 대기 금액</p>
        <p class="text-3xl font-bold text-green-700 mb-1">\${formatPrice(r.pending_amount || 0)}</p>
        <p class="text-xs text-gray-400">플랫폼 수수료 15% 차감 후 익일 지급</p>
      </div>

      <!-- 수수료 안내 -->
      <div class="card mb-4 bg-gray-50 border border-gray-200">
        <h4 class="text-xs font-semibold text-gray-600 mb-2"><i class="fas fa-info-circle text-blue-400 mr-1"></i>정산 안내</h4>
        <ul class="text-xs text-gray-500 space-y-1">
          <li>· 매출 금액의 15%가 플랫폼 수수료로 차감됩니다</li>
          <li>· 정산은 매주 월요일 기준으로 처리됩니다</li>
          <li>· 지급은 처리 다음 영업일에 완료됩니다</li>
        </ul>
      </div>

      <h3 class="section-title">정산 내역</h3>
    \`;

    if (list.length) {
      html += list.map(s => {
        const grossStr  = formatPrice(s.gross_amount || (s.net_amount + s.platform_fee));
        const feeStr    = formatPrice(s.platform_fee);
        const netStr    = formatPrice(s.net_amount);
        const isCompleted = s.status === 'completed';
        return \`
        <div class="card mb-3">
          <div class="flex items-start justify-between mb-2">
            <div>
              <p class="font-semibold text-gray-800">\${s.settlement_date || formatDate(s.created_at)}</p>
              <p class="text-xs text-gray-400 mt-0.5">\${s.usage_count}건 사용</p>
            </div>
            <span class="badge \${isCompleted ? 'badge-green' : 'badge-amber'}">
              \${isCompleted ? '지급완료' : '처리중'}
            </span>
          </div>
          <div class="border-t border-gray-100 pt-2 mt-1 space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">매출 합계</span>
              <span class="text-gray-700">\${grossStr}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">수수료 (15%)</span>
              <span class="text-red-400">-\${feeStr}</span>
            </div>
            <div class="flex justify-between font-semibold border-t border-gray-100 pt-1 mt-1">
              <span class="text-gray-700">실 지급액</span>
              <span class="text-green-600">\${netStr}</span>
            </div>
          </div>
        </div>\`;
      }).join('');
    } else {
      html += \`<div class="card text-center py-14 text-gray-400">
        <i class="fas fa-money-bill-wave text-4xl mb-3 text-gray-200"></i>
        <p class="font-medium">정산 내역이 없습니다</p>
        <p class="text-xs mt-1">쿠폰 판매 후 정산이 시작됩니다</p>
      </div>\`;
    }
    el.innerHTML = html;
  } catch(e) { el.innerHTML = errBox(e.message); }
}

/* ── 공통 헬퍼 ── */
function spinner() { return '<div class="text-center py-14"><i class="fas fa-spinner fa-spin text-green-400 text-2xl"></i></div>'; }
function errBox(msg) { return '<div class="card text-center py-8 text-red-400"><i class="fas fa-exclamation-circle mb-2 text-xl"></i><p>' + (msg || '불러올 수 없습니다') + '</p></div>'; }

/* ── 초기화 ── */
window.addEventListener('DOMContentLoaded', async () => {
  const u = requireAuth('station_owner');
  if (!u) return;
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
  <div class="bg-white border-b border-gray-100 flex sticky top-14 z-40">
    <button id="tab_coupons"    onclick="showTab('coupons')"     class="flex-1 py-3.5 text-sm font-semibold border-b-2 border-green-500 text-green-600 transition-colors">쿠폰</button>
    <button id="tab_qr"         onclick="showTab('qr')"          class="flex-1 py-3.5 text-sm font-semibold border-b-2 border-transparent text-gray-400 transition-colors">QR</button>
    <button id="tab_usage"      onclick="showTab('usage')"       class="flex-1 py-3.5 text-sm font-semibold border-b-2 border-transparent text-gray-400 transition-colors">사용내역</button>
    <button id="tab_settlement" onclick="showTab('settlement')"  class="flex-1 py-3.5 text-sm font-semibold border-b-2 border-transparent text-gray-400 transition-colors">정산</button>
  </div>

  <!-- 탭 콘텐츠 -->
  <div class="p-4">
    <div id="ct_coupons"></div>
    <div id="ct_qr"         class="hidden"></div>
    <div id="ct_usage"      class="hidden"></div>
    <div id="ct_settlement" class="hidden"></div>
  </div>
</div>

<!-- ── 쿠폰 추가/수정 모달 ── -->
<div id="couponModal" class="modal-bg hidden">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-handle"></div>
    <div id="couponModalTitle" class="modal-title">쿠폰 추가</div>
    <div class="space-y-3 mb-5">
      <div>
        <label class="text-xs text-gray-500 mb-1 block">쿠폰명 <span class="text-red-400">*</span></label>
        <input id="c_title" type="text" placeholder="예: 기본 세차 3회권" class="input">
      </div>
      <div>
        <label class="text-xs text-gray-500 mb-1 block">설명 (선택)</label>
        <input id="c_desc" type="text" placeholder="쿠폰에 대한 간단한 설명" class="input">
      </div>
      <div class="flex gap-3">
        <div style="flex:1">
          <label class="text-xs text-gray-500 mb-1 block">정가 (원) <span class="text-red-400">*</span></label>
          <input id="c_orig" type="number" placeholder="10000" class="input" min="100" inputmode="numeric" oninput="updateDiscountPct()">
        </div>
        <div style="flex:1">
          <label class="text-xs text-gray-500 mb-1 block">판매가 (원) <span class="text-red-400">*</span></label>
          <input id="c_disc" type="number" placeholder="9000" class="input" min="100" inputmode="numeric" oninput="updateDiscountPct()">
        </div>
      </div>
      <p id="c_discount_pct" class="text-xs text-green-500 font-semibold -mt-1"></p>
      <div>
        <label class="text-xs text-gray-500 mb-1.5 block">이용 횟수 <span class="text-red-400">*</span></label>
        <select id="c_count" class="input">
          <option value="1">1회권</option><option value="2">2회권</option><option value="3">3회권</option>
          <option value="4">4회권</option><option value="5">5회권</option><option value="6">6회권</option>
          <option value="7">7회권</option><option value="8">8회권</option><option value="9">9회권</option>
          <option value="10">10회권</option>
        </select>
      </div>
      <div>
        <label class="text-xs text-gray-500 mb-1 block">판매 수량 (비워두면 무제한)</label>
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
