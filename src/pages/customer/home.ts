// 고객 홈, 주유소 목록, 주유소 상세 페이지
import { htmlPage } from '../layout'

export function customerHomePage(): string {
  return htmlPage('홈', `
<div class="min-h-screen pb-24">
  <!-- 헤더 배너 -->
  <div class="ev-bg text-white px-5 pb-7" style="padding-top:max(48px,env(safe-area-inset-top))">
    <div class="flex items-center justify-between mb-5">
      <div>
        <p class="text-sm opacity-60 mb-0.5" id="greeting">안녕하세요</p>
        <h1 class="text-2xl font-bold" id="userName">EV-Wash</h1>
      </div>
      <a href="/mypage" class="w-11 h-11 rounded-full flex items-center justify-center" style="background:rgba(255,255,255,.15)">
        <i class="fas fa-user text-white text-lg"></i>
      </a>
    </div>
    <!-- 검색 -->
    <div class="relative">
      <input id="searchInput" type="search" placeholder="주유소명 또는 지역 검색"
        class="w-full px-4 py-3.5 pl-11 rounded-2xl text-sm outline-none"
        style="background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.2);-webkit-appearance:none"
        onkeydown="if(event.key==='Enter')doSearch()">
      <i class="fas fa-search absolute left-4 top-4 text-sm" style="color:rgba(255,255,255,.5)"></i>
      <button onclick="doSearch()" class="absolute right-2.5 top-2 text-xs px-3 py-2 rounded-xl font-semibold"
        style="background:#84cc16;color:#0a1628">검색</button>
    </div>
  </div>

  <!-- 쿠폰 요약 -->
  <div id="couponSummary" class="hidden px-4 -mt-3">
    <a href="/my-coupons" class="card block fade-in" style="border-left:4px solid #84cc16">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs mb-0.5" style="color:#8e9ab4">보유 쿠폰</p>
          <p class="text-xl font-bold" style="color:#1a202c"><span id="couponCount">-</span>회 사용 가능</p>
        </div>
        <div class="flex items-center gap-2">
          <i class="fas fa-ticket-alt text-2xl" style="color:#84cc16"></i>
          <i class="fas fa-chevron-right text-sm" style="color:#dde3ef"></i>
        </div>
      </div>
    </a>
  </div>

  <!-- 주유소 목록 -->
  <div class="px-4 pt-4">
    <div class="flex items-center justify-between mb-3">
      <h2 class="font-bold" style="color:#1a202c">주변 주유소</h2>
      <button onclick="getLocation()" class="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium"
        style="color:#1a2f5e;background:#f0ffd4">
        <i class="fas fa-location-dot" style="color:#84cc16"></i>내 위치
      </button>
    </div>
    <div id="stationList">
      <div class="card text-center py-12" style="color:#8e9ab4">
        <i class="fas fa-map-marker-alt text-4xl mb-3" style="color:#bef264"></i>
        <p class="text-sm">위치 검색 또는 키워드로<br>주유소를 찾아보세요</p>
        <button onclick="getLocation()" class="mt-4 btn btn-outline btn-sm" style="width:auto;padding:10px 24px">
          <i class="fas fa-location-dot mr-1"></i>내 주변 찾기
        </button>
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

<style>
.bottom-nav a.active { color: #65a30d !important; }
.bottom-nav a.active i { filter: none; }
</style>

<script>
window.addEventListener('DOMContentLoaded', async () => {
  const u = getUser();
  if (u) {
    document.getElementById('greeting').textContent = '안녕하세요!';
    document.getElementById('userName').textContent = u.name + '님';
    document.getElementById('couponSummary').classList.remove('hidden');
    try {
      const me = await API.get('/user/me');
      if (me.user?.name) {
        document.getElementById('userName').textContent = me.user.name + '님';
        const stored = getUser();
        if (stored) { stored.name = me.user.name; setUser(localStorage.getItem('ev_token'), stored); }
      }
    } catch {}
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
  if (!list.length) { el.innerHTML = '<div class="card text-center py-10" style="color:#8e9ab4"><i class="fas fa-search text-2xl mb-2"></i><p class="text-sm">검색 결과가 없습니다</p></div>'; return; }
  el.innerHTML = list.map(s=>'<a href="/stations/'+s.id+'" class="card block mb-3 fade-in" style="border:1px solid #eef1f7"><div class="flex items-start justify-between"><div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><h3 class="font-semibold truncate" style="color:#1a202c">'+s.station_name+'</h3><span class="badge badge-green flex-shrink-0">'+(s.coupon_count||0)+'종</span></div><p class="text-xs truncate" style="color:#8e9ab4">'+s.address+'</p>'+(s.distance!=null?'<p class="text-xs mt-0.5" style="color:#bef264">'+s.distance.toFixed(1)+'km</p>':'')+'</div><i class="fas fa-chevron-right ml-3 mt-1" style="color:#dde3ef"></i></div></a>').join('');
}
</script>
`)
}

