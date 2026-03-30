// 고객 페이지들 - EV-Wash
import { htmlPage } from '../layout'

export function loginPage(kakaoClientId = '', naverClientId = ''): string {
  return htmlPage('로그인', `
<div class="min-h-screen px-5 py-10 flex flex-col" style="padding-top:max(40px,env(safe-area-inset-top))">
  <div class="text-center mb-8">
    <div class="text-5xl mb-3">⚡</div>
    <h1 class="text-2xl font-bold text-gray-800">EV-Wash</h1>
    <p class="text-gray-400 text-sm mt-1">전국 EV 세차 쿠폰 서비스</p>
  </div>
  <form onsubmit="doLogin(event)" class="space-y-4">
    <input id="email" type="email" placeholder="이메일" class="input" required autocomplete="email">
    <input id="pw" type="password" placeholder="비밀번호" class="input" required autocomplete="current-password">
    <button type="submit" id="loginBtn" class="btn btn-primary">로그인</button>
  </form>
  <div class="divider my-6">소셜 로그인</div>
  <div class="space-y-3">
    <button onclick="socialLogin('kakao')" class="btn" style="background:#FEE500;color:#3C1E1E"><i class="fas fa-comment mr-2"></i>카카오로 로그인</button>
    <button onclick="socialLogin('naver')" class="btn" style="background:#03C75A;color:#fff"><span class="font-bold mr-1">N</span>네이버로 로그인</button>
  </div>
  <div class="mt-6 text-center space-y-2">
    <p class="text-sm text-gray-500">계정이 없으신가요? <a href="/register" class="ev-green font-semibold">회원가입</a></p>
    <p class="text-sm text-gray-500">사장님이신가요? <a href="/owner/login" class="ev-green font-semibold">사장님 로그인</a></p>
  </div>
</div>
<script>
const KAKAO_CLIENT_ID = '${kakaoClientId}';
const NAVER_CLIENT_ID = '${naverClientId}';
async function doLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = '로그인 중...';
  try {
    const r = await API.post('/auth/login', { email: document.getElementById('email').value, password: document.getElementById('pw').value });
    setUser(r.token, r.user);
    if (r.user.userType === 'admin') window.location.href = '/admin';
    else if (r.user.userType === 'station_owner') window.location.href = '/owner';
    else window.location.href = '/home';
  } catch(e) { showToast(e.message || '로그인 실패', 'error'); btn.disabled = false; btn.textContent = '로그인'; }
}
function socialLogin(provider) {
  if (!KAKAO_CLIENT_ID && provider === 'kakao') { showToast('카카오 로그인이 준비되지 않았습니다.', 'error'); return; }
  if (!NAVER_CLIENT_ID && provider === 'naver') { showToast('네이버 로그인이 준비되지 않았습니다.', 'error'); return; }
  const redirect = encodeURIComponent(location.origin + '/api/auth/' + provider + '/callback');
  const url = provider === 'kakao'
    ? 'https://kauth.kakao.com/oauth/authorize?client_id=' + KAKAO_CLIENT_ID + '&redirect_uri=' + redirect + '&response_type=code'
    : 'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=' + NAVER_CLIENT_ID + '&redirect_uri=' + redirect + '&state=' + Math.random().toString(36).slice(2);
  window.open(url, 'social_login', 'width=520,height=620');
  window.addEventListener('message', e => { if (e.data?.type === 'social_login') { setUser(e.data.token, e.data.user); window.location.href = e.data.user.userType === 'station_owner' ? '/owner' : '/home'; } }, { once: true });
}
</script>
`)
}

export function registerPage(): string {
  return htmlPage('회원가입', `
<div class="min-h-screen pb-10" style="padding-top:env(safe-area-inset-top)">
  <div class="page-header">
    <button onclick="history.back()" class="back-btn"><i class="fas fa-arrow-left"></i></button>
    <span class="page-header-title">회원가입</span>
  </div>
  <div class="px-5 py-6">
    <form onsubmit="doRegister(event)" class="space-y-4">
      <div>
        <label class="text-xs text-gray-500 mb-1.5 block font-medium">회원 유형</label>
        <select id="userType" class="input" onchange="onUserTypeChange(this.value)">
          <option value="customer">일반 고객</option>
          <option value="station_owner">주유소 사장님</option>
        </select>
      </div>
      <input id="name" type="text" placeholder="이름" class="input" required autocomplete="name">
      <input id="email" type="email" placeholder="이메일" class="input" required autocomplete="email">
      <div>
        <input id="phone" type="tel" placeholder="휴대폰 번호 (선택)" class="input" autocomplete="tel">
        <p id="phoneHint" class="text-xs text-gray-400 mt-1.5"></p>
      </div>
      <input id="pw" type="password" placeholder="비밀번호 (8자 이상)" class="input" required minlength="8" autocomplete="new-password">
      <input id="pw2" type="password" placeholder="비밀번호 확인" class="input" required autocomplete="new-password">
      <button type="submit" class="btn btn-primary">가입하기</button>
    </form>
    <p class="text-center text-sm text-gray-400 mt-5">이미 계정이 있으신가요? <a href="/login" class="ev-green font-semibold">로그인</a></p>
  </div>
</div>
<script>
function onUserTypeChange(type) {
  const phoneInput = document.getElementById('phone');
  const phoneHint = document.getElementById('phoneHint');
  if (type === 'station_owner') {
    phoneInput.placeholder = '휴대폰 번호 (필수)';
    phoneInput.required = true;
    phoneHint.textContent = '※ 사장님 계정은 전화번호가 필수입니다.';
    phoneHint.className = 'text-xs text-red-500 mt-1.5';
  } else {
    phoneInput.placeholder = '휴대폰 번호 (선택)';
    phoneInput.required = false;
    phoneHint.textContent = '';
  }
}
async function doRegister(e) {
  e.preventDefault();
  if (document.getElementById('pw').value !== document.getElementById('pw2').value) return showToast('비밀번호가 일치하지 않습니다.', 'error');
  const userType = document.getElementById('userType').value;
  const phone = document.getElementById('phone').value.trim();
  if (userType === 'station_owner' && !phone) {
    showToast('사장님 계정은 전화번호를 입력해주세요.', 'error');
    document.getElementById('phone').focus();
    return;
  }
  try {
    const r = await API.post('/auth/register', {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      phone: phone || undefined,
      password: document.getElementById('pw').value,
      userType
    });
    setUser(r.token, r.user);
    showToast('가입되었습니다!');
    setTimeout(() => window.location.href = r.user.userType === 'station_owner' ? '/owner' : '/home', 800);
  } catch(e) { showToast(e.message || '가입 실패', 'error'); }
}
</script>
`)
}

