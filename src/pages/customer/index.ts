// 고객 페이지들 - EV-Wash
import { htmlPage } from '../layout'

export function loginPage(): string {
  return htmlPage('로그인', `
<div class="min-h-screen px-5 py-10 flex flex-col">
  <div class="text-center mb-8">
    <div class="text-5xl mb-3">⚡</div>
    <h1 class="text-2xl font-bold text-gray-800">EV-Wash</h1>
    <p class="text-gray-400 text-sm mt-1">전국 EV 세차 쿠폰 서비스</p>
  </div>
  <form onsubmit="doLogin(event)" class="space-y-4">
    <input id="email" type="email" placeholder="이메일" class="input" required>
    <input id="pw" type="password" placeholder="비밀번호" class="input" required>
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
  const redirect = encodeURIComponent(location.origin + '/api/auth/' + provider + '/callback');
  const url = provider === 'kakao'
    ? 'https://kauth.kakao.com/oauth/authorize?client_id=KAKAO_PLACEHOLDER&redirect_uri=' + redirect + '&response_type=code'
    : 'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=NAVER_PLACEHOLDER&redirect_uri=' + redirect + '&state=' + Math.random().toString(36).slice(2);
  window.open(url, 'social_login', 'width=520,height=620');
  window.addEventListener('message', e => { if (e.data?.type === 'social_login') { setUser(e.data.token, e.data.user); window.location.href = e.data.user.userType === 'station_owner' ? '/owner' : '/home'; } }, { once: true });
}
</script>
`)
}

