// 고객 마이페이지, 결제 결과 페이지
import { htmlPage } from '../layout'

export function myPage(): string {
  return htmlPage('마이페이지', `
<div class="min-h-screen pb-24">
  <!-- 프로필 헤더 -->
  <div class="ev-bg text-white px-5 pb-8" style="padding-top:max(48px,env(safe-area-inset-top))">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 rounded-full flex items-center justify-center" style="background:rgba(255,255,255,.15)">
        <i class="fas fa-user text-2xl"></i>
      </div>
      <div>
        <p class="font-bold text-xl" id="myName">-</p>
        <p class="text-sm opacity-60" id="myEmail">-</p>
      </div>
    </div>
  </div>

  <div class="p-4 space-y-3 -mt-2">
    <!-- 계정 메뉴 -->
    <div class="card">
      <h3 class="font-semibold text-xs mb-3 uppercase tracking-wide" style="color:#8e9ab4">계정</h3>
      <a href="/my-coupons" class="flex items-center justify-between py-3.5 border-b" style="border-color:#f4f7fb">
        <span class="text-base" style="color:#1a202c"><i class="fas fa-ticket-alt w-6 mr-2" style="color:#84cc16"></i>내 쿠폰</span>
        <i class="fas fa-chevron-right text-sm" style="color:#dde3ef"></i>
      </a>
      <a href="/my-history" class="flex items-center justify-between py-3.5 border-b" style="border-color:#f4f7fb">
        <span class="text-base" style="color:#1a202c"><i class="fas fa-receipt w-6 mr-2" style="color:#84cc16"></i>이용 내역</span>
        <i class="fas fa-chevron-right text-sm" style="color:#dde3ef"></i>
      </a>
      <button onclick="showProfileEditModal()" class="w-full flex items-center justify-between py-3.5 border-b" style="border-color:#f4f7fb">
        <span class="text-base" style="color:#1a202c"><i class="fas fa-user-edit w-6 mr-2" style="color:#84cc16"></i>프로필 수정</span>
        <i class="fas fa-chevron-right text-sm" style="color:#dde3ef"></i>
      </button>
      <div id="pwSection">
        <button onclick="showPwChangeModal()" class="w-full flex items-center justify-between py-3.5">
          <span class="text-base" style="color:#1a202c"><i class="fas fa-lock w-6 mr-2" style="color:#84cc16"></i>비밀번호 변경</span>
          <i class="fas fa-chevron-right text-sm" style="color:#dde3ef"></i>
        </button>
      </div>
    </div>

    <!-- 고객센터 -->
    <div class="card">
      <h3 class="font-semibold text-xs mb-3 uppercase tracking-wide" style="color:#8e9ab4">고객센터</h3>
      <a href="mailto:bensmee96@gmail.com" class="flex items-center justify-between py-3.5">
        <span class="text-base" style="color:#1a202c"><i class="fas fa-envelope w-6 mr-2" style="color:#84cc16"></i>이메일 문의</span>
        <i class="fas fa-chevron-right text-xs" style="color:#dde3ef"></i>
      </a>
    </div>

    <!-- 약관 -->
    <div class="card">
      <h3 class="font-semibold text-xs mb-3 uppercase tracking-wide" style="color:#8e9ab4">약관</h3>
      <a href="/terms" class="flex items-center justify-between py-3.5 border-b" style="border-color:#f4f7fb">
        <span class="text-base" style="color:#1a202c"><i class="fas fa-file-alt w-6 mr-2" style="color:#84cc16"></i>서비스 이용약관</span>
        <i class="fas fa-chevron-right text-sm" style="color:#dde3ef"></i>
      </a>
      <a href="/privacy" class="flex items-center justify-between py-3.5">
        <span class="text-base" style="color:#1a202c"><i class="fas fa-shield-alt w-6 mr-2" style="color:#84cc16"></i>개인정보처리방침</span>
        <i class="fas fa-chevron-right text-sm" style="color:#dde3ef"></i>
      </a>
    </div>

    <button onclick="doLogout()" class="btn btn-gray mt-2" style="color:#8e9ab4;border-color:#eef1f7">로그아웃</button>
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
        <label class="text-xs mb-1.5 block" style="color:#4a5568">이름</label>
        <input id="editName" type="text" class="input" placeholder="이름">
      </div>
      <div>
        <label class="text-xs mb-1.5 block" style="color:#4a5568">전화번호</label>
        <input id="editPhone" type="tel" class="input" placeholder="010-0000-0000"
          oninput="editPhoneFmt(this)" maxlength="13" inputmode="numeric">
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
function phoneToDisplay(p) {
  if (!p) return '';
  const v = p.replace(/[^0-9]/g, '');
  if (v.length < 4) return v;
  if (v.length < 8) return v.slice(0,3) + '-' + v.slice(3);
  return v.slice(0,3) + '-' + v.slice(3,7) + '-' + v.slice(7);
}
function showProfileEditModal() {
  document.getElementById('editName').value = _myInfo.name || '';
  document.getElementById('editPhone').value = phoneToDisplay(_myInfo.phone);
  openModal('profileModal');
}
async function saveProfile() {
  const name = document.getElementById('editName').value.trim();
  const phoneRaw = document.getElementById('editPhone').value.replace(/[^0-9]/g, '');
  if (!name) return showToast('이름을 입력해주세요.', 'error');
  try {
    await API.patch('/user/me', { name, phone: phoneRaw || null });
    _myInfo.name = name; _myInfo.phone = phoneRaw;
    document.getElementById('myName').textContent = name;
    const stored = getUser();
    if (stored) { stored.name = name; setUser(localStorage.getItem('ev_token'), stored); }
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
function editPhoneFmt(inp) {
  var raw=inp.value, d=raw.replace(/[^0-9]/g,'').slice(0,11), out;
  if(d.length>7) out=d.slice(0,3)+'-'+d.slice(3,7)+'-'+d.slice(7);
  else if(d.length>3) out=d.slice(0,3)+'-'+d.slice(3);
  else out=d;
  if(raw===out) return;
  var sel=inp.selectionEnd||raw.length;
  var dbc=raw.slice(0,sel).replace(/[^0-9]/g,'').length;
  inp.value=out;
  var cnt=0,pos=out.length;
  for(var i=0;i<out.length;i++){if(out[i]>='0'&&out[i]<='9')cnt++;if(cnt===dbc){pos=i+1;break;}}
  try{inp.setSelectionRange(pos,pos);}catch(e){}
}
</script>
`)
}