export function customerHomePage(): string {
  return htmlPage('홈', `
<div class="min-h-screen pb-24">
  <div class="ev-bg text-white px-5 pb-6" style="padding-top:max(48px,env(safe-area-inset-top))">
    <div class="flex items-center justify-between mb-5">
      <div><p class="text-sm opacity-75" id="greeting">안녕하세요</p><h1 class="text-2xl font-bold" id="userName">EV-Wash</h1></div>
      <a href="/mypage" class="w-11 h-11 rounded-full bg-white bg-opacity-20 flex items-center justify-center"><i class="fas fa-user text-white text-lg"></i></a>
    </div>
    <div class="relative">
      <input id="searchInput" type="search" placeholder="주유소명 또는 지역 검색" class="w-full px-4 py-3.5 pl-11 rounded-2xl text-gray-800 text-base outline-none" style="-webkit-appearance:none" onkeydown="if(event.key==='Enter')doSearch()">
      <i class="fas fa-search absolute left-4 top-4 text-gray-400 text-sm"></i>
      <button onclick="doSearch()" class="absolute right-3 top-2.5 bg-green-500 text-white text-xs px-3 py-2 rounded-xl">검색</button>
    </div>
  </div>
  <div id="couponSummary" class="hidden px-4 pt-4">
    <a href="/my-coupons" class="card flex items-center justify-between fade-in">
      <div><p class="text-xs text-gray-400">보유 쿠폰</p><p class="text-xl font-bold text-gray-800"><span id="couponCount">-</span>회 사용 가능</p></div>
      <div class="flex items-center gap-2 text-green-500"><i class="fas fa-ticket-alt text-2xl"></i><i class="fas fa-chevron-right text-gray-300 text-sm"></i></div>
    </a>
  </div>
  <div class="px-4 pt-4">
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-bold text-gray-800">주변 주유소</h2>
      <button onclick="getLocation()" class="text-sm text-green-600 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50"><i class="fas fa-location-dot"></i>내 위치</button>
    </div>
    <div id="stationList">
      <div class="card text-center py-12 text-gray-400">
        <i class="fas fa-map-marker-alt text-4xl mb-3 text-green-200"></i>
        <p class="text-sm">위치 검색 또는 키워드로<br>주유소를 찾아보세요</p>
        <button onclick="getLocation()" class="mt-4 btn btn-outline btn-sm" style="width:auto;padding:10px 24px"><i class="fas fa-location-dot mr-1"></i>내 주변 찾기</button>
      </div>
    </div>
  </div>
</div>
<nav class="bottom-nav">
  <a href="/home" class="active"><i class="fas fa-home"></i>홈</a>
  <a href="/stations"><i class="fas fa-gas-pump"></i>주유소</a>
  <a href="/my-coupons"><i class="fas fa-ticket-alt"></i>내 쿠폰</a>
  <a href="/mypage"><i class="fas fa-user"></i>마이</a>
</nav>
<script>
window.addEventListener('DOMContentLoaded', async () => {
  const u = getUser();
  if (u) {
    document.getElementById('greeting').textContent = '안녕하세요!';
    document.getElementById('userName').textContent = u.name + '님';
    document.getElementById('couponSummary').classList.remove('hidden');
    try { const r = await API.get('/coupons/my'); document.getElementById('couponCount').textContent = (r.stations||[]).reduce((s,x)=>s+x.remaining_quantity,0); } catch {}
  }
  loadStations();
});
async function loadStations(q='') {
  try { const r = await API.get('/stations/nearby'+(q?'?'+q:'')); renderStations(r.stations||[]); } catch { renderStations([]); }
}
function doSearch() { const kw = document.getElementById('searchInput').value.trim(); if(kw) loadStations('keyword='+encodeURIComponent(kw)); }
function getLocation() {
  if (!navigator.geolocation) return showToast('위치 서비스 미지원', 'error');
  navigator.geolocation.getCurrentPosition(p => loadStations('latitude='+p.coords.latitude+'&longitude='+p.coords.longitude), () => showToast('위치 권한이 필요합니다', 'warn'));
}
function renderStations(list) {
  const el = document.getElementById('stationList');
  if (!list.length) { el.innerHTML = '<div class="card text-center py-10 text-gray-400"><i class="fas fa-search text-2xl mb-2"></i><p class="text-sm">검색 결과가 없습니다</p></div>'; return; }
  el.innerHTML = list.map(s=>'<a href="/stations/'+s.id+'" class="card block mb-3 fade-in"><div class="flex items-start justify-between"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><h3 class="font-semibold text-gray-800 truncate">'+s.station_name+'</h3><span class="badge badge-green flex-shrink-0">'+(s.coupon_count||0)+'종</span></div><p class="text-xs text-gray-400 truncate">'+s.address+'</p>'+(s.distance!=null?'<p class="text-xs text-gray-300 mt-0.5">'+s.distance.toFixed(1)+'km</p>':'')+'</div><i class="fas fa-chevron-right text-gray-200 ml-3 mt-1"></i></div></a>').join('');
}
</script>
`)
}

