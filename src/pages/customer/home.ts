// 고객 홈, 주유소 목록, 주유소 상세 페이지
import { htmlPage } from '../layout'

// ─────────────────────────────────────────
// 홈 탭 - 대시보드: 쿠폰 현황 + 빠른 액션 + 최근 이용
// ─────────────────────────────────────────
export function customerHomePage(): string {
  return htmlPage('홈', `
<div class="min-h-screen pb-24">
  <!-- 헤더 -->
  <div class="ev-bg text-white px-5 pb-8" style="padding-top:max(48px,env(safe-area-inset-top))">
    <div class="flex items-center justify-between mb-6">
      <div>
        <p class="text-sm opacity-60 mb-0.5" id="greeting">안녕하세요</p>
        <h1 class="text-2xl font-bold" id="userName">EV-Wash</h1>
      </div>
      <a href="/mypage" class="w-11 h-11 rounded-full flex items-center justify-center" style="background:rgba(255,255,255,.15)">
        <i class="fas fa-user text-white text-lg"></i>
      </a>
    </div>
    <!-- 쿠폰 요약 카드 -->
    <a href="/my-coupons" id="couponCard" class="block rounded-2xl p-4" style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2)">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs opacity-60 mb-1">보유 쿠폰</p>
          <p class="text-2xl font-bold"><span id="couponCount">-</span>회 <span class="text-base font-normal opacity-70">사용 가능</span></p>
        </div>
        <div class="text-right">
          <i class="fas fa-ticket-alt text-3xl" style="color:#bef264"></i>
          <p class="text-xs opacity-60 mt-1">내 쿠폰 보기 →</p>
        </div>
      </div>
    </a>
  </div>

  <div class="px-4 -mt-4 space-y-4">
    <!-- 빠른 메뉴 -->
    <div class="card">
      <p class="text-xs font-semibold mb-3" style="color:#8e9ab4">빠른 메뉴</p>
      <div class="grid grid-cols-4 gap-2">
        <a href="/stations" class="flex flex-col items-center gap-1.5 py-3 rounded-xl" style="background:#f4f7fb">
          <i class="fas fa-map-marker-alt text-xl" style="color:#84cc16"></i>
          <span class="text-xs font-semibold" style="color:#1a2f5e">주유소</span>
        </a>
        <a href="/my-coupons" class="flex flex-col items-center gap-1.5 py-3 rounded-xl" style="background:#f4f7fb">
          <i class="fas fa-ticket-alt text-xl" style="color:#84cc16"></i>
          <span class="text-xs font-semibold" style="color:#1a2f5e">내 쿠폰</span>
        </a>
        <a href="/my-refunds" class="flex flex-col items-center gap-1.5 py-3 rounded-xl" style="background:#f4f7fb">
          <i class="fas fa-undo-alt text-xl" style="color:#84cc16"></i>
          <span class="text-xs font-semibold" style="color:#1a2f5e">환불내역</span>
        </a>
        <a href="/guide" class="flex flex-col items-center gap-1.5 py-3 rounded-xl" style="background:#f4f7fb">
          <i class="fas fa-question-circle text-xl" style="color:#84cc16"></i>
          <span class="text-xs font-semibold" style="color:#1a2f5e">이용안내</span>
        </a>
      </div>
    </div>

    <!-- 사용 가능한 내 쿠폰 -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h2 class="font-bold" style="color:#1a202c">사용 가능한 쿠폰</h2>
        <a href="/my-coupons" class="text-xs" style="color:#84cc16">전체보기</a>
      </div>
      <div id="myCouponList">
        <div class="card text-center py-8" style="color:#8e9ab4">
          <i class="fas fa-spinner fa-spin text-xl"></i>
        </div>
      </div>
    </div>

    <!-- 이용 방법 안내 배너 -->
    <div class="card" style="background:linear-gradient(135deg,#0a1628,#1a2f5e);border:none">
      <p class="text-xs font-semibold mb-3" style="color:#bef264">EV-Wash 이용방법</p>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div>
          <div class="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1.5" style="background:rgba(190,242,100,.15)">
            <i class="fas fa-map-marker-alt" style="color:#bef264"></i>
          </div>
          <p class="text-xs font-semibold text-white">1. 주유소 찾기</p>
          <p class="text-xs mt-0.5" style="color:rgba(255,255,255,.5)">지도에서 선택</p>
        </div>
        <div>
          <div class="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1.5" style="background:rgba(190,242,100,.15)">
            <i class="fas fa-ticket-alt" style="color:#bef264"></i>
          </div>
          <p class="text-xs font-semibold text-white">2. 쿠폰 구매</p>
          <p class="text-xs mt-0.5" style="color:rgba(255,255,255,.5)">할인가로 결제</p>
        </div>
        <div>
          <div class="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1.5" style="background:rgba(190,242,100,.15)">
            <i class="fas fa-qrcode" style="color:#bef264"></i>
          </div>
          <p class="text-xs font-semibold text-white">3. QR로 사용</p>
          <p class="text-xs mt-0.5" style="color:rgba(255,255,255,.5)">현장에서 스캔</p>
        </div>
      </div>
    </div>

    <!-- 최근 이용 주유소 -->
    <div id="recentSection" class="hidden">
      <div class="flex items-center justify-between mb-2">
        <h2 class="font-bold" style="color:#1a202c">최근 이용한 주유소</h2>
        <a href="/stations" class="text-xs" style="color:#84cc16">전체보기</a>
      </div>
      <div id="recentList"></div>
    </div>

    <!-- 비로그인 CTA -->
    <div id="loginCta" class="hidden">
      <div class="card text-center py-8">
        <i class="fas fa-car-wash text-4xl mb-3" style="color:#bef264"></i>
        <p class="font-semibold mb-1" style="color:#1a202c">로그인하고 쿠폰을 구매하세요</p>
        <p class="text-sm mb-4" style="color:#8e9ab4">가까운 주유소에서 할인 쿠폰을 이용하세요</p>
        <div class="flex gap-2 justify-center">
          <a href="/login" class="btn btn-primary" style="width:auto;padding:10px 24px">로그인</a>
          <a href="/stations" class="btn btn-outline" style="width:auto;padding:10px 24px">주유소 보기</a>
        </div>
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
  if (!u) {
    document.getElementById('loginCta').classList.remove('hidden');
    document.getElementById('couponCard').style.opacity = '0.5';
    document.getElementById('couponCount').textContent = '0';
    document.getElementById('myCouponList').innerHTML =
      '<div class="card text-center py-6" style="color:#8e9ab4"><p class="text-sm">로그인 후 이용할 수 있습니다</p></div>';
    return;
  }
  // 사용자 이름
  document.getElementById('greeting').textContent = '안녕하세요!';
  document.getElementById('userName').textContent = u.name + '님';
  try {
    const me = await API.get('/user/me');
    if (me.user?.name) document.getElementById('userName').textContent = me.user.name + '님';
  } catch {}

  // 쿠폰 목록 로드
  try {
    const r = await API.get('/coupons/my');
    const stations = r.stations || [];
    const total = stations.reduce((s, x) => s + x.remaining_quantity, 0);
    document.getElementById('couponCount').textContent = total;

    const listEl = document.getElementById('myCouponList');
    if (!stations.length) {
      listEl.innerHTML = '<div class="card text-center py-8"><i class="fas fa-ticket-alt text-3xl mb-2" style="color:#dde3ef"></i><p class="text-sm mb-3" style="color:#8e9ab4">보유한 쿠폰이 없습니다</p><a href="/stations" class="btn btn-primary" style="width:auto;display:inline-block;padding:10px 24px">주유소에서 구매하기</a></div>';
    } else {
      // 최대 3개 표시
      listEl.innerHTML = stations.slice(0, 3).map(st =>
        '<a href="/my-coupons/' + st.station_id + '" class="card block mb-2 fade-in" style="border:1px solid #eef1f7">'
        + '<div class="flex items-center justify-between">'
          + '<div class="flex-1 min-w-0">'
            + '<p class="font-semibold truncate" style="color:#1a202c">' + st.station_name + '</p>'
            + '<p class="text-xs mt-0.5 truncate" style="color:#8e9ab4">' + st.address + '</p>'
          + '</div>'
          + '<div class="ml-3 flex-shrink-0 text-right">'
            + '<p class="text-xl font-bold" style="color:#65a30d">' + st.remaining_quantity + '</p>'
            + '<p class="text-xs" style="color:#8e9ab4">회 남음</p>'
          + '</div>'
        + '</div>'
        + '</a>'
      ).join('');
      if (stations.length > 3) {
        listEl.innerHTML += '<a href="/my-coupons" class="block text-center text-xs py-2" style="color:#84cc16">+ ' + (stations.length - 3) + '개 더보기</a>';
      }
      // 최근 이용 주유소 (쿠폰 구매한 주유소들)
      document.getElementById('recentSection').classList.remove('hidden');
      document.getElementById('recentList').innerHTML = stations.slice(0, 2).map(st =>
        '<a href="/stations/' + st.station_id + '" class="card block mb-2 fade-in" style="border:1px solid #eef1f7">'
        + '<div class="flex items-center justify-between">'
          + '<div><p class="font-semibold" style="color:#1a202c">' + st.station_name + '</p>'
          + '<p class="text-xs mt-0.5" style="color:#8e9ab4">' + st.address + '</p></div>'
          + '<span class="text-xs px-2 py-1 rounded-lg ml-2" style="background:#f0ffd4;color:#65a30d">쿠폰 구매</span>'
        + '</div></a>'
      ).join('');
    }
  } catch {}
});
</script>
`)
}