export function stationListPage(): string {
  return htmlPage('주유소 찾기', `
<div class="min-h-screen pb-24">
  <div class="bg-white sticky top-0 z-50 px-4 pt-3 pb-2 border-b" style="border-color:#eef1f7;padding-top:max(12px,env(safe-area-inset-top))">
    <div class="relative">
      <input id="si" type="search" placeholder="주유소명 또는 지역으로 검색" class="input pl-11"
        style="background:#f4f7fb;font-size:16px" oninput="debounce()" onkeydown="if(event.key==='Enter')doSearch()">
      <i class="fas fa-search absolute left-4 top-4 text-sm" style="color:#8e9ab4"></i>
    </div>
    <button onclick="getLocation()" class="mt-2 w-full text-sm flex items-center justify-center gap-1.5 py-2 font-medium" style="color:#1a2f5e">
      <i class="fas fa-location-dot" style="color:#84cc16"></i>현재 위치로 찾기
    </button>
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
  el.innerHTML=list.length?list.map(s=>'<a href="/stations/'+s.id+'" class="card block fade-in" style="border:1px solid #eef1f7"><div class="flex items-center justify-between"><div class="flex-1 min-w-0"><h3 class="font-semibold truncate" style="color:#1a202c">'+s.station_name+'</h3><p class="text-xs truncate mt-0.5" style="color:#8e9ab4">'+s.address+'</p><div class="flex items-center gap-2 mt-1.5"><span class="badge badge-green">쿠폰 '+(s.coupon_count||0)+'종</span>'+(s.distance!=null?'<span class="text-xs" style="color:#bef264">'+s.distance.toFixed(1)+'km</span>':'')+'</div></div><i class="fas fa-chevron-right ml-3" style="color:#dde3ef"></i></div></a>').join(''):'<div class="card text-center py-12" style="color:#8e9ab4">검색 결과가 없습니다</div>'; } catch {}
}
window.addEventListener('DOMContentLoaded',()=>loadStations());
</script>
`)
}