export function stationListPage(): string {
  return htmlPage('주유소 찾기', `
<div class="min-h-screen pb-24">
  <div class="bg-white sticky top-0 z-50 px-4 pt-3 pb-2 border-b border-gray-100" style="padding-top:max(12px,env(safe-area-inset-top))">
    <div class="relative"><input id="si" type="search" placeholder="주유소명 또는 지역으로 검색" class="input pl-11" style="background:#f8fafc;font-size:16px" oninput="debounce()" onkeydown="if(event.key==='Enter')doSearch()"><i class="fas fa-search absolute left-4 top-4 text-gray-400 text-sm"></i></div>
    <button onclick="getLocation()" class="mt-2 w-full text-sm text-green-600 flex items-center justify-center gap-1.5 py-2"><i class="fas fa-location-dot"></i>현재 위치로 찾기</button>
  </div>
  <div id="list" class="p-4 space-y-3"></div>
</div>
<nav class="bottom-nav">
  <a href="/home"><i class="fas fa-home"></i>홈</a>
  <a href="/stations" class="active"><i class="fas fa-gas-pump"></i>주유소</a>
  <a href="/my-coupons"><i class="fas fa-ticket-alt"></i>내 쿠폰</a>
  <a href="/mypage"><i class="fas fa-user"></i>마이</a>
</nav>
<script>
let dt;
function debounce() { clearTimeout(dt); dt=setTimeout(doSearch,400); }
function doSearch() { const kw=document.getElementById('si').value.trim(); loadStations(kw?'keyword='+encodeURIComponent(kw):''); }
function getLocation() { navigator.geolocation?.getCurrentPosition(p=>loadStations('latitude='+p.coords.latitude+'&longitude='+p.coords.longitude),()=>showToast('위치 권한이 필요합니다','warn')); }
async function loadStations(q='') {
  try { const r=await API.get('/stations/nearby'+(q?'?'+q:'')); const list=r.stations||[];
  const el=document.getElementById('list');
  el.innerHTML=list.length?list.map(s=>'<a href="/stations/'+s.id+'" class="card block fade-in"><div class="flex items-center justify-between"><div class="flex-1 min-w-0"><h3 class="font-semibold text-gray-800 truncate">'+s.station_name+'</h3><p class="text-xs text-gray-400 truncate mt-0.5">'+s.address+'</p><div class="flex items-center gap-2 mt-1.5"><span class="badge badge-green">쿠폰 '+(s.coupon_count||0)+'종</span>'+(s.distance!=null?'<span class="text-xs text-gray-300">'+s.distance.toFixed(1)+'km</span>':'')+'</div></div><i class="fas fa-chevron-right text-gray-200 ml-3"></i></div></a>').join(''):'<div class="card text-center py-12 text-gray-400">검색 결과가 없습니다</div>'; } catch {}
}
window.addEventListener('DOMContentLoaded',()=>loadStations());
</script>
`)
}