export function registerPage(): string {
  return htmlPage('회원가입', `
<div class="min-h-screen px-5 py-8">
  <a href="/login" class="text-gray-400 text-sm flex items-center gap-2 mb-6"><i class="fas fa-arrow-left"></i>뒤로</a>
  <h1 class="text-2xl font-bold text-gray-800 mb-6">회원가입</h1>
  <form onsubmit="doRegister(event)" class="space-y-4">
    <div><label class="text-xs text-gray-500 mb-1 block">회원 유형</label>
      <select id="userType" class="input"><option value="customer">일반 고객</option><option value="station_owner">주유소 사장님</option></select></div>
    <input id="name" type="text" placeholder="이름" class="input" required>
    <input id="email" type="email" placeholder="이메일" class="input" required>
    <input id="phone" type="tel" placeholder="휴대폰 번호 (선택)" class="input">
    <input id="pw" type="password" placeholder="비밀번호 (8자 이상)" class="input" required minlength="8">
    <input id="pw2" type="password" placeholder="비밀번호 확인" class="input" required>
    <button type="submit" class="btn btn-primary">가입하기</button>
  </form>
  <p class="text-center text-sm text-gray-400 mt-4">이미 계정이 있으신가요? <a href="/login" class="ev-green font-semibold">로그인</a></p>
</div>
<script>
async function doRegister(e) {
  e.preventDefault();
  if (document.getElementById('pw').value !== document.getElementById('pw2').value) return showToast('비밀번호가 일치하지 않습니다.', 'error');
  try {
    const r = await API.post('/auth/register', { name: document.getElementById('name').value, email: document.getElementById('email').value, phone: document.getElementById('phone').value || undefined, password: document.getElementById('pw').value, userType: document.getElementById('userType').value });
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
<div class="min-h-screen pb-20">
  <div class="ev-bg text-white px-5 pt-12 pb-6">
    <div class="flex items-center justify-between mb-5">
      <div><p class="text-sm opacity-75" id="greeting">안녕하세요</p><h1 class="text-2xl font-bold" id="userName">EV-Wash</h1></div>
      <a href="/mypage" class="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center"><i class="fas fa-user text-white"></i></a>
    </div>
    <div class="relative">
      <input id="searchInput" type="search" placeholder="주유소명 또는 지역 검색" class="w-full px-4 py-3 pl-11 rounded-xl text-gray-800 text-sm outline-none" onkeydown="if(event.key==='Enter')doSearch()">
      <i class="fas fa-search absolute left-4 top-3.5 text-gray-400 text-sm"></i>
      <button onclick="doSearch()" class="absolute right-3 top-2 bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg">검색</button>
    </div>
  </div>
  <div id="couponSummary" class="hidden px-4 pt-4">
    <a href="/my-coupons" class="card flex items-center justify-between fade-in">
      <div><p class="text-xs text-gray-400">보유 쿠폰</p><p class="text-xl font-bold text-gray-800"><span id="couponCount">-</span>매 사용 가능</p></div>
      <div class="flex items-center gap-2 text-green-500"><i class="fas fa-ticket-alt text-2xl"></i><i class="fas fa-chevron-right text-gray-300"></i></div>
    </a>
  </div>
  <div class="px-4 pt-4">
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-bold text-gray-800">주변 주유소</h2>
      <button onclick="getLocation()" class="text-xs text-green-600 flex items-center gap-1.5"><i class="fas fa-location-dot"></i>현재 위치</button>
    </div>
    <div id="stationList">
      <div class="card text-center py-10 text-gray-400">
        <i class="fas fa-map-marker-alt text-3xl mb-3 text-green-200"></i>
        <p class="text-sm">위치 검색 또는 키워드 검색으로<br>주유소를 찾아보세요</p>
        <button onclick="getLocation()" class="mt-4 btn btn-outline btn-sm" style="width:auto;padding:8px 20px"><i class="fas fa-location-dot mr-1"></i>내 주변 찾기</button>
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
  navigator.geolocation.getCurrentPosition(p => loadStations('latitude='+p.coords.latitude+'&longitude='+p.coords.longitude), () => showToast('위치 권한 필요', 'warn'));
}
function renderStations(list) {
  const el = document.getElementById('stationList');
  if (!list.length) { el.innerHTML = '<div class="card text-center py-8 text-gray-400"><i class="fas fa-search text-2xl mb-2"></i><p class="text-sm">검색 결과가 없습니다</p></div>'; return; }
  el.innerHTML = list.map(s=>'<a href="/stations/'+s.id+'" class="card block mb-3 fade-in"><div class="flex items-start justify-between"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><h3 class="font-semibold text-gray-800 truncate">'+s.station_name+'</h3><span class="badge badge-green flex-shrink-0">'+(s.coupon_count||0)+'종</span></div><p class="text-xs text-gray-400 truncate">'+s.address+'</p>'+(s.distance!=null?'<p class="text-xs text-gray-300 mt-0.5">'+s.distance.toFixed(1)+'km</p>':'')+'</div><i class="fas fa-chevron-right text-gray-200 ml-3 mt-1"></i></div></a>').join('');
}
</script>
`)
}

export function stationListPage(): string {
  return htmlPage('주유소 찾기', `
<div class="min-h-screen pb-20">
  <div class="bg-white sticky top-0 z-50 px-4 py-3 border-b border-gray-100">
    <div class="relative"><input id="si" type="search" placeholder="주유소명 또는 지역으로 검색" class="input pl-10" style="background:#f8fafc" oninput="debounce()" onkeydown="if(event.key==='Enter')doSearch()"><i class="fas fa-search absolute left-3 top-3.5 text-gray-400 text-sm"></i></div>
    <button onclick="getLocation()" class="mt-2 w-full text-sm text-green-600 flex items-center justify-center gap-1.5 py-1"><i class="fas fa-location-dot"></i>현재 위치로 찾기</button>
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
function getLocation() { navigator.geolocation?.getCurrentPosition(p=>loadStations('latitude='+p.coords.latitude+'&longitude='+p.coords.longitude),()=>showToast('위치 권한 필요','warn')); }
async function loadStations(q='') {
  try { const r=await API.get('/stations/nearby'+(q?'?'+q:'')); const list=r.stations||[];
  const el=document.getElementById('list');
  el.innerHTML=list.length?list.map(s=>'<a href="/stations/'+s.id+'" class="card block fade-in"><div class="flex items-center justify-between"><div class="flex-1 min-w-0"><h3 class="font-semibold text-gray-800 truncate">'+s.station_name+'</h3><p class="text-xs text-gray-400 truncate mt-0.5">'+s.address+'</p><div class="flex items-center gap-2 mt-1.5"><span class="badge badge-green">쿠폰 '+(s.coupon_count||0)+'종</span>'+(s.distance!=null?'<span class="text-xs text-gray-300">'+s.distance.toFixed(1)+'km</span>':'')+'</div></div><i class="fas fa-chevron-right text-gray-200 ml-3"></i></div></a>').join(''):'<div class="card text-center py-10 text-gray-400">검색 결과가 없습니다</div>'; } catch {}
}
window.addEventListener('DOMContentLoaded',()=>loadStations());
</script>
`)
}