export function stationDetailPage(): string {
  const tossHead = '<script src="https://js.tosspayments.com/v1/payment"></scr'+'ipt>';
  return htmlPage('주유소 상세', `
<div class="min-h-screen pb-8">
  <div class="page-header">
    <button onclick="history.back()" class="back-btn"><i class="fas fa-arrow-left"></i></button>
    <span id="pageTitle" class="page-header-title">주유소</span>
  </div>
  <div id="content" class="p-4 space-y-4">
    <div class="card text-center py-12">
      <i class="fas fa-spinner fa-spin text-2xl" style="color:#84cc16"></i>
    </div>
  </div>
</div>

<!-- 구매 수량 선택 모달 -->
<div id="buyModal" class="modal-bg hidden">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-handle"></div>
    <div class="modal-title" id="buyModalTitle">쿠폰 구매</div>
    <p class="modal-sub" id="buyModalSub"></p>
    <div class="mb-5">
      <label class="text-sm font-medium mb-3 block" style="color:#4a5568">구매 수량</label>
      <div class="flex items-center justify-between rounded-2xl p-2" style="background:#f4f7fb">
        <button onclick="changeQty(-1)" class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold active:bg-gray-100" style="color:#4a5568">−</button>
        <div class="text-center">
          <div class="text-3xl font-bold" style="color:#1a202c" id="qtyNum">1</div>
          <div class="text-xs" style="color:#8e9ab4">매</div>
        </div>
        <button onclick="changeQty(1)" class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold" style="color:#84cc16">+</button>
      </div>
    </div>
    <div class="rounded-2xl p-4 mb-5" style="background:#f0ffd4">
      <div class="flex justify-between items-center mb-1">
        <span class="text-sm" style="color:#4a5568">단가</span>
        <span class="text-sm font-semibold" style="color:#1a202c" id="unitPriceLabel"></span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm" style="color:#4a5568">총 결제금액</span>
        <span class="text-xl font-bold" style="color:#65a30d" id="totalPriceLabel"></span>
      </div>
    </div>
    <div class="rounded-xl p-3 mb-5 text-xs space-y-1" style="background:#fef3c7;border:1px solid #fde68a;color:#92400e">
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
      '<div class="card" style="border-left:4px solid #84cc16"><h2 class="text-lg font-bold" style="color:#1a202c">'+s.station_name+'</h2>'
      +'<p class="text-sm mt-2" style="color:#8e9ab4"><i class="fas fa-map-marker-alt mr-1.5" style="color:#84cc16"></i>'+s.address+(s.address_detail?' '+s.address_detail:'')+'</p>'
      +(s.phone?'<p class="text-sm mt-1.5" style="color:#8e9ab4"><i class="fas fa-phone mr-1.5" style="color:#84cc16"></i><a href="tel:'+s.phone+'" style="color:#1a2f5e;font-weight:600">'+s.phone+'</a></p>':'')
      +'<div class="mt-3"><span class="badge badge-navy">'+(s.car_wash_type==='automatic'?'🚗 자동세차':s.car_wash_type==='self'?'💧 셀프세차':'🚗 자동+셀프')+'</span></div></div>'
      +'<h3 class="font-bold text-base" style="color:#1a202c">판매 쿠폰</h3>'
      +(coupons.length?coupons.map(c=>{
        const disc=Math.round((1-c.discount_price/c.original_price)*100);
        return '<div class="card fade-in" style="border:1px solid #eef1f7">'
          +'<div class="flex justify-between items-start mb-2">'
          +'<div class="flex-1"><h4 class="font-semibold" style="color:#1a202c">'+c.title+'</h4>'+(c.description?'<p class="text-xs mt-0.5" style="color:#8e9ab4">'+c.description+'</p>':'')+'</div>'
          +(disc>0?'<span class="badge badge-red ml-2 flex-shrink-0">'+disc+'%</span>':'')
          +'</div>'
          +'<div class="flex items-baseline gap-2 mb-2">'
          +'<span class="text-2xl font-bold" style="color:#65a30d">'+formatPrice(c.discount_price)+'</span>'
          +(disc>0?'<span class="text-sm line-through" style="color:#dde3ef">'+formatPrice(c.original_price)+'</span>':'')
          +'</div>'
          +'<p class="text-xs mb-4" style="color:#8e9ab4">'+c.wash_count+'회 이용권 · 유효기간 없음</p>'
          +'<button class="btn btn-primary buy-btn" data-id="'+c.id+'" data-price="'+c.discount_price+'" data-wash="'+c.wash_count+'" data-title="'+c.title.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'">구매하기</button>'
          +'</div>';
      }).join('')
      :'<div class="card text-center py-10" style="color:#8e9ab4">판매 중인 쿠폰이 없습니다</div>');
    document.getElementById('content').addEventListener('click', function(e) {
      const btn = e.target.closest('.buy-btn');
      if (!btn) return;
      openBuyModal(Number(btn.dataset.id), Number(btn.dataset.price), btn.dataset.title, Number(btn.dataset.wash));
    });
  } catch { document.getElementById('content').innerHTML='<div class="card text-center py-10" style="color:#ef4444">정보를 불러올 수 없습니다</div>'; }
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
    if (!r.clientKey || r.clientKey === 'test_ck_placeholder') {
      showToast('결제 키가 설정되지 않았습니다. 관리자에게 문의해주세요.', 'error');
      return;
    }
    closeModal('buyModal');
    const tossPayments = TossPayments(r.clientKey);
    await tossPayments.requestPayment('카드', {
      amount: r.amount,
      orderId: r.orderId,
      orderName: r.orderName,
      customerName: r.customerName,
      successUrl: r.successUrl,
      failUrl: r.failUrl,
    });
  } catch (e) {
    if (e && e.code === 'USER_CANCEL') return;
    showToast((e && e.message) || '결제 준비 실패', 'error');
  }
}
</script>
`, tossHead)
}
