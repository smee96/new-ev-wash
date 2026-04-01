// 사장님 마이페이지
import { htmlPage } from '../layout'

export function ownerMyPage(): string {
  return htmlPage('마이페이지', `
<div class="min-h-screen pb-24">
  <div class="ev-bg text-white px-5 pb-8" style="padding-top:max(48px,env(safe-area-inset-top))">
    <h1 class="text-xl font-bold mb-1">마이페이지</h1>
    <p class="text-sm opacity-60" id="mpOwnerName">사장님</p>
  </div>

  <div class="p-4 space-y-4" style="margin-top:-16px">
    <!-- 계정 -->
    <div class="card">
      <h3 class="font-semibold text-xs mb-3 uppercase tracking-wide" style="color:#8e9ab4">계정</h3>
      <a href="/owner/apply" class="flex items-center justify-between py-3.5 border-b" style="border-color:#f4f7fb">
        <span class="text-base" style="color:#1a202c"><i class="fas fa-plus-circle w-6 mr-2" style="color:#84cc16"></i>주유소 등록 신청</span>
        <i class="fas fa-chevron-right text-sm" style="color:#dde3ef"></i>
      </a>
      <a href="/owner/stations" class="flex items-center justify-between py-3.5">
        <span class="text-base" style="color:#1a202c"><i class="fas fa-gas-pump w-6 mr-2" style="color:#84cc16"></i>내 주유소 관리</span>
        <i class="fas fa-chevron-right text-sm" style="color:#dde3ef"></i>
      </a>
    </div>

    <!-- 정보 -->
    <div class="card">
      <h3 class="font-semibold text-xs mb-3 uppercase tracking-wide" style="color:#8e9ab4">서비스</h3>
      <a href="/guide" class="flex items-center justify-between py-3.5 border-b" style="border-color:#f4f7fb">
        <span class="text-base" style="color:#1a202c"><i class="fas fa-book w-6 mr-2" style="color:#84cc16"></i>이용 안내</span>
        <i class="fas fa-chevron-right text-sm" style="color:#dde3ef"></i>
      </a>
      <a href="mailto:bensmee96@gmail.com" class="flex items-center justify-between py-3.5 border-b" style="border-color:#f4f7fb">
        <span class="text-base" style="color:#1a202c"><i class="fas fa-headset w-6 mr-2" style="color:#84cc16"></i>고객센터</span>
        <i class="fas fa-chevron-right text-sm" style="color:#dde3ef"></i>
      </a>
      <a href="/terms" class="flex items-center justify-between py-3.5 border-b" style="border-color:#f4f7fb">
        <span class="text-base" style="color:#1a202c"><i class="fas fa-file-alt w-6 mr-2" style="color:#84cc16"></i>이용약관</span>
        <i class="fas fa-chevron-right text-sm" style="color:#dde3ef"></i>
      </a>
      <a href="/privacy" class="flex items-center justify-between py-3.5">
        <span class="text-base" style="color:#1a202c"><i class="fas fa-shield-alt w-6 mr-2" style="color:#84cc16"></i>개인정보처리방침</span>
        <i class="fas fa-chevron-right text-sm" style="color:#dde3ef"></i>
      </a>
    </div>

    <!-- 로그아웃 -->
    <button onclick="doLogout()" class="btn w-full" style="background:#fff5f5;color:#ef4444;border:1px solid #fecaca">
      <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
    </button>
  </div>
</div>

<!-- 하단 내비 -->
<nav class="bottom-nav">
  <a href="/owner"><i class="fas fa-home"></i>홈</a>
  <a href="/owner/stations"><i class="fas fa-gas-pump"></i>주유소</a>
  <a href="/owner/mypage" class="active"><i class="fas fa-user"></i>마이</a>
</nav>

<script>
window.addEventListener('DOMContentLoaded', () => {
  const u = requireAuth('station_owner');
  if (!u) return;
  document.getElementById('mpOwnerName').textContent = (u.name||'사장') + '님';
});
function doLogout() {
  showDialog({ icon:'👋', title:'로그아웃', msg:'로그아웃 하시겠습니까?',
    confirmText:'로그아웃', confirmClass:'btn-danger', onConfirm: logout });
}
</script>
`)
}