export function stationDetailPage(): string {
  return htmlPage('주유소 상세', `
<div class="min-h-screen pb-8">
  <div class="page-header">
    <button onclick="history.back()" class="text-gray-500 w-8"><i class="fas fa-arrow-left"></i></button>
    <h1 id="pageTitle" class="font-bold text-gray-800">주유소</h1>
  </div>
  <div id="content" class="p-4 space-y-4">
    <div class="card text-center py-12"><i class="fas fa-spinner fa-spin text-green-400 text-2xl"></i></div>
  </div>
</div>
<script>
const stationId = location.pathname.split('/').pop();
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const [sr,cr] = await Promise.all([API.get('/stations/'+stationId+'/info'), API.get('/stations/'+stationId+'/coupons')]);
    const s=sr.station, coupons=cr.coupons||[];
    document.getElementById('pageTitle').textContent = s.station_name;
    document.getElementById('content').innerHTML =
      '<div class="card"><h2 class="text-lg font-bold text-gray-800">'+s.station_name+'</h2><p class="text-sm text-gray-500 mt-1"><i class="fas fa-map-marker-alt text-green-400 mr-1"></i>'+s.address+(s.address_detail?' '+s.address_detail:'')+'</p>'+(s.phone?'<p class="text-sm text-gray-500 mt-1"><i class="fas fa-phone text-green-400 mr-1"></i>'+s.phone+'</p>':'')+'<div class="mt-3"><span class="badge badge-green">'+(s.car_wash_type==='automatic'?'🚗 자동세차':s.car_wash_type==='self'?'💧 셀프세차':'🚗 자동+셀프')+'</span></div></div>'
      +'<h3 class="font-bold text-gray-800">판매 쿠폰</h3>'
      +(coupons.length?coupons.map(c=>'<div class="card fade-in"><div class="flex justify-between items-start mb-2"><div><h4 class="font-semibold text-gray-800">'+c.title+'</h4>'+(c.description?'<p class="text-xs text-gray-400 mt-0.5">'+c.description+'</p>':'')+'</div><span class="badge badge-red ml-2 flex-shrink-0">'+Math.round((1-c.discount_price/c.original_price)*100)+'%</span></div><div class="flex items-baseline gap-2 mb-3"><span class="text-xl font-bold text-green-600">'+formatPrice(c.discount_price)+'</span><span class="text-sm text-gray-300 line-through">'+formatPrice(c.original_price)+'</span></div><p class="text-xs text-gray-400 mb-1">'+c.wash_count+'회 이용권 · 유효기간 없음</p><p class="text-xs text-gray-300 mb-3"><i class="fas fa-undo mr-1"></i>미사용 횟수 환불 가능 (결제수단에 따라 3~4일 소요)</p><button onclick="buyCoupon('+c.id+','+c.discount_price+',\''+c.title.replace(/'/g,'')+'\','+c.wash_count+')" class="btn btn-primary">구매하기</button></div>').join('')
      :'<div class="card text-center py-8 text-gray-400">판매 중인 쿠폰이 없습니다</div>');
  } catch { document.getElementById('content').innerHTML='<div class="card text-center py-10 text-red-400">정보를 불러올 수 없습니다</div>'; }
});
async function buyCoupon(couponId, price, title, washCount) {
  if (!getUser()) return window.location.href = '/login';
  const qty = parseInt(prompt('구매 수량을 입력하세요\n(1매 = ' + formatPrice(price) + ', ' + (washCount||1) + '회 이용권)', '1'));
  if (!qty || qty < 1 || isNaN(qty)) return;
  try {
    const r = await API.post('/coupons/buy', { couponId, quantity: qty });
    if (!r.clientKey || r.clientKey === 'test_ck_placeholder') { showToast('결제 키 미설정 (테스트 모드)', 'warn'); return; }
    // 결제 전 환불 정책 고지
    const policy = r.refundPolicy;
    const ok = confirm(
      '■ 결제 전 환불 정책 안내\n\n'
      + '✅ ' + (policy?.summary || '미사용 쿠폰은 언제든 환불 가능합니다.') + '\n\n'
      + '💳 카드 결제: 부분취소 시 영업일 3~4일 소요\n'
      + '🏦 계좌이체: 180일 이내 취소 가능, 즉시 환불\n'
      + '📱 휴대폰: 결제 당월에만 취소 가능\n\n'
      + '위 내용을 확인하였으며 결제를 진행하시겠습니까?'
    );
    if (!ok) return;
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
<div class="min-h-screen pb-20">
  <div class="page-header"><h1 class="font-bold text-gray-800 text-lg">내 쿠폰</h1></div>
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
    if (!stations.length) { el.innerHTML='<div class="card text-center py-12 text-gray-400"><i class="fas fa-ticket-alt text-4xl mb-3 text-gray-200"></i><p>보유한 쿠폰이 없습니다</p><a href="/stations" class="btn btn-primary mt-4" style="width:auto;padding:10px 24px">주유소 찾기</a></div>'; return; }
    el.innerHTML=stations.map(st=>'<a href="/my-coupons/'+st.station_id+'" class="card block mb-3 fade-in"><div class="flex items-center justify-between"><div><h3 class="font-semibold text-gray-800">'+st.station_name+'</h3><p class="text-xs text-gray-400 mt-0.5">'+st.address+'</p></div><div class="text-right ml-3"><p class="text-xl font-bold text-green-600">'+st.remaining_quantity+'</p><p class="text-xs text-gray-400">회 남음</p></div></div></a>').join('');
  } catch { document.getElementById('content').innerHTML='<div class="card text-center py-10 text-red-400">불러올 수 없습니다</div>'; }
});
</script>
`)
}