export function stationDetailPage(): string {
  return htmlPage('주유소 상세', `
<div class="min-h-screen pb-8">
  <div class="page-header">
    <button onclick="history.back()" class="back-btn"><i class="fas fa-arrow-left"></i></button>
    <span id="pageTitle" class="page-header-title">주유소</span>
  </div>
  <div id="content" class="p-4 space-y-4">
    <div class="card text-center py-12"><i class="fas fa-spinner fa-spin text-green-400 text-2xl"></i></div>
  </div>
</div>

<!-- 구매 수량 선택 모달 -->
<div id="buyModal" class="modal-bg hidden">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-handle"></div>
    <div class="modal-title" id="buyModalTitle">쿠폰 구매</div>
    <p class="modal-sub" id="buyModalSub"></p>
    <div class="mb-5">
      <label class="text-sm font-medium text-gray-600 mb-3 block">구매 수량</label>
      <div class="flex items-center justify-between bg-gray-50 rounded-2xl p-2">
        <button onclick="changeQty(-1)" class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-gray-600 active:bg-gray-100">−</button>
        <div class="text-center">
          <div class="text-3xl font-bold text-gray-800" id="qtyNum">1</div>
          <div class="text-xs text-gray-400">매</div>
        </div>
        <button onclick="changeQty(1)" class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-green-600 active:bg-green-50">+</button>
      </div>
    </div>
    <div class="bg-green-50 rounded-2xl p-4 mb-5">
      <div class="flex justify-between items-center mb-1">
        <span class="text-sm text-gray-500">단가</span>
        <span class="text-sm font-semibold text-gray-800" id="unitPriceLabel"></span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-500">총 결제금액</span>
        <span class="text-xl font-bold text-green-600" id="totalPriceLabel"></span>
      </div>
    </div>
    <div class="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5 text-xs text-amber-700 space-y-1">
      <p class="font-semibold">📋 환불 정책 안내</p>
      <p>• 미사용 쿠폰은 언제든지 환불 가능합니다</p>
      <p>• 💳 카드 결제: 부분취소 시 영업일 3~4일 소요</p>
      <p>• 🏦 계좌이체: 180일 이내 취소 가능, 즉시 환불</p>
      <p>• 📱 휴대폰: 결제 당월에만 취소 가능</p>
    </div>
    <div class="flex gap-3">
      <button onclick="closeModal('buyModal')" class="btn btn-gray" style="flex:1">취소</button>
      <button onclick="confirmBuy()" class="btn btn-primary" style="flex:2">결제하기</button>
    </div>
  </div>
</div>

<script>
const stationId = location.pathname.split('/').pop();
let _buyData = {};
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const [sr,cr] = await Promise.all([API.get('/stations/'+stationId+'/info'), API.get('/stations/'+stationId+'/coupons')]);
    const s=sr.station, coupons=cr.coupons||[];
    document.getElementById('pageTitle').textContent = s.station_name;
    document.getElementById('content').innerHTML =
      '<div class="card"><h2 class="text-lg font-bold text-gray-800">'+s.station_name+'</h2>'
      +'<p class="text-sm text-gray-500 mt-2"><i class="fas fa-map-marker-alt text-green-400 mr-1.5"></i>'+s.address+(s.address_detail?' '+s.address_detail:'')+'</p>'
      +(s.phone?'<p class="text-sm text-gray-500 mt-1.5"><i class="fas fa-phone text-green-400 mr-1.5"></i><a href="tel:'+s.phone+'" class="text-green-600 font-medium">'+s.phone+'</a></p>':'')
      +'<div class="mt-3"><span class="badge badge-green">'+(s.car_wash_type==='automatic'?'🚗 자동세차':s.car_wash_type==='self'?'💧 셀프세차':'🚗 자동+셀프')+'</span></div></div>'
      +'<h3 class="font-bold text-gray-800 text-base">판매 쿠폰</h3>'
      +(coupons.length?coupons.map(c=>{
        const disc=Math.round((1-c.discount_price/c.original_price)*100);
        return '<div class="card fade-in">'
          +'<div class="flex justify-between items-start mb-2">'
          +'<div class="flex-1"><h4 class="font-semibold text-gray-800">'+c.title+'</h4>'+(c.description?'<p class="text-xs text-gray-400 mt-0.5">'+c.description+'</p>':'')+'</div>'
          +(disc>0?'<span class="badge badge-red ml-2 flex-shrink-0">'+disc+'%</span>':'')
          +'</div>'
          +'<div class="flex items-baseline gap-2 mb-2">'
          +'<span class="text-2xl font-bold text-green-600">'+formatPrice(c.discount_price)+'</span>'
          +(disc>0?'<span class="text-sm text-gray-300 line-through">'+formatPrice(c.original_price)+'</span>':'')
          +'</div>'
          +'<p class="text-xs text-gray-400 mb-4">'+c.wash_count+'회 이용권 · 유효기간 없음</p>'
          +'<button onclick="openBuyModal('+c.id+','+c.discount_price+',\''+c.title.replace(/\\/g,'\\\\').replace(/'/g,'\\\'').replace(/"/g,'\\"')+'\','+c.wash_count+')" class="btn btn-primary">구매하기</button>'
          +'</div>';
      }).join('')
      :'<div class="card text-center py-10 text-gray-400">판매 중인 쿠폰이 없습니다</div>');
  } catch { document.getElementById('content').innerHTML='<div class="card text-center py-10 text-red-400">정보를 불러올 수 없습니다</div>'; }
});
function openBuyModal(couponId, price, title, washCount) {
  if (!getUser()) return window.location.href = '/login';
  _buyData = { couponId, price, title, washCount, qty: 1 };
  document.getElementById('buyModalTitle').textContent = title;
  document.getElementById('buyModalSub').textContent = washCount + '회 이용권';
  document.getElementById('unitPriceLabel').textContent = formatPrice(price);
  updateBuyTotal();
  openModal('buyModal');
}
function changeQty(d) {
  _buyData.qty = Math.max(1, (_buyData.qty||1) + d);
  document.getElementById('qtyNum').textContent = _buyData.qty;
  updateBuyTotal();
}
function updateBuyTotal() {
  document.getElementById('totalPriceLabel').textContent = formatPrice(_buyData.price * _buyData.qty);
}
async function confirmBuy() {
  try {
    const r = await API.post('/coupons/buy', { couponId: _buyData.couponId, quantity: _buyData.qty });
    if (!r.clientKey || r.clientKey === 'test_ck_placeholder') { showToast('결제 키 미설정 (테스트 모드)', 'warn'); return; }
    closeModal('buyModal');
    window.location.href = 'https://api.tosspayments.com/v1/payments?clientKey=' + r.clientKey
      + '&amount=' + r.amount + '&orderId=' + r.orderId
      + '&orderName=' + encodeURIComponent(r.orderName)
      + '&successUrl=' + encodeURIComponent(r.successUrl)
      + '&failUrl=' + encodeURIComponent(r.failUrl);
  } catch (e) { showToast(e.message || '결제 준비 실패', 'error'); }
}
</script>
`)
}