// ─────────────────────────────────────────
// 주유소 목록 탭 - 카카오맵 + 검색 + 거리순
// ─────────────────────────────────────────
export function stationListPage(): string {
  const kakaoHead = '';
  return htmlPage('주유소 찾기', `
<style>
#mapWrap { position:relative; width:100%; height:260px; }
#map { width:100%; height:100%; }
.map-overlay-btn {
  position:absolute; z-index:10; background:#fff;
  border:1px solid #e2e8f0; border-radius:10px;
  padding:7px 13px; font-size:12px; font-weight:600;
  color:#1a2f5e; box-shadow:0 2px 6px rgba(0,0,0,.12);
  cursor:pointer; display:flex; align-items:center; gap:5px;
}
.loc-btn  { bottom:10px; left:10px; }
.map-toggle { bottom:10px; right:10px; }
</style>

<div class="min-h-screen pb-24">
  <!-- 검색바 -->
  <div class="bg-white sticky top-0 z-50 px-4 pt-3 pb-2 border-b" style="border-color:#eef1f7;padding-top:max(12px,env(safe-area-inset-top))">
    <div class="flex gap-2">
      <div class="relative flex-1">
        <input id="si" type="search" placeholder="주유소명 또는 지역 검색" class="input pl-10"
          style="background:#f4f7fb;font-size:15px"
          oninput="debounce()" onkeydown="if(event.key==='Enter')doSearch()">
        <i class="fas fa-search absolute left-3.5 top-4 text-sm" style="color:#8e9ab4"></i>
      </div>
      <button onclick="getLocation()" class="flex-shrink-0 px-3 rounded-xl text-sm font-semibold flex items-center gap-1.5" style="background:#f0ffd4;color:#1a2f5e">
        <i class="fas fa-location-dot" style="color:#84cc16"></i>내 위치
      </button>
    </div>
  </div>

  <!-- 카카오맵 -->
  <div id="mapWrap">
    <div id="map"></div>
    <button class="map-overlay-btn map-toggle" onclick="toggleView()">
      <i id="toggleIcon" class="fas fa-list"></i><span id="toggleText">목록</span>
    </button>
  </div>

  <!-- 주유소 목록 -->
  <div id="listWrap" class="p-4 space-y-2">
    <div class="card text-center py-10" style="color:#8e9ab4">
      <i class="fas fa-spinner fa-spin text-xl"></i>
    </div>
  </div>
</div>
<nav class="bottom-nav">
  <a href="/home"><i class="fas fa-home"></i>홈</a>
  <a href="/stations" class="active"><i class="fas fa-gas-pump"></i>주유소</a>
  <a href="/my-coupons"><i class="fas fa-ticket-alt"></i>내 쿠폰</a>
  <a href="/mypage"><i class="fas fa-user"></i>마이</a>
</nav>
<script>
let map, overlays=[], myMarker=null, myCircle=null, mapVisible=true, dt;

/* ── 토글 ── */
function toggleView() {
  mapVisible = !mapVisible;
  document.getElementById('mapWrap').style.display = mapVisible ? 'block' : 'none';
  document.getElementById('toggleIcon').className = mapVisible ? 'fas fa-list' : 'fas fa-map';
  document.getElementById('toggleText').textContent  = mapVisible ? '목록' : '지도';
}

/* ── 검색 ── */
function debounce() { clearTimeout(dt); dt = setTimeout(doSearch, 400); }
function doSearch()  {
  const kw = document.getElementById('si').value.trim();
  loadStations(kw ? 'keyword=' + encodeURIComponent(kw) : '');
}

/* ── 현재 위치 ── */
function getLocation() {
  if (!navigator.geolocation) { showToast('위치 서비스 미지원','error'); return; }
  showToast('위치를 가져오는 중...','info');
  navigator.geolocation.getCurrentPosition(
    function(p) {
      var lat = p.coords.latitude, lng = p.coords.longitude;
      if (myMarker) myMarker.setMap(null);
      if (myCircle) myCircle.setMap(null);
      var pos = new kakao.maps.LatLng(lat, lng);
      myMarker = new kakao.maps.Marker({
        map: map, position: pos,
        image: new kakao.maps.MarkerImage(
          'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
          new kakao.maps.Size(24, 35)
        )
      });
      myCircle = new kakao.maps.Circle({
        map: map, center: pos, radius: 1000,
        strokeWeight:1, strokeColor:'#84cc16', strokeOpacity:0.5,
        fillColor:'#bef264', fillOpacity:0.07
      });
      map.setCenter(pos);
      map.setLevel(5);
      loadStations('latitude=' + lat + '&longitude=' + lng);
    },
    function() { showToast('위치 권한이 필요합니다','warn'); }
  );
}

/* ── 마커 렌더 ── */
function renderMarkers(list) {
  overlays.forEach(function(o){ o.setMap(null); });
  overlays = [];
  if (!list.length) return;
  var bounds = new kakao.maps.LatLngBounds();
  list.forEach(function(s) {
    if (!s.latitude || !s.longitude) return;
    var pos = new kakao.maps.LatLng(s.latitude, s.longitude);
    bounds.extend(pos);
    // data-* 속성으로 넘겨 JS 안에서 encodeURIComponent 호출
    var distText = (s.distance != null) ? ' ' + s.distance.toFixed(1) + 'km' : '';
    var safeName = s.station_name.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    var content = [
      '<div style="display:flex;flex-direction:column;align-items:center">',
        '<div data-sid="' + s.id + '" style="background:#1a2f5e;color:#bef264;border-radius:20px;padding:5px 11px;',
          'font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.25);',
          'cursor:pointer;border:2px solid #bef264">',
          s.station_name + distText,
        '</div>',
        '<div style="display:flex;gap:4px;margin-top:4px">',
          '<a href="/stations/' + s.id + '" style="background:#fff;border:1px solid #e2e8f0;',
            'border-radius:8px;padding:2px 8px;font-size:10px;font-weight:600;color:#1a2f5e;',
            'text-decoration:none;box-shadow:0 1px 3px rgba(0,0,0,.1)">상세</a>',
          '<span data-lat="' + s.latitude + '" data-lng="' + s.longitude + '"',
            ' data-name="' + safeName + '"',
            ' onclick="openKakaoNavi(this)"',
            ' style="background:#FEE500;border:1px solid #f0d900;border-radius:8px;',
            'padding:2px 8px;font-size:10px;font-weight:600;color:#3C1E1E;',
            'cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.1)">길찾기</span>',
        '</div>',
        '<div style="width:0;height:0;border-left:5px solid transparent;',
          'border-right:5px solid transparent;border-top:6px solid #1a2f5e;margin:0 auto"></div>',
      '</div>'
    ].join('');
    var overlay = new kakao.maps.CustomOverlay({ position: pos, content: content, yAnchor: 1.0 });
    overlay.setMap(map);
    overlays.push(overlay);
  });
  if (!myMarker) {
    try { map.setBounds(bounds, 60); } catch(e) {}
  }
}

/* ── 마커 핀 클릭 → 상세 이동 ── */
document.addEventListener('click', function(e) {
  var t = e.target.closest('[data-sid]');
  if (t) { location.href = '/stations/' + t.getAttribute('data-sid'); }
});

/* ── 카카오맵 길찾기 (런타임에서 encodeURIComponent) ── */
function openKakaoNavi(el) {
  var name = el.getAttribute('data-name');
  var lat  = el.getAttribute('data-lat');
  var lng  = el.getAttribute('data-lng');
  window.open('https://map.kakao.com/link/to/' + encodeURIComponent(name) + ',' + lat + ',' + lng, '_blank');
}

/* ── 목록 렌더 ── */
function renderList(list) {
  var el = document.getElementById('listWrap');
  if (!list.length) {
    el.innerHTML = '<div class="card text-center py-12" style="color:#8e9ab4">'
      + '<i class="fas fa-search text-3xl mb-2 block"></i>검색 결과가 없습니다</div>';
    return;
  }
  el.innerHTML = list.map(function(s) {
    return '<a href="/stations/' + s.id + '" class="card block fade-in" style="border:1px solid #eef1f7">'
      + '<div class="flex items-center justify-between">'
        + '<div class="flex-1 min-w-0">'
          + '<h3 class="font-semibold truncate" style="color:#1a202c">' + s.station_name + '</h3>'
          + '<p class="text-xs truncate mt-0.5" style="color:#8e9ab4">' + s.address + '</p>'
          + '<div class="flex items-center gap-2 mt-1.5">'
            + '<span class="badge badge-green">쿠폰 ' + (s.coupon_count||0) + '종</span>'
            + (s.distance != null ? '<span class="text-xs font-semibold" style="color:#65a30d"><i class="fas fa-location-dot mr-0.5"></i>' + s.distance.toFixed(1) + 'km</span>' : '')
          + '</div>'
        + '</div>'
        + '<i class="fas fa-chevron-right ml-3" style="color:#dde3ef"></i>'
      + '</div>'
      + '</a>';
  }).join('');
}

/* ── 데이터 로드 ── */
async function loadStations(q) {
  q = q || '';
  try {
    var r = await API.get('/stations/nearby' + (q ? '?' + q : ''));
    var list = r.stations || [];
    renderList(list);
    renderMarkers(list);
  } catch(e) {
    document.getElementById('listWrap').innerHTML =
      '<div class="card text-center py-10" style="color:#ef4444">불러올 수 없습니다</div>';
  }
}

/* ── 지도 초기화 ── */
function initKakaoMap() {
  map = new kakao.maps.Map(document.getElementById('map'), {
    center: new kakao.maps.LatLng(37.5665, 126.9780),
    level: 8
  });
  loadStations();
}
/* 카카오맵 SDK를 동적으로 로드 후 초기화 */
(function() {
  var s = document.createElement('script');
  s.type = 'text/javascript';
  s.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=3ee65ceda136e8b4d9cfbabc8c6c6bce&libraries=services&autoload=false';
  s.onload = function() { kakao.maps.load(initKakaoMap); };
  document.head.appendChild(s);
})();
</script>
`, kakaoHead)
}

