// 고객 인증 페이지 (로그인, 회원가입)
import { htmlPage } from '../layout'

export function loginPage(kakaoClientId = '', naverClientId = ''): string {
  return htmlPage('로그인', `
<div class="min-h-screen px-5 flex flex-col justify-center" style="padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);background:#0a1628">
  <div class="w-full max-w-sm mx-auto">
    <!-- 로고 -->
    <a href="/" class="block text-center mb-10" style="text-decoration:none">
      <div style="font-size:44px;margin-bottom:12px">⚡</div>
      <h1 class="text-2xl font-bold" style="color:#bef264">EV-Wash</h1>
    </a>

    <!-- 로그인 폼 -->
    <form onsubmit="doLogin(event)" class="space-y-3">
      <input id="email" type="email" placeholder="이메일" class="input" required autocomplete="email"
        style="background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.35);color:#fff;">
      <input id="pw" type="password" placeholder="비밀번호" class="input" required autocomplete="current-password"
        style="background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.35);color:#fff;">
      <div style="height:8px"></div>
      <button type="submit" id="loginBtn" class="btn btn-primary">로그인</button>
    </form>

    <!-- 구분선 -->
    <div class="divider my-6" style="color:rgba(255,255,255,.25)">소셜 로그인</div>

    <!-- 소셜 버튼 -->
    <div class="flex gap-3 justify-center">
      <button onclick="socialLogin('kakao')"
        style="display:flex;align-items:center;gap:7px;background:#FEE500;color:#3C1E1E;border:none;border-radius:10px;padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer;">
        <i class="fas fa-comment" style="font-size:15px"></i>카카오
      </button>
      <button onclick="socialLogin('naver')"
        style="display:flex;align-items:center;gap:7px;background:#03C75A;color:#fff;border:none;border-radius:10px;padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer;">
        <span style="font-weight:800;font-size:15px">N</span>네이버
      </button>
    </div>

    <!-- 회원가입 링크 -->
    <p class="text-center mt-8" style="font-size:14px;color:rgba(255,255,255,.4)">
      계정이 없으신가요? <a href="/register" style="color:#bef264;font-weight:700">회원가입</a>
    </p>
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
// 인풋 placeholder 컬러
document.querySelectorAll('.input').forEach(el => {
  el.addEventListener('focus', () => el.style.borderColor = '#84cc16');
  el.addEventListener('blur', () => el.style.borderColor = 'rgba(255,255,255,.15)');
});
</script>
<style>
.input::placeholder { color: rgba(255,255,255,.6) !important; }
</style>
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
      <!-- 회원 유형 선택 -->
      <div>
        <label class="text-xs font-semibold mb-2 block" style="color:#4a5568">회원 유형 <span style="color:#ef4444">*</span></label>
        <div class="grid grid-cols-2 gap-3">
          <button type="button" id="typeCard_customer" onclick="selectUserType('customer')"
            class="type-card rounded-2xl border-2 p-4 text-center transition-all duration-150 bg-white" style="border-color:#dde3ef">
            <div class="text-2xl mb-1.5">🙋</div>
            <div class="font-semibold text-sm" style="color:#1a202c">일반 고객</div>
            <div class="text-xs mt-0.5" style="color:#8e9ab4">세차 쿠폰 이용</div>
          </button>
          <button type="button" id="typeCard_station_owner" onclick="selectUserType('station_owner')"
            class="type-card rounded-2xl border-2 p-4 text-center transition-all duration-150 bg-white" style="border-color:#dde3ef">
            <div class="text-2xl mb-1.5">🏪</div>
            <div class="font-semibold text-sm" style="color:#1a202c">주유소 사장님</div>
            <div class="text-xs mt-0.5" style="color:#8e9ab4">주유소 등록·관리</div>
          </button>
        </div>
        <p id="typeHint" class="text-xs mt-1.5 hidden" style="color:#ef4444">회원 유형을 선택해주세요.</p>
        <input type="hidden" id="userType" value="">
      </div>
      <input id="name" type="text" placeholder="이름" class="input" required autocomplete="name">
      <input id="email" type="email" placeholder="이메일" class="input" required autocomplete="email">
      <div>
        <input id="phone" type="tel" placeholder="010-1234-5678" class="input" required
          autocomplete="tel" inputmode="numeric" maxlength="13">
        <p id="phoneHint" class="text-xs mt-1.5" style="color:#8e9ab4"></p>
      </div>
      <div>
        <input id="pw" type="password" placeholder="비밀번호 (8자 이상)" class="input" required minlength="8"
          autocomplete="new-password" oninput="checkPw2()">
        <p id="pwHint" class="text-xs mt-1.5 hidden"></p>
      </div>
      <div>
        <input id="pw2" type="password" placeholder="비밀번호 확인" class="input" required
          autocomplete="new-password" oninput="checkPw2()">
        <p id="pw2Hint" class="text-xs mt-1.5 hidden"></p>
      </div>

      <!-- 약관 동의 -->
      <div class="space-y-2 pt-1">
        <label class="text-xs font-semibold block" style="color:#4a5568">약관 동의 <span style="color:#ef4444">*</span></label>

        <!-- 전체 동의 -->
        <label class="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style="background:#f0ffd4;border:1.5px solid #bef264">
          <input type="checkbox" id="agreeAll" onchange="toggleAll(this)" class="w-4 h-4 accent-lime-500" style="accent-color:#84cc16">
          <span class="font-semibold text-sm" style="color:#1a2f5e">전체 동의</span>
        </label>

        <div class="space-y-1 pl-1">
          <!-- 필수 -->
          <label class="flex items-center justify-between gap-2 py-2 px-1 cursor-pointer">
            <div class="flex items-center gap-2">
              <input type="checkbox" id="agreeTerms" onchange="syncAll()" class="w-4 h-4" style="accent-color:#84cc16">
              <span class="text-sm" style="color:#1a202c">서비스 이용약관 동의</span>
              <span class="text-xs px-1.5 py-0.5 rounded" style="background:#fee2e2;color:#ef4444">필수</span>
            </div>
            <a href="/terms" target="_blank" class="text-xs" style="color:#8e9ab4;text-decoration:underline">보기</a>
          </label>
          <label class="flex items-center justify-between gap-2 py-2 px-1 cursor-pointer">
            <div class="flex items-center gap-2">
              <input type="checkbox" id="agreePrivacy" onchange="syncAll()" class="w-4 h-4" style="accent-color:#84cc16">
              <span class="text-sm" style="color:#1a202c">개인정보 수집·이용 동의</span>
              <span class="text-xs px-1.5 py-0.5 rounded" style="background:#fee2e2;color:#ef4444">필수</span>
            </div>
            <a href="/privacy" target="_blank" class="text-xs" style="color:#8e9ab4;text-decoration:underline">보기</a>
          </label>
          <!-- 선택 -->
          <label class="flex items-center justify-between gap-2 py-2 px-1 cursor-pointer">
            <div class="flex items-center gap-2">
              <input type="checkbox" id="agreeMarketing" onchange="syncAll()" class="w-4 h-4" style="accent-color:#84cc16">
              <span class="text-sm" style="color:#1a202c">마케팅·광고 수신 동의</span>
              <span class="text-xs px-1.5 py-0.5 rounded" style="background:#eef1f7;color:#8e9ab4">선택</span>
            </div>
          </label>
          <p class="text-xs pl-6" style="color:#8e9ab4">이벤트, 할인 쿠폰 등 혜택 정보를 받을 수 있습니다.</p>
        </div>
      </div>

      <button type="submit" class="btn btn-primary">가입하기</button>
    </form>
    <p class="text-center text-sm mt-5" style="color:#8e9ab4">이미 계정이 있으신가요? <a href="/login" style="color:#65a30d;font-weight:700">로그인</a></p>
  </div>
</div>
<style>
.type-card { cursor: pointer; -webkit-tap-highlight-color: transparent; }
.type-card:active { transform: scale(0.97); }
.type-card.selected { border-color: #84cc16 !important; background: #f0ffd4 !important; }
.type-card.selected .font-semibold { color: #1a2f5e !important; }
</style>
<script>
function selectUserType(type) {
  document.getElementById('userType').value = type;
  document.querySelectorAll('.type-card').forEach(el => el.classList.remove('selected'));
  document.getElementById('typeCard_' + type).classList.add('selected');
  document.getElementById('typeHint').classList.add('hidden');
}

/* ── 회원가입 전화번호 포맷 ── */
(function(){
  var _busy = false;
  function _fmt(raw) {
    var d = raw.replace(/[^0-9]/g,'').slice(0,11);
    if (d.length > 7) return d.slice(0,3)+'-'+d.slice(3,7)+'-'+d.slice(7);
    if (d.length > 3) return d.slice(0,3)+'-'+d.slice(3);
    return d;
  }
  function _hint(inp, raw) {
    var d = raw.replace(/[^0-9]/g,'').slice(0,11);
    var h = document.getElementById('phoneHint');
    if (!h) return;
    if (!d.length) { h.textContent=''; inp.style.borderColor=''; }
    else if (d.length < 10) { h.textContent='올바른 휴대폰 번호를 입력해주세요.'; h.style.color='#ef4444'; inp.style.borderColor='#ef4444'; }
    else { h.textContent='✓ 확인되었습니다.'; h.style.color='#65a30d'; inp.style.borderColor='#84cc16'; }
  }
  function _apply(inp) {
    if (_busy) return;
    _busy = true;
    var raw = inp.value;
    var out = _fmt(raw);
    if (raw !== out) {
      var sel = inp.selectionEnd || raw.length;
      var dbc = raw.slice(0, sel).replace(/[^0-9]/g,'').length;
      inp.value = out;
      var cnt=0, pos=out.length;
      for (var i=0;i<out.length;i++) { if(out[i]>='0'&&out[i]<='9') cnt++; if(cnt===dbc){pos=i+1;break;} }
      try { inp.setSelectionRange(pos,pos); } catch(e){}
    }
    _hint(inp, out);
    _busy = false;
  }
  document.addEventListener('DOMContentLoaded', function() {
    var inp = document.getElementById('phone');
    if (!inp) return;
    inp.addEventListener('input', function() { _apply(this); });
    inp.addEventListener('paste', function() { var self=this; setTimeout(function(){ _apply(self); }, 0); });
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace') {
        var pos = this.selectionStart;
        if (pos > 0 && this.selectionStart === this.selectionEnd && this.value[pos-1] === '-') {
          e.preventDefault();
          this.value = this.value.slice(0,pos-2) + this.value.slice(pos);
          this.setSelectionRange(pos-2, pos-2);
          _apply(this);
        }
      }
    });
  });
})();

function checkPw2() {
  const pw = document.getElementById('pw').value;
  const pw2 = document.getElementById('pw2').value;
  const pwInput = document.getElementById('pw');
  const pw2Input = document.getElementById('pw2');
  const pwHint = document.getElementById('pwHint');
  const pw2Hint = document.getElementById('pw2Hint');
  if (pw.length > 0 && pw.length < 8) {
    pwHint.textContent = '비밀번호는 8자 이상이어야 합니다.';
    pwHint.style.color = '#ef4444';
    pwHint.classList.remove('hidden');
    pwInput.style.borderColor = '#ef4444';
  } else if (pw.length >= 8) {
    pwHint.textContent = '사용 가능한 비밀번호입니다.';
    pwHint.style.color = '#65a30d';
    pwHint.classList.remove('hidden');
    pwInput.style.borderColor = '#84cc16';
  } else {
    pwHint.classList.add('hidden');
    pwInput.style.borderColor = '';
  }
  if (pw2.length === 0) { pw2Hint.classList.add('hidden'); pw2Input.style.borderColor = ''; return; }
  if (pw === pw2) {
    pw2Hint.textContent = '✓ 비밀번호가 일치합니다.';
    pw2Hint.style.color = '#65a30d';
    pw2Hint.classList.remove('hidden');
    pw2Input.style.borderColor = '#84cc16';
  } else {
    pw2Hint.textContent = '✗ 비밀번호가 일치하지 않습니다.';
    pw2Hint.style.color = '#ef4444';
    pw2Hint.classList.remove('hidden');
    pw2Input.style.borderColor = '#ef4444';
  }
}

/* ── 약관 전체동의 토글 ── */
function toggleAll(cb) {
  ['agreeTerms','agreePrivacy','agreeMarketing'].forEach(id => {
    document.getElementById(id).checked = cb.checked;
  });
}
function syncAll() {
  const all = ['agreeTerms','agreePrivacy','agreeMarketing'].every(id => document.getElementById(id).checked);
  document.getElementById('agreeAll').checked = all;
}

async function doRegister(e) {
  e.preventDefault();
  const userType = document.getElementById('userType').value;
  if (!userType) {
    document.getElementById('typeHint').classList.remove('hidden');
    document.getElementById('typeCard_customer').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  // 전화번호 검증
  const phoneDigits = document.getElementById('phone').value.replace(/[^0-9]/g, '');
  if (phoneDigits.length < 10) {
    showToast('올바른 휴대폰 번호를 입력해주세요.', 'error');
    document.getElementById('phone').focus();
    return;
  }
  // 비밀번호 확인
  if (document.getElementById('pw').value !== document.getElementById('pw2').value) {
    return showToast('비밀번호가 일치하지 않습니다.', 'error');
  }
  // 필수 약관 확인
  if (!document.getElementById('agreeTerms').checked) {
    return showToast('서비스 이용약관에 동의해주세요.', 'error');
  }
  if (!document.getElementById('agreePrivacy').checked) {
    return showToast('개인정보 수집·이용에 동의해주세요.', 'error');
  }
  try {
    const r = await API.post('/auth/register', {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      phone: phoneDigits,
      password: document.getElementById('pw').value,
      userType,
      marketingAgreed: document.getElementById('agreeMarketing').checked
    });
    setUser(r.token, r.user);
    showToast('가입되었습니다!');
    setTimeout(() => window.location.href = r.user.userType === 'station_owner' ? '/owner' : '/home', 800);
  } catch(e) { showToast(e.message || '가입 실패', 'error'); }
}
</script>
`)
}