export function myCouponDetailPage(): string {
  return htmlPage('쿠폰 상세', `
<div class="min-h-screen pb-8">
  <div class="page-header">
    <button onclick="history.back()" class="text-gray-500 w-8"><i class="fas fa-arrow-left"></i></button>
    <h1 id="pageTitle" class="font-bold text-gray-800">쿠폰 사용</h1>
  </div>
  <div id="content" class="p-4"><div class="card text-center py-12"><i class="fas fa-spinner fa-spin text-green-400 text-2xl"></i></div></div>
</div>
<div id="qrModal" class="modal-bg hidden" onclick="closeQR()">
  <div class="modal" onclick="event.stopPropagation()">
    <h3 class="font-bold text-gray-800 mb-4 text-center">주유소 QR 코드 스캔</h3>
    <div id="reader" style="width:100%;border-radius:12px;overflow:hidden;"></div>
    <button onclick="closeQR()" class="btn btn-outline mt-4">취소</button>
  </div>
</div>
<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
<script>
const stationId=location.pathname.split('/').pop();
let scanner=null, currentPurchaseId=null;
window.addEventListener('DOMContentLoaded',()=>{ if(!requireAuth('customer'))return; loadDetail(); });
async function loadDetail() {
  try {
    const r=await API.get('/coupons/my/'+stationId);
    const s=r.station, purchases=r.purchases||[];
    document.getElementById('pageTitle').textContent=s?.station_name||'쿠폰';
    const totalUses=purchases.reduce((sum,p)=>sum+p.remaining_uses,0);
    document.getElementById('content').innerHTML=
      '<div class="card mb-4"><h2 class="font-bold text-gray-800">'+s?.station_name+'</h2><p class="text-xs text-gray-400 mt-1">'+s?.address+'</p>'
      +'<div class="flex items-center justify-between mt-3"><div><p class="text-xs text-gray-400">사용 가능 횟수</p><p class="text-3xl font-bold text-green-600">'+totalUses+'회</p></div>'
      +(totalUses>0?'<button onclick="openQR()" class="btn btn-primary" style="width:auto;padding:12px 24px"><i class="fas fa-qrcode mr-2"></i>QR 스캔하여 사용</button>':'<span class="badge badge-gray">사용 완료</span>')
      +'</div></div>'
      +'<h3 class="section-title">구매 내역</h3>'
      +purchases.map(p=>'<div class="card mb-3"><div class="flex justify-between items-start"><div><p class="font-medium text-gray-800">'+p.coupon_title+'</p><p class="text-xs text-gray-400 mt-1">'+formatDate(p.created_at)+' 구매 · '+formatPrice(p.total_amount)+'</p></div><span class="badge '+(p.remaining_uses>0?'badge-green':'badge-gray')+'">'+p.remaining_uses+'회 남음</span></div>'+(p.remaining_uses>0?'<button onclick="currentPurchaseId='+p.id+';openQR()" class="btn btn-outline btn-sm mt-3">이 쿠폰 사용</button>':'')+(p.remaining_uses>0?'<button onclick="requestRefund('+p.id+','+p.remaining_uses+')" class="btn btn-danger btn-sm mt-2">환불 요청</button>':'')+'</div>').join('');
  } catch { document.getElementById('content').innerHTML='<div class="card text-center py-10 text-red-400">불러올 수 없습니다</div>'; }
}
function openQR() {
  document.getElementById('qrModal').classList.remove('hidden');
  scanner=new Html5Qrcode('reader');
  scanner.start({facingMode:'environment'},{fps:10,qrbox:{width:250,height:250}},async code=>{ await closeQR(); await useWithQR(code); }).catch(()=>showToast('카메라 접근이 필요합니다.','error'));
}
async function closeQR() {
  document.getElementById('qrModal').classList.add('hidden');
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
async function requestRefund(purchaseId,remaining){
  const qty=parseInt(prompt('환불할 횟수를 입력하세요 (최대 '+remaining+'회)',String(remaining)));
  if(!qty||qty<1||qty>remaining)return;
  if(!confirm(qty+'회 환불을 요청하시겠습니까?'))return;
  try{const r=await API.post('/coupons/refund/'+purchaseId,{quantity:qty});showToast(r.message);setTimeout(loadDetail,1000);}catch(e){showToast(e.message||'환불 실패','error');}
}
</script>
`)
}