// ─────────────────────────────────────────
// 주유소 상세 페이지
// ─────────────────────────────────────────
export function stationDetailPage(): string {
  const tossHead = '<script src="https://js.tosspayments.com/v1/payment"></scr'+'ipt>';
  const kakaoHead = '';
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
        <button onclick="changeQty(-1)" class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold" style="color:#4a5568">−</button>
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
var stationId = location.pathname.split('/').pop();
var _buyData = {};

window.addEventListener('DOMContentLoaded', async function() {
  try {
    var results = await Promise.all([
      API.get('/stations/' + stationId + '/info'),
      API.get('/stations/' + stationId + '/coupons')
    ]);
    var s = results[0].station;
    var coupons = results[1].coupons || [];
    document.getElementById('pageTitle').textContent = s.station_name;

    // 쿠폰 HTML
    var couponsHtml = coupons.length
      ? coupons.map(function(c) {
          var disc = Math.round((1 - c.discount_price / c.original_price) * 100);
          return '<div class="card fade-in" style="border:1px solid #eef1f7">'
            + '<div class="flex justify-between items-start mb-2">'
              + '<div class="flex-1"><h4 class="font-semibold" style="color:#1a202c">' + c.title + '</h4>'
              + (c.description ? '<p class="text-xs mt-0.5" style="color:#8e9ab4">' + c.description + '</p>' : '')
              + '</div>'
              + (disc > 0 ? '<span class="badge badge-red ml-2 flex-shrink-0">' + disc + '%</span>' : '')
            + '</div>'
            + '<div class="flex items-baseline gap-2 mb-2">'
              + '<span class="text-2xl font-bold" style="color:#65a30d">' + formatPrice(c.discount_price) + '</span>'
              + (disc > 0 ? '<span class="text-sm line-through" style="color:#dde3ef">' + formatPrice(c.original_price) + '</span>' : '')
            + '</div>'
            + '<p class="text-xs mb-4" style="color:#8e9ab4">' + c.wash_count + '회 이용권 · 유효기간 없음</p>'
            + '<button class="btn btn-primary buy-btn"'
              + ' data-id="' + c.id + '"'
              + ' data-price="' + c.discount_price + '"'
              + ' data-wash="' + c.wash_count + '"'
              + ' data-title="' + c.title.replace(/&/g,'&amp;').replace(/"/g,'&quot;') + '">'
              + '구매하기</button>'
            + '</div>';
        }).join('')
      : '<div class="card text-center py-10" style="color:#8e9ab4">판매 중인 쿠폰이 없습니다</div>';

    // 지도/길찾기 HTML (런타임에서 encodeURIComponent)
    var mapHtml = '';
    var naviHtml = '';
    if (s.latitude && s.longitude) {
      mapHtml = '<div id="detailMap" style="width:100%;height:190px;border-radius:14px;overflow:hidden;margin-top:12px"></div>';
      naviHtml = '<button onclick="openKakaoNavi()" class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold mt-2" style="background:#FEE500;color:#3C1E1E">'
        + '<img src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png" style="width:18px;height:18px">카카오맵 길찾기</button>';
    }

    // 한 번에 삽입
    document.getElementById('content').innerHTML =
      '<div class="card" style="border-left:4px solid #84cc16">'
        + '<h2 class="text-lg font-bold" style="color:#1a202c">' + s.station_name + '</h2>'
        + '<p class="text-sm mt-2" style="color:#8e9ab4"><i class="fas fa-map-marker-alt mr-1.5" style="color:#84cc16"></i>'
          + s.address + (s.address_detail ? ' ' + s.address_detail : '') + '</p>'
        + (s.phone ? '<p class="text-sm mt-1.5" style="color:#8e9ab4"><i class="fas fa-phone mr-1.5" style="color:#84cc16"></i>'
          + '<a href="tel:' + s.phone + '" style="color:#1a2f5e;font-weight:600">' + s.phone + '</a></p>' : '')
        + '<div class="mt-3"><span class="badge badge-navy">'
          + (s.car_wash_type==='automatic' ? '🚗 자동세차' : s.car_wash_type==='self' ? '💧 셀프세차' : '🚗 자동+셀프')
          + '</span></div>'
        + mapHtml + naviHtml
      + '</div>'
      + '<h3 class="font-bold text-base" style="color:#1a202c">판매 쿠폰</h3>'
      + couponsHtml;

    // 구매 버튼 이벤트
    document.getElementById('content').addEventListener('click', function(e) {
      var btn = e.target.closest('.buy-btn');
      if (!btn) return;
      openBuyModal(Number(btn.dataset.id), Number(btn.dataset.price), btn.dataset.title, Number(btn.dataset.wash));
    });

    // 지도 초기화 (SDK 동적 로드)
    if (s.latitude && s.longitude) {
      window._stationLat  = s.latitude;
      window._stationLng  = s.longitude;
      window._stationName = s.station_name;
      (function(lat, lng, name) {
        function drawMap() {
          var el = document.getElementById('detailMap');
          if (!el) return;
          var pos = new kakao.maps.LatLng(lat, lng);
          var dm  = new kakao.maps.Map(el, { center: pos, level: 4 });
          new kakao.maps.Marker({ map: dm, position: pos });
          new kakao.maps.CustomOverlay({
            map: dm, position: pos, yAnchor: 2.8,
            content: '<div style="background:#1a2f5e;color:#bef264;border-radius:16px;padding:4px 10px;'
              + 'font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.2);'
              + 'border:2px solid #bef264;white-space:nowrap">' + name + '</div>'
          });
        }
        if (typeof kakao !== 'undefined' && kakao.maps && kakao.maps.Map) {
          drawMap();
        } else {
          var sc = document.createElement('script');
          sc.type = 'text/javascript';
          sc.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=3ee65ceda136e8b4d9cfbabc8c6c6bce&autoload=false';
          sc.onload = function() { kakao.maps.load(drawMap); };
          document.head.appendChild(sc);
        }
      })(s.latitude, s.longitude, s.station_name);
    }
  } catch(e) {
    document.getElementById('content').innerHTML =
      '<div class="card text-center py-10" style="color:#ef4444">정보를 불러올 수 없습니다</div>';
  }
});

function openKakaoNavi() {
  var url = 'https://map.kakao.com/link/to/'
    + encodeURIComponent(window._stationName || '')
    + ',' + (window._stationLat || '')
    + ',' + (window._stationLng || '');
  window.open(url, '_blank');
}
function openBuyModal(couponId, price, title, washCount) {
  if (!getUser()) { window.location.href = '/login'; return; }
  _buyData = { couponId: couponId, price: price, title: title, washCount: washCount, qty: 1 };
  document.getElementById('buyModalTitle').textContent = title;
  document.getElementById('buyModalSub').textContent = washCount + '회 이용권';
  document.getElementById('unitPriceLabel').textContent = formatPrice(price);
  updateBuyTotal();
  openModal('buyModal');
}
function changeQty(d) {
  _buyData.qty = Math.max(1, (_buyData.qty || 1) + d);
  document.getElementById('qtyNum').textContent = _buyData.qty;
  updateBuyTotal();
}
function updateBuyTotal() {
  document.getElementById('totalPriceLabel').textContent = formatPrice(_buyData.price * _buyData.qty);
}
async function confirmBuy() {
  try {
    var r = await API.post('/coupons/buy', { couponId: _buyData.couponId, quantity: _buyData.qty });
    if (!r.clientKey || r.clientKey === 'test_ck_placeholder') {
      showToast('결제 키가 설정되지 않았습니다. 관리자에게 문의해주세요.', 'error');
      return;
    }
    closeModal('buyModal');
    var tossPayments = TossPayments(r.clientKey);
    await tossPayments.requestPayment('카드', {
      amount: r.amount, orderId: r.orderId, orderName: r.orderName,
      customerName: r.customerName, successUrl: r.successUrl, failUrl: r.failUrl,
    });
  } catch(e) {
    if (e && e.code === 'USER_CANCEL') return;
    showToast((e && e.message) || '결제 준비 실패', 'error');
  }
}
</script>
`, tossHead + kakaoHead)
}
