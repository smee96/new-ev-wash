// 사장님 홈 페이지
import { htmlPage } from '../layout'

export function ownerHomePage(): string {
  return htmlPage('사장님 홈', `
<div class="min-h-screen pb-24">
  <!-- 헤더 -->
  <div class="ev-bg text-white px-5 pb-4" style="padding-top:max(48px,env(safe-area-inset-top))">
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

  <div class="p-4 space-y-4" style="margin-top:16px">

    <!-- 이번달 사용 현황 카드 (메인) -->
    <div class="card" style="background:#0a1628;border:none;border-radius:20px;padding:20px">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs font-medium" style="color:rgba(255,255,255,.5)">
          <i class="fas fa-calendar-alt mr-1" style="color:#84cc16"></i>
          <span id="monthLabel">이번달</span> 사용 현황
        </p>
        <span class="text-xs px-2 py-0.5 rounded-full" style="background:rgba(132,204,22,.15);color:#84cc16" id="feeRateBadge">수수료 15%</span>
      </div>

      <!-- 이번달 핵심 수치 2칸 -->
      <div class="grid grid-cols-2 gap-2 mb-4">
        <div class="rounded-xl p-3 text-center" style="background:rgba(255,255,255,.07)">
          <p class="text-2xl font-bold leading-tight" style="color:#fff" id="monthUseCount">-</p>
          <p class="text-xs mt-1" style="color:rgba(255,255,255,.4)">이번달 사용건수</p>
        </div>
        <div class="rounded-xl p-3 text-center" style="background:rgba(132,204,22,.12)">
          <p class="text-lg font-bold leading-tight" style="color:#84cc16" id="monthUseSettle">-</p>
          <p class="text-xs mt-1" style="color:rgba(255,255,255,.4)">예상 정산액</p>
        </div>
      </div>

      <!-- 정산 완료 + 정산 대기 -->
      <div class="grid grid-cols-2 gap-2">
        <div class="rounded-xl p-3" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)">
          <div class="flex items-center gap-1.5 mb-1">
            <i class="fas fa-check-circle text-xs" style="color:#4ade80"></i>
            <p class="text-xs" style="color:rgba(255,255,255,.45)">이번달 정산완료</p>
          </div>
          <p class="font-bold text-sm" style="color:#4ade80" id="monthSettled">-</p>
        </div>
        <div class="rounded-xl p-3" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08)">
          <div class="flex items-center gap-1.5 mb-1">
            <i class="fas fa-clock text-xs" style="color:#fbbf24"></i>
            <p class="text-xs" style="color:rgba(255,255,255,.45)">정산 대기</p>
          </div>
          <p class="font-bold text-sm" style="color:#fbbf24" id="pendingSettle">-</p>
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
        <div class="rounded-xl p-3 mb-3" style="background:#f4f7fb">
          <p class="text-xs mb-1" style="color:#8e9ab4"><i class="fas fa-car-wash mr-1"></i>세차 사용</p>
          <p class="text-2xl font-bold" style="color:#1a2f5e" id="todayUseCount">-건</p>
          <p class="text-sm mt-0.5" style="color:#1a2f5e" id="todayUseSales">-</p>
        </div>
        <div class="rounded-xl p-3 flex items-center justify-between" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #86efac">
          <div class="flex items-center gap-2">
            <i class="fas fa-coins" style="color:#16a34a"></i>
            <p class="text-sm font-medium" style="color:#15803d">오늘 예상 정산액</p>
          </div>
          <p class="text-lg font-bold" style="color:#16a34a" id="todayUseSettle">-</p>
        </div>
      </div>

      <!-- 이번달 -->
      <div id="ct_month" class="p-4 hidden">
        <div class="rounded-xl p-3 mb-3" style="background:#f4f7fb">
          <p class="text-xs mb-1" style="color:#8e9ab4"><i class="fas fa-car-wash mr-1"></i>세차 사용</p>
          <p class="text-2xl font-bold" style="color:#1a2f5e" id="monthUseCount2">-건</p>
          <p class="text-sm mt-0.5" style="color:#1a2f5e" id="monthUseSales2">-</p>
        </div>
        <div class="rounded-xl p-3 flex items-center justify-between" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #86efac">
          <div class="flex items-center gap-2">
            <i class="fas fa-coins" style="color:#16a34a"></i>
            <p class="text-sm font-medium" style="color:#15803d">이번달 예상 정산액</p>
          </div>
          <p class="text-lg font-bold" style="color:#16a34a" id="monthUseSettle2">-</p>
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

function fp(v) { return (v||0).toLocaleString() + '원'; }

window.addEventListener('DOMContentLoaded', async () => {
  const u = requireAuth('station_owner');
  if (!u) return;
  document.getElementById('ownerName').textContent = (u.name || '사장') + '님';

  // 현재 월 표시
  const now = new Date(Date.now() + 9*60*60*1000);
  document.getElementById('monthLabel').textContent = (now.getMonth()+1) + '월';

  // 요약 통계
  try {
    const r = await API.get('/stations/owner-summary');
    const fr = r.fee_rate ?? 15;
    document.getElementById('feeRateBadge').textContent = '수수료 ' + fr + '%';

    // 메인 카드 - 이번달 사용건수 + 예상정산 + 정산완료/대기
    document.getElementById('monthUseCount').textContent   = (r.month_use_count||0) + '건';
    document.getElementById('monthUseSettle').textContent  = fp(r.month_use_settle);
    document.getElementById('monthSettled').textContent    = fp(r.month_settled);
    document.getElementById('pendingSettle').textContent   = fp(r.pending_settle);

    // 오늘 탭 - 사용 중심
    document.getElementById('todayUseCount').textContent   = (r.today_use_count||0) + '건';
    document.getElementById('todayUseSales').textContent   = fp(r.today_use_sales);
    document.getElementById('todayUseSettle').textContent  = fp(r.today_use_settle);

    // 이번달 탭 - 사용 중심
    document.getElementById('monthUseCount2').textContent  = (r.month_use_count||0) + '건';
    document.getElementById('monthUseSales2').textContent  = fp(r.month_use_sales);
    document.getElementById('monthUseSettle2').textContent = fp(r.month_use_settle);

  } catch(e) {
    document.getElementById('monthUseSettle').textContent = '불러오기 실패';
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
            +'<span>이번달 <b style="color:#1a2f5e">'+s.monthly_usages+'</b>건 사용</span>'
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
