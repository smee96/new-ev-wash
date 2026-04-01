// 사장님 홈 페이지
import { htmlPage } from '../layout'

export function ownerHomePage(): string {
  return htmlPage('사장님 홈', `
<div class="min-h-screen pb-24">
  <!-- 헤더 -->
  <div class="ev-bg text-white px-5 pb-7" style="padding-top:max(48px,env(safe-area-inset-top))">
    <div class="flex justify-between items-center">
      <div>
        <p class="text-sm opacity-60 mb-0.5" id="ownerGreet">안녕하세요</p>
        <h1 class="text-2xl font-bold" id="ownerName">사장님</h1>
      </div>
      <button onclick="doLogout()" class="w-10 h-10 rounded-full flex items-center justify-center" style="background:rgba(255,255,255,.15)">
        <i class="fas fa-sign-out-alt text-white"></i>
      </button>
    </div>
  </div>

  <div class="p-4 space-y-4" style="margin-top:-20px">

    <!-- 정산 대기 카드 (메인) -->
    <div id="pendingCard" class="card" style="background:#0a1628;border:none;border-radius:20px">
      <p class="text-xs mb-1" style="color:rgba(255,255,255,.5)"><i class="fas fa-clock mr-1" style="color:#84cc16"></i>정산 대기 금액</p>
      <p class="text-3xl font-bold mb-0.5" style="color:#bef264" id="pendingSettle">-</p>
      <p class="text-xs mb-4" style="color:rgba(255,255,255,.35)" id="pendingFeeNote">플랫폼 수수료 차감 후</p>
      <div class="grid grid-cols-2 gap-2">
        <div class="rounded-xl p-3" style="background:rgba(255,255,255,.07)">
          <p class="text-xs mb-1" style="color:rgba(255,255,255,.45)">미정산 매출</p>
          <p class="font-bold" style="color:#fff" id="pendingSales">-</p>
        </div>
        <div class="rounded-xl p-3" style="background:rgba(255,255,255,.07)">
          <p class="text-xs mb-1" style="color:rgba(255,255,255,.45)">활성 쿠폰</p>
          <p class="font-bold" style="color:#fff" id="activeCoupons">- 건</p>
        </div>
      </div>
    </div>

    <!-- 오늘 / 이번달 탭 -->
    <div class="card" style="padding:0;overflow:hidden">
      <div class="flex border-b" style="border-color:#eef1f7">
        <button id="tab_today" onclick="switchTab('today')"
          class="flex-1 py-3 text-sm font-bold" style="color:#1a2f5e;border-bottom:2px solid #84cc16">오늘</button>
        <button id="tab_month" onclick="switchTab('month')"
          class="flex-1 py-3 text-sm font-medium" style="color:#8e9ab4;border-bottom:2px solid transparent">이번달</button>
      </div>

      <!-- 오늘 -->
      <div id="ct_today" class="p-4">
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center">
            <p class="text-xl font-bold" style="color:#1a2f5e" id="todayCount">-</p>
            <p class="text-xs mt-1" style="color:#8e9ab4">사용건수</p>
          </div>
          <div class="text-center" style="border-left:1px solid #eef1f7;border-right:1px solid #eef1f7">
            <p class="text-xl font-bold" style="color:#1a2f5e" id="todaySales">-</p>
            <p class="text-xs mt-1" style="color:#8e9ab4">매출</p>
          </div>
          <div class="text-center">
            <p class="text-xl font-bold" style="color:#65a30d" id="todaySettle">-</p>
            <p class="text-xs mt-1" style="color:#8e9ab4">예상 정산</p>
          </div>
        </div>
      </div>

      <!-- 이번달 (hidden) -->
      <div id="ct_month" class="p-4 hidden">
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center">
            <p class="text-xl font-bold" style="color:#1a2f5e" id="monthCount">-</p>
            <p class="text-xs mt-1" style="color:#8e9ab4">사용건수</p>
          </div>
          <div class="text-center" style="border-left:1px solid #eef1f7;border-right:1px solid #eef1f7">
            <p class="text-xl font-bold" style="color:#1a2f5e" id="monthSales">-</p>
            <p class="text-xs mt-1" style="color:#8e9ab4">매출</p>
          </div>
          <div class="text-center">
            <p class="text-xl font-bold" style="color:#65a30d" id="monthSettle">-</p>
            <p class="text-xs mt-1" style="color:#8e9ab4">예상 정산</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 빠른 메뉴 -->
    <div class="card">
      <h3 class="font-semibold text-sm mb-3" style="color:#1a2f5e">빠른 메뉴</h3>
      <div class="grid grid-cols-4 gap-2">
        <a href="/owner/stations" class="flex flex-col items-center gap-1.5 py-3 rounded-xl" style="background:#f4f7fb">
          <i class="fas fa-gas-pump text-xl" style="color:#1a2f5e"></i>
          <span class="text-xs font-medium" style="color:#1a2f5e">주유소</span>
        </a>
        <a href="/owner/apply" class="flex flex-col items-center gap-1.5 py-3 rounded-xl" style="background:#f4f7fb">
          <i class="fas fa-plus-circle text-xl" style="color:#65a30d"></i>
          <span class="text-xs font-medium" style="color:#1a2f5e">등록신청</span>
        </a>
        <a href="/owner/stations" class="flex flex-col items-center gap-1.5 py-3 rounded-xl" style="background:#f4f7fb">
          <i class="fas fa-ticket-alt text-xl" style="color:#f59e0b"></i>
          <span class="text-xs font-medium" style="color:#1a2f5e">쿠폰관리</span>
        </a>
        <a href="/owner/stations" class="flex flex-col items-center gap-1.5 py-3 rounded-xl" style="background:#f4f7fb">
          <i class="fas fa-won-sign text-xl" style="color:#ef4444"></i>
          <span class="text-xs font-medium" style="color:#1a2f5e">정산내역</span>
        </a>
      </div>
    </div>

    <!-- 내 주유소 목록 (간략) -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h3 class="section-title" style="margin:0">내 주유소</h3>
        <a href="/owner/stations" class="text-xs" style="color:#84cc16">전체보기 <i class="fas fa-chevron-right"></i></a>
      </div>
      <div id="stationPreview">
        <div class="card text-center py-8">
          <i class="fas fa-spinner fa-spin text-xl" style="color:#84cc16"></i>
        </div>
      </div>
    </div>

    <!-- 심사중/반려 알림 -->
    <div id="applicationAlert"></div>

  </div>
</div>

<!-- 하단 내비 -->
<nav class="bottom-nav">
  <a href="/owner" class="active"><i class="fas fa-home"></i>홈</a>
  <a href="/owner/stations"><i class="fas fa-gas-pump"></i>주유소</a>
  <a href="/owner/mypage"><i class="fas fa-user"></i>마이</a>
</nav>

<script>
function switchTab(t) {
  ['today','month'].forEach(k => {
    document.getElementById('tab_'+k).style.color = k===t ? '#1a2f5e' : '#8e9ab4';
    document.getElementById('tab_'+k).style.borderBottomColor = k===t ? '#84cc16' : 'transparent';
    document.getElementById('tab_'+k).style.fontWeight = k===t ? '700' : '500';
    document.getElementById('ct_'+k).classList.toggle('hidden', k!==t);
  });
}

function doLogout() {
  showDialog({ icon:'👋', title:'로그아웃', msg:'로그아웃 하시겠습니까?',
    confirmText:'로그아웃', confirmClass:'btn-danger', onConfirm: logout });
}

window.addEventListener('DOMContentLoaded', async () => {
  const u = requireAuth('station_owner');
  if (!u) return;
  document.getElementById('ownerName').textContent = (u.name || '사장') + '님';

  // 요약 통계
  try {
    const r = await API.get('/stations/owner-summary');
    const fp = v => (v||0).toLocaleString() + '원';
    const fr = r.fee_rate ?? 15;

    // 정산대기 카드
    document.getElementById('pendingSettle').textContent = fp(r.pending_settle);
    document.getElementById('pendingSales').textContent  = fp(r.pending_sales);
    document.getElementById('activeCoupons').textContent = (r.active_coupons||0) + ' 건';
    document.getElementById('pendingFeeNote').textContent = '수수료 ' + fr + '% 차감 후 예상 정산액';

    // 오늘
    document.getElementById('todayCount').textContent  = (r.today_count||0) + '건';
    document.getElementById('todaySales').textContent  = fp(r.today_sales);
    document.getElementById('todaySettle').textContent = fp(r.today_settle);

    // 이번달
    document.getElementById('monthCount').textContent  = (r.month_count||0) + '건';
    document.getElementById('monthSales').textContent  = fp(r.month_sales);
    document.getElementById('monthSettle').textContent = fp(r.month_settle);
  } catch(e) {
    document.getElementById('pendingSettle').textContent = '불러오기 실패';
  }

  // 주유소 미리보기
  try {
    const r = await API.get('/stations/my-stations');
    const list = (r.stations||[]).slice(0,3);
    const el = document.getElementById('stationPreview');
    if (!list.length) {
      el.innerHTML = '<div class="card text-center py-8"><i class="fas fa-gas-pump text-3xl mb-3" style="color:#dde3ef"></i>'
        +'<p class="text-sm mb-3" style="color:#8e9ab4">등록된 주유소가 없습니다</p>'
        +'<a href="/owner/apply" class="btn btn-primary" style="width:auto;display:inline-block;padding:10px 24px">주유소 등록 신청</a></div>';
      return;
    }
    el.innerHTML = list.map(s => '<a href="/owner/stations/'+s.id+'" class="card block mb-2 fade-in" style="border:1px solid #eef1f7;text-decoration:none">'
      +'<div class="flex items-center justify-between">'
        +'<div class="flex-1 min-w-0">'
          +'<div class="flex items-center gap-2">'
            +'<h3 class="font-semibold truncate text-sm" style="color:#1a202c">'+s.station_name+'</h3>'
            +(s.is_closed ? '<span class="badge badge-red">폐업</span>' : s.is_active ? '<span class="badge badge-green">운영중</span>' : '<span class="badge badge-gray">비활성</span>')
          +'</div>'
          +'<div class="flex gap-3 mt-1 text-xs" style="color:#8e9ab4">'
            +'<span>쿠폰 <b style="color:#1a2f5e">'+s.coupon_count+'</b>종</span>'
            +'<span>이번달 <b style="color:#1a2f5e">'+s.monthly_usages+'</b>건</span>'
          +'</div>'
        +'</div>'
        +'<i class="fas fa-chevron-right ml-2" style="color:#dde3ef"></i>'
      +'</div>'
    +'</a>').join('');
  } catch {}

  // 심사/반려 알림
  try {
    const r = await API.get('/stations/my-applications');
    const apps = r.applications || [];
    const pending  = apps.filter(a => a.status==='pending');
    const rejected = apps.filter(a => a.status==='rejected');
    const el = document.getElementById('applicationAlert');
    const parts = [];
    if (pending.length) {
      parts.push('<div class="card" style="border-left:4px solid #f59e0b">'
        +'<div class="flex items-center gap-2 mb-1"><i class="fas fa-hourglass-half" style="color:#f59e0b"></i>'
        +'<p class="font-semibold text-sm" style="color:#92400e">심사 중 '+pending.length+'건</p></div>'
        +'<p class="text-xs" style="color:#8e9ab4">1~2 영업일 내 처리됩니다</p></div>');
    }
    if (rejected.length) {
      parts.push('<div class="card" style="border-left:4px solid #ef4444">'
        +'<div class="flex items-center justify-between mb-1">'
        +'<div class="flex items-center gap-2"><i class="fas fa-times-circle" style="color:#ef4444"></i>'
        +'<p class="font-semibold text-sm" style="color:#ef4444">반려된 신청 '+rejected.length+'건</p></div>'
        +'<a href="/owner/stations" class="text-xs" style="color:#2563eb">확인하기</a></div>'
        +'<p class="text-xs" style="color:#8e9ab4">반려 사유를 확인하고 재신청해주세요</p></div>');
    }
    el.innerHTML = parts.join('');
  } catch {}
});
</script>
`)
}