export function myCouponsPage(): string {
  return htmlPage('내 쿠폰', `
<div class="min-h-screen pb-24">
  <div class="page-header">
    <span class="page-header-title">내 쿠폰</span>
  </div>
  <div id="content" class="p-4"><div class="card text-center py-12"><i class="fas fa-spinner fa-spin text-green-400 text-2xl"></i></div></div>
</div>
<nav class="bottom-nav">
  <a href="/home"><i class="fas fa-home"></i>홈</a>
  <a href="/stations"><i class="fas fa-gas-pump"></i>주유소</a>
  <a href="/my-coupons" class="active"><i class="fas fa-ticket-alt"></i>내 쿠폰</a>
  <a href="/mypage"><i class="fas fa-user"></i>마이</a>
</nav>
<script>
window.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('customer')) return;
  try {
    const r=await API.get('/coupons/my'); const stations=r.stations||[];
    const el=document.getElementById('content');
    if (!stations.length) { el.innerHTML='<div class="card text-center py-14 text-gray-400"><i class="fas fa-ticket-alt text-5xl mb-4 text-gray-200"></i><p class="mb-1 font-medium text-gray-500">보유한 쿠폰이 없습니다</p><p class="text-sm mb-5">주유소에서 쿠폰을 구매해보세요</p><a href="/stations" class="btn btn-primary" style="width:auto;display:inline-block;padding:12px 28px">주유소 찾기</a></div>'; return; }
    el.innerHTML=stations.map(st=>'<a href="/my-coupons/'+st.station_id+'" class="card block mb-3 fade-in"><div class="flex items-center justify-between"><div><h3 class="font-semibold text-gray-800">'+st.station_name+'</h3><p class="text-xs text-gray-400 mt-0.5">'+st.address+'</p></div><div class="text-right ml-3 flex-shrink-0"><p class="text-2xl font-bold text-green-600">'+st.remaining_quantity+'</p><p class="text-xs text-gray-400">회 남음</p></div></div></a>').join('');
  } catch { document.getElementById('content').innerHTML='<div class="card text-center py-10 text-red-400">불러올 수 없습니다</div>'; }
});
</script>
`)
}

