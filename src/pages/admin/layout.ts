// 관리자 공통 레이아웃 (사이드바 네비게이션)
export const ADMIN_NAV = `
<aside id="adminSidebar" class="fixed left-0 top-0 h-full w-56 z-50 transition-transform md:translate-x-0 -translate-x-full"
  style="background:#0a1628;transition:transform .3s;border-right:1px solid rgba(255,255,255,.07)">
  <div class="p-5" style="border-bottom:1px solid rgba(255,255,255,.07)">
    <div class="flex items-center gap-2">
      <span style="font-size:22px;filter:drop-shadow(0 0 8px rgba(132,204,22,.6))">⚡</span>
      <span class="font-bold text-lg" style="color:#bef264">EV-Wash 관리자</span>
    </div>
  </div>
  <nav class="p-3 space-y-1">
    <a href="/admin" class="nav-item"><i class="fas fa-chart-bar w-5"></i>대시보드</a>
    <a href="/admin/applications" class="nav-item"><i class="fas fa-file-alt w-5"></i>신청 심사 <span id="pendingBadge" class="text-xs px-1.5 rounded-full ml-auto hidden" style="background:#ef4444;color:#fff"></span></a>
    <a href="/admin/stations" class="nav-item"><i class="fas fa-gas-pump w-5"></i>주유소 관리</a>
    <a href="/admin/users" class="nav-item"><i class="fas fa-users w-5"></i>회원 관리</a>
    <a href="/admin/payments" class="nav-item"><i class="fas fa-credit-card w-5"></i>결제 내역</a>
    <a href="/admin/settlement" class="nav-item"><i class="fas fa-money-bill-wave w-5"></i>정산 관리</a>
    <a href="/admin/settings" class="nav-item"><i class="fas fa-cog w-5"></i>설정</a>
  </nav>
  <div class="absolute bottom-0 left-0 right-0 p-4" style="border-top:1px solid rgba(255,255,255,.07)">
    <button onclick="doAdminLogout()" style="color:rgba(255,255,255,.4);font-size:13px;" class="w-full text-left bg-transparent border-none cursor-pointer">
      <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
    </button>
  </div>
</aside>
<button id="menuToggle" onclick="toggleSidebar()" class="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg flex items-center justify-center"
  style="background:#0a1628;color:#bef264;border:1px solid rgba(132,204,22,.3)">
  <i class="fas fa-bars"></i>
</button>
<div id="overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden md:hidden" onclick="toggleSidebar()"></div>

<style>
  .nav-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:8px; color:rgba(255,255,255,.45); text-decoration:none; font-size:14px; transition:all .15s; }
  .nav-item:hover { background:rgba(132,204,22,.1); color:#bef264; }
  .nav-item.active { background:rgba(132,204,22,.15); color:#bef264; border-left:3px solid #84cc16; }
  @media(min-width:768px) { .main-content { margin-left: 224px; } }
  .main-content { background:#f0ffd4; min-height:100vh; }
  .admin-card { background:#fff; border-radius:16px; padding:16px; box-shadow:0 1px 8px rgba(10,22,40,.07); }
  .stat-icon-navy { background:rgba(26,47,94,.1); color:#1a2f5e; }
  .stat-icon-lime { background:rgba(132,204,22,.12); color:#65a30d; }
  .stat-icon-amber { background:#fef3c7; color:#d97706; }
  .stat-icon-red { background:#fee2e2; color:#ef4444; }
  .quick-card { background:#fff; border-radius:14px; padding:14px; display:flex; align-items:center; gap:12px; text-decoration:none; border:1.5px solid transparent; transition:all .15s; box-shadow:0 1px 4px rgba(10,22,40,.06); }
  .quick-card:hover { border-color:#84cc16; box-shadow:0 2px 12px rgba(132,204,22,.15); }
</style>
<script>
function toggleSidebar() {
  const sb = document.getElementById('adminSidebar');
  const ov = document.getElementById('overlay');
  const open = sb.style.transform === 'translateX(0px)';
  sb.style.transform = open ? '' : 'translateX(0px)';
  ov.classList.toggle('hidden', open);
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-item').forEach(a => {
    if (location.pathname === a.getAttribute('href') || (a.getAttribute('href') !== '/admin' && location.pathname.startsWith(a.getAttribute('href')))) {
      a.classList.add('active');
    }
  });
});
function doAdminLogout() {
  showDialog({ icon:'👋', title:'로그아웃', msg:'로그아웃 하시겠습니까?', confirmText:'로그아웃', confirmClass:'btn-danger', onConfirm: logout });
}
</script>
`