export function paymentSuccessPage(): string {
  return htmlPage('결제 완료', `
<div class="min-h-screen flex flex-col items-center justify-center px-5 text-center">
  <div id="content">
    <i class="fas fa-spinner fa-spin text-4xl" style="color:#84cc16"></i>
    <p class="mt-4" style="color:#4a5568">결제 처리 중...</p>
  </div>
</div>
<script>
window.addEventListener('DOMContentLoaded',()=>{
  const p=new URLSearchParams(location.search);
  if(p.get('done')){
    document.getElementById('content').innerHTML='<div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style="background:#f0ffd4"><i class="fas fa-check text-3xl" style="color:#65a30d"></i></div><h2 class="text-2xl font-bold mb-2" style="color:#0a1628">결제 완료!</h2><p class="mb-8" style="color:#8e9ab4">쿠폰이 발급되었습니다</p><a href="/my-coupons" class="btn btn-primary" style="width:auto;display:inline-block;padding:14px 36px">내 쿠폰 보기</a>';
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
  <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style="background:#fee2e2">
    <i class="fas fa-times text-3xl" style="color:#ef4444"></i>
  </div>
  <h2 class="text-xl font-bold mb-2" style="color:#1a202c">결제 실패</h2>
  <p id="reason" class="mb-8" style="color:#8e9ab4">결제가 취소되었거나 오류가 발생했습니다.</p>
  <button onclick="history.back()" class="btn btn-outline" style="width:auto;display:inline-block;padding:14px 36px">돌아가기</button>
</div>
<script>const p=new URLSearchParams(location.search);const reason=p.get('reason');if(reason)document.getElementById('reason').textContent='사유: '+reason;</script>
`)
}