export function myCouponDetailPage(): string {
  return htmlPage('쿠폰 사용', `
<div class="min-h-screen pb-8">
  <div class="page-header">
    <button onclick="history.back()" class="back-btn"><i class="fas fa-arrow-left"></i></button>
    <span id="pageTitle" class="page-header-title">쿠폰 사용</span>
  </div>
  <div id="content" class="p-4"><div class="card text-center py-12"><i class="fas fa-spinner fa-spin text-green-400 text-2xl"></i></div></div>
</div>

<!-- QR 스캔 모달 -->
<div id="qrModal" class="modal-bg hidden">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-handle"></div>
    <h3 class="modal-title mb-1">QR 코드 스캔</h3>
    <p class="text-sm text-gray-400 mb-4">주유소에 부착된 QR 코드를 스캔하세요</p>
    <div id="reader" style="width:100%;border-radius:16px;overflow:hidden;"></div>
    <button onclick="closeQR()" class="btn btn-gray mt-4">취소</button>
  </div>
</div>

<!-- 환불 모달 -->
<div id="refundModal" class="modal-bg hidden">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-handle"></div>
    <div class="modal-title">환불 요청</div>
    <p class="modal-sub" id="refundSub"></p>
    <div class="mb-5">
      <label class="text-sm font-medium text-gray-600 mb-3 block">환불할 횟수</label>
      <div class="flex items-center justify-between bg-gray-50 rounded-2xl p-2">
        <button onclick="changeRefundQty(-1)" class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-gray-600 active:bg-gray-100">−</button>
        <div class="text-center">
          <div class="text-3xl font-bold text-gray-800" id="refundQtyNum">1</div>
          <div class="text-xs text-gray-400">회</div>
        </div>
        <button onclick="changeRefundQty(1)" class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold text-green-600 active:bg-green-50">+</button>
      </div>
    </div>
    <div class="bg-green-50 rounded-2xl p-4 mb-5">
      <div class="flex justify-between items-center mb-1">
        <span class="text-sm text-gray-500">회당 환불금액</span>
        <span class="text-sm font-semibold text-gray-800" id="refundUnitLabel"></span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-500">예상 환불금액</span>
        <span class="text-xl font-bold text-green-600" id="refundTotalLabel"></span>
      </div>
    </div>
    <div class="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-2 text-xs text-amber-700">
      <p>• 카드 결제: 영업일 3~4일 후 취소</p>
      <p>• 계좌이체: 즉시 환불 (180일 이내)</p>
      <p>• 휴대폰 결제: 결제 당월만 가능</p>
    </div>
    <div id="refundReasonWrap" class="mb-5">
      <label class="text-sm font-medium text-gray-600 mb-2 block">환불 사유</label>
      <select id="refundReason" class="input">
        <option value="단순 변심">단순 변심</option>
        <option value="서비스 불만족">서비스 불만족</option>
        <option value="주유소 폐업/변경">주유소 폐업/변경</option>
        <option value="기타">기타</option>
      </select>
    </div>
    <div class="flex gap-3">
      <button onclick="closeModal('refundModal')" class="btn btn-gray" style="flex:1">취소</button>
      <button onclick="confirmRefund()" class="btn btn-danger" style="flex:1">환불 신청</button>
    </div>
  </div>
</div>

<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
<script>
const stationId=location.pathname.split('/').pop();
let scanner=null, currentPurchaseId=null, _refundData={};
window.addEventListener('DOMContentLoaded',()=>{ if(!requireAuth('customer'))return; loadDetail(); });
async function loadDetail() {
  try {
    const r=await API.get('/coupons/my/'+stationId);
    const s=r.station, purchases=r.purchases||[];
    document.getElementById('pageTitle').textContent=s?.station_name||'쿠폰';
    const totalUses=purchases.reduce((sum,p)=>sum+p.remaining_uses,0);
    document.getElementById('content').innerHTML=
      '<div class="card mb-4">'
      +'<h2 class="font-bold text-gray-800 text-base">'+s?.station_name+'</h2>'
      +'<p class="text-xs text-gray-400 mt-1">'+s?.address+'</p>'
      +'<div class="flex items-center justify-between mt-4">'
      +'<div><p class="text-xs text-gray-400 mb-1">사용 가능 횟수</p><p class="text-4xl font-bold text-green-600">'+totalUses+'<span class="text-lg ml-1">회</span></p></div>'
      +(totalUses>0?'<button onclick="openQR()" class="btn btn-primary" style="width:auto;padding:14px 22px"><i class="fas fa-qrcode mr-2"></i>QR 사용</button>':'<span class="badge badge-gray text-sm px-4 py-2">사용 완료</span>')
      +'</div></div>'
      +'<h3 class="section-title">구매 내역</h3>'
      +purchases.map(p=>'<div class="card mb-3 fade-in">'
        +'<div class="flex justify-between items-start mb-3">'
        +'<div><p class="font-semibold text-gray-800">'+p.coupon_title+'</p><p class="text-xs text-gray-400 mt-0.5">'+formatDate(p.created_at)+' 구매 · '+formatPrice(p.total_amount)+'</p></div>'
        +'<span class="badge '+(p.remaining_uses>0?'badge-green':'badge-gray')+' flex-shrink-0">'+p.remaining_uses+'회</span>'
        +'</div>'
        +(p.remaining_uses>0
          ?'<div class="flex gap-2">'
           +'<button onclick="currentPurchaseId='+p.id+';openQR()" class="btn btn-outline btn-sm" style="flex:1">QR 사용</button>'
           +'<button onclick="openRefundModal('+p.id+','+p.remaining_uses+','+p.total_amount+')" class="btn btn-danger btn-sm" style="flex:1">환불</button>'
           +'</div>'
          :'')
        +'</div>'
      ).join('');
  } catch { document.getElementById('content').innerHTML='<div class="card text-center py-10 text-red-400">불러올 수 없습니다</div>'; }
}
function openQR() {
  openModal('qrModal');
  scanner=new Html5Qrcode('reader');
  scanner.start({facingMode:'environment'},{fps:10,qrbox:{width:240,height:240}},async code=>{ await closeQR(); await useWithQR(code); }).catch(()=>showToast('카메라 접근이 필요합니다.','error'));
}
async function closeQR() {
  closeModal('qrModal');
  if(scanner){try{await scanner.stop();}catch{}scanner=null;}
}
async function useWithQR(qrCode) {
  try {
    const purchaseId=currentPurchaseId||await getFirstPurchaseId();
    if(!purchaseId)return showToast('사용 가능한 쿠폰이 없습니다.','error');
    const r=await API.post('/stations/'+stationId+'/use-coupon',{purchase_id:purchaseId,qr_code:qrCode});
    showToast(r.message+' (남은 횟수: '+r.remaining_uses+'회)');
    currentPurchaseId=null; setTimeout(loadDetail,1000);
  } catch(e){showToast(e.message||'사용 처리 실패','error');}
}
async function getFirstPurchaseId(){try{const r=await API.get('/coupons/my/'+stationId);return(r.purchases||[]).find(p=>p.remaining_uses>0)?.id||null;}catch{return null;}}
function openRefundModal(purchaseId, remaining, totalAmount) {
  const unitAmount = Math.floor(totalAmount / remaining);
  _refundData = { purchaseId, remaining, totalAmount, unitAmount, qty: remaining };
  document.getElementById('refundSub').textContent = '최대 '+remaining+'회 환불 가능';
  document.getElementById('refundQtyNum').textContent = remaining;
  document.getElementById('refundUnitLabel').textContent = formatPrice(unitAmount);
  document.getElementById('refundTotalLabel').textContent = formatPrice(unitAmount * remaining);
  openModal('refundModal');
}
function changeRefundQty(d) {
  _refundData.qty = Math.max(1, Math.min(_refundData.remaining, (_refundData.qty||1) + d));
  document.getElementById('refundQtyNum').textContent = _refundData.qty;
  document.getElementById('refundTotalLabel').textContent = formatPrice(_refundData.unitAmount * _refundData.qty);
}
async function confirmRefund() {
  const reason = document.getElementById('refundReason').value;
  showDialog({
    icon: '💸',
    title: '환불 신청',
    msg: _refundData.qty+'회 환불 신청하시겠습니까?\n예상 환불금액: '+formatPrice(_refundData.unitAmount*_refundData.qty),
    confirmText: '신청',
    confirmClass: 'btn-danger',
    onConfirm: async () => {
      try {
        const r=await API.post('/coupons/refund/'+_refundData.purchaseId,{quantity:_refundData.qty,reason});
        closeModal('refundModal');
        showToast(r.message||'환불 신청이 완료되었습니다.');
        setTimeout(loadDetail,1000);
      } catch(e){showToast(e.message||'환불 실패','error');}
    }
  });
}
</script>
`)
}