export function myPage(): string {
  return htmlPage('마이페이지', `
<div class="min-h-screen pb-20">
  <div class="ev-bg text-white px-5 pt-12 pb-8">
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-full bg-white bg-opacity-20 flex items-center justify-center"><i class="fas fa-user text-2xl"></i></div>
      <div><p class="font-bold text-lg" id="myName">-</p><p class="text-sm opacity-75" id="myEmail">-</p></div>
    </div>
  </div>
  <div class="p-4 space-y-3">
    <div class="card">
      <h3 class="font-semibold text-gray-600 text-xs mb-3">계정</h3>
      <a href="/my-coupons" class="flex items-center justify-between py-3 border-b border-gray-50"><span class="text-gray-700"><i class="fas fa-ticket-alt text-green-400 w-5 mr-2"></i>내 쿠폰</span><i class="fas fa-chevron-right text-gray-300 text-sm"></i></a>
      <button onclick="showProfileEdit()" class="w-full flex items-center justify-between py-3 border-b border-gray-50"><span class="text-gray-700"><i class="fas fa-user-edit text-green-400 w-5 mr-2"></i>프로필 수정</span><i class="fas fa-chevron-right text-gray-300 text-sm"></i></button>
      <div id="pwSection"><button onclick="showPwChange()" class="w-full flex items-center justify-between py-3"><span class="text-gray-700"><i class="fas fa-lock text-green-400 w-5 mr-2"></i>비밀번호 변경</span><i class="fas fa-chevron-right text-gray-300 text-sm"></i></button></div>
    </div>
    <div class="card">
      <h3 class="font-semibold text-gray-600 text-xs mb-3">고객센터</h3>
      <a href="mailto:bensmee96@gmail.com" class="flex items-center justify-between py-3"><span class="text-gray-700"><i class="fas fa-envelope text-green-400 w-5 mr-2"></i>이메일 문의</span><span class="text-xs text-gray-400">bensmee96@gmail.com</span></a>
    </div>
    <button onclick="if(confirm('로그아웃 하시겠습니까?'))logout()" class="btn btn-outline" style="color:#94a3b8;border-color:#e2e8f0">로그아웃</button>
  </div>
</div>
<nav class="bottom-nav">
  <a href="/home"><i class="fas fa-home"></i>홈</a>
  <a href="/stations"><i class="fas fa-gas-pump"></i>주유소</a>
  <a href="/my-coupons"><i class="fas fa-ticket-alt"></i>내 쿠폰</a>
  <a href="/mypage" class="active"><i class="fas fa-user"></i>마이</a>
</nav>
<script>
window.addEventListener('DOMContentLoaded',async()=>{
  const u=requireAuth('customer'); if(!u)return;
  try{const r=await API.get('/user/me'); const me=r.user; document.getElementById('myName').textContent=me.name; document.getElementById('myEmail').textContent=me.email||me.social_provider||'-'; if(me.social_provider)document.getElementById('pwSection').style.display='none';}catch{}
});
function showProfileEdit(){const name=prompt('변경할 이름');if(!name)return;API.patch('/user/me',{name}).then(()=>{showToast('수정되었습니다');location.reload();}).catch(e=>showToast(e.message,'error'));}
function showPwChange(){const cur=prompt('현재 비밀번호');if(!cur)return;const nw=prompt('새 비밀번호 (8자 이상)');if(!nw||nw.length<8)return showToast('8자 이상 입력하세요','warn');API.post('/user/change-password',{current_password:cur,new_password:nw}).then(()=>showToast('비밀번호가 변경되었습니다')).catch(e=>showToast(e.message,'error'));}
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
    document.getElementById('content').innerHTML='<div class="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><i class="fas fa-check text-green-500 text-3xl"></i></div><h2 class="text-xl font-bold text-gray-800 mb-2">결제 완료!</h2><p class="text-gray-400 mb-8">쿠폰이 발급되었습니다</p><a href="/my-coupons" class="btn btn-primary" style="width:auto;padding:12px 32px">내 쿠폰 보기</a>';
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
  <div class="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><i class="fas fa-times text-red-400 text-3xl"></i></div>
  <h2 class="text-xl font-bold text-gray-800 mb-2">결제 실패</h2>
  <p id="reason" class="text-gray-400 mb-8">결제가 취소되었거나 오류가 발생했습니다.</p>
  <a href="javascript:history.back()" class="btn btn-outline" style="width:auto;padding:12px 32px">돌아가기</a>
</div>
<script>const p=new URLSearchParams(location.search);const reason=p.get('reason');if(reason)document.getElementById('reason').textContent='사유: '+reason;</script>
`)
}