export function myPage(): string {
  return htmlPage('마이페이지', `
<div class="min-h-screen pb-24">
  <div class="ev-bg text-white px-5 pb-8" style="padding-top:max(48px,env(safe-area-inset-top))">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center"><i class="fas fa-user text-2xl"></i></div>
      <div><p class="font-bold text-xl" id="myName">-</p><p class="text-sm opacity-75" id="myEmail">-</p></div>
    </div>
  </div>
  <div class="p-4 space-y-3 -mt-2">
    <div class="card">
      <h3 class="font-semibold text-gray-400 text-xs mb-3 uppercase tracking-wide">계정</h3>
      <a href="/my-coupons" class="flex items-center justify-between py-3.5 border-b border-gray-50">
        <span class="text-gray-700 text-base"><i class="fas fa-ticket-alt text-green-400 w-6 mr-2"></i>내 쿠폰</span>
        <i class="fas fa-chevron-right text-gray-300 text-sm"></i>
      </a>
      <button onclick="showProfileEditModal()" class="w-full flex items-center justify-between py-3.5 border-b border-gray-50">
        <span class="text-gray-700 text-base"><i class="fas fa-user-edit text-green-400 w-6 mr-2"></i>프로필 수정</span>
        <i class="fas fa-chevron-right text-gray-300 text-sm"></i>
      </button>
      <div id="pwSection">
        <button onclick="showPwChangeModal()" class="w-full flex items-center justify-between py-3.5">
          <span class="text-gray-700 text-base"><i class="fas fa-lock text-green-400 w-6 mr-2"></i>비밀번호 변경</span>
          <i class="fas fa-chevron-right text-gray-300 text-sm"></i>
        </button>
      </div>
    </div>
    <div class="card">
      <h3 class="font-semibold text-gray-400 text-xs mb-3 uppercase tracking-wide">고객센터</h3>
      <a href="mailto:bensmee96@gmail.com" class="flex items-center justify-between py-3.5">
        <span class="text-gray-700 text-base"><i class="fas fa-envelope text-green-400 w-6 mr-2"></i>이메일 문의</span>
        <span class="text-xs text-gray-400">bensmee96@gmail.com</span>
      </a>
    </div>
    <div class="card">
      <h3 class="font-semibold text-gray-400 text-xs mb-3 uppercase tracking-wide">약관</h3>
      <a href="/terms" class="flex items-center justify-between py-3.5 border-b border-gray-50">
        <span class="text-gray-700 text-base"><i class="fas fa-file-alt text-green-400 w-6 mr-2"></i>서비스 이용약관</span>
        <i class="fas fa-chevron-right text-gray-300 text-sm"></i>
      </a>
      <a href="/privacy" class="flex items-center justify-between py-3.5">
        <span class="text-gray-700 text-base"><i class="fas fa-shield-alt text-green-400 w-6 mr-2"></i>개인정보처리방침</span>
        <i class="fas fa-chevron-right text-gray-300 text-sm"></i>
      </a>
    </div>
    <button onclick="doLogout()" class="btn btn-gray mt-2" style="color:#94a3b8;border-color:#e2e8f0">로그아웃</button>
  </div>
</div>
<nav class="bottom-nav">
  <a href="/home"><i class="fas fa-home"></i>홈</a>
  <a href="/stations"><i class="fas fa-gas-pump"></i>주유소</a>
  <a href="/my-coupons"><i class="fas fa-ticket-alt"></i>내 쿠폰</a>
  <a href="/mypage" class="active"><i class="fas fa-user"></i>마이</a>
</nav>

<!-- 프로필 수정 모달 -->
<div id="profileModal" class="modal-bg hidden">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-handle"></div>
    <div class="modal-title">프로필 수정</div>
    <div class="space-y-3 mb-5">
      <div>
        <label class="text-xs text-gray-500 mb-1.5 block">이름</label>
        <input id="editName" type="text" class="input" placeholder="이름">
      </div>
      <div>
        <label class="text-xs text-gray-500 mb-1.5 block">전화번호</label>
        <input id="editPhone" type="tel" class="input" placeholder="전화번호">
      </div>
    </div>
    <div class="flex gap-3">
      <button onclick="closeModal('profileModal')" class="btn btn-gray" style="flex:1">취소</button>
      <button onclick="saveProfile()" class="btn btn-primary" style="flex:1">저장</button>
    </div>
  </div>
</div>

<!-- 비밀번호 변경 모달 -->
<div id="pwModal" class="modal-bg hidden">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-handle"></div>
    <div class="modal-title">비밀번호 변경</div>
    <div class="space-y-3 mb-5">
      <input id="curPw" type="password" class="input" placeholder="현재 비밀번호" autocomplete="current-password">
      <input id="newPw" type="password" class="input" placeholder="새 비밀번호 (8자 이상)" minlength="8" autocomplete="new-password">
      <input id="newPw2" type="password" class="input" placeholder="새 비밀번호 확인" autocomplete="new-password">
    </div>
    <div class="flex gap-3">
      <button onclick="closeModal('pwModal')" class="btn btn-gray" style="flex:1">취소</button>
      <button onclick="savePw()" class="btn btn-primary" style="flex:1">변경</button>
    </div>
  </div>
</div>

<script>
let _myInfo = {};
window.addEventListener('DOMContentLoaded', async () => {
  const u = requireAuth('customer'); if(!u)return;
  try {
    const r = await API.get('/user/me');
    _myInfo = r.user;
    document.getElementById('myName').textContent = _myInfo.name;
    document.getElementById('myEmail').textContent = _myInfo.email || _myInfo.social_provider || '-';
    if (_myInfo.social_provider) document.getElementById('pwSection').style.display = 'none';
  } catch {}
});
function showProfileEditModal() {
  document.getElementById('editName').value = _myInfo.name || '';
  document.getElementById('editPhone').value = _myInfo.phone || '';
  openModal('profileModal');
}
async function saveProfile() {
  const name = document.getElementById('editName').value.trim();
  const phone = document.getElementById('editPhone').value.trim();
  if (!name) return showToast('이름을 입력해주세요.', 'error');
  try {
    await API.patch('/user/me', { name, phone: phone || null });
    _myInfo.name = name; _myInfo.phone = phone;
    document.getElementById('myName').textContent = name;
    closeModal('profileModal');
    showToast('프로필이 수정되었습니다.');
  } catch(e) { showToast(e.message || '수정 실패', 'error'); }
}
function showPwChangeModal() {
  document.getElementById('curPw').value = '';
  document.getElementById('newPw').value = '';
  document.getElementById('newPw2').value = '';
  openModal('pwModal');
}
async function savePw() {
  const cur = document.getElementById('curPw').value;
  const nw = document.getElementById('newPw').value;
  const nw2 = document.getElementById('newPw2').value;
  if (!cur) return showToast('현재 비밀번호를 입력해주세요.', 'error');
  if (nw.length < 8) return showToast('새 비밀번호는 8자 이상이어야 합니다.', 'error');
  if (nw !== nw2) return showToast('새 비밀번호가 일치하지 않습니다.', 'error');
  try {
    await API.post('/user/change-password', { current_password: cur, new_password: nw });
    closeModal('pwModal');
    showToast('비밀번호가 변경되었습니다.');
  } catch(e) { showToast(e.message || '변경 실패', 'error'); }
}
function doLogout() {
  showDialog({
    icon: '👋',
    title: '로그아웃',
    msg: '로그아웃 하시겠습니까?',
    confirmText: '로그아웃',
    confirmClass: 'btn-danger',
    onConfirm: logout
  });
}
</script>
`)
}

export function paymentSuccessPage(): string {
  return htmlPage('결제 완료', `
<div class="min-h-screen flex flex-col items-center justify-center px-5 text-center">
  <div id="content"><i class="fas fa-spinner fa-spin text-green-400 text-4xl"></i><p class="mt-4 text-gray-500">결제 처리 중...</p></div>
</div>
<script>
window.addEventListener('DOMContentLoaded',()=>{
  const p=new URLSearchParams(location.search);
  if(p.get('done')){
    document.getElementById('content').innerHTML='<div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"><i class="fas fa-check text-green-500 text-3xl"></i></div><h2 class="text-2xl font-bold text-gray-800 mb-2">결제 완료!</h2><p class="text-gray-400 mb-8">쿠폰이 발급되었습니다</p><a href="/my-coupons" class="btn btn-primary" style="width:auto;display:inline-block;padding:14px 36px">내 쿠폰 보기</a>';
  } else {
    const orderId=p.get('orderId'),paymentKey=p.get('paymentKey'),amount=p.get('amount');
    if(orderId&&paymentKey&&amount) window.location.href='/api/coupons/payment/success?orderId='+orderId+'&paymentKey='+paymentKey+'&amount='+amount;
  }
});
</script>
`)
}

export function paymentFailPage(): string {
  return htmlPage('결제 실패', `
<div class="min-h-screen flex flex-col items-center justify-center px-5 text-center">
  <div class="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5"><i class="fas fa-times text-red-400 text-3xl"></i></div>
  <h2 class="text-xl font-bold text-gray-800 mb-2">결제 실패</h2>
  <p id="reason" class="text-gray-400 mb-8">결제가 취소되었거나 오류가 발생했습니다.</p>
  <button onclick="history.back()" class="btn btn-outline" style="width:auto;display:inline-block;padding:14px 36px">돌아가기</button>
</div>
<script>const p=new URLSearchParams(location.search);const reason=p.get('reason');if(reason)document.getElementById('reason').textContent='사유: '+reason;</script>
`)
}
