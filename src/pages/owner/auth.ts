// 사장님 로그인 페이지
import { htmlPage } from '../layout'

export function ownerLoginPage(kakaoClientId = '', naverClientId = ''): string {
  return htmlPage('사장님 로그인', `
<div class="min-h-screen px-5 flex flex-col justify-center" style="padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);background:#0a1628">
  <div class="w-full max-w-sm mx-auto">
    <!-- 로고 -->
    <div class="text-center mb-10">
      <div style="font-size:44px;margin-bottom:12px">⚡</div>
      <h1 class="text-2xl font-bold" style="color:#bef264">EV-Wash</h1>
    </div>

    <!-- 로그인 폼 -->
    <form onsubmit="doLogin(event)" class="space-y-3">
      <input id="email" type="email" placeholder="이메일" class="input" required autocomplete="email"
        style="background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.35);color:#fff;">
      <input id="pw" type="password" placeholder="비밀번호" class="input" required autocomplete="current-password"
        style="background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.35);color:#fff;">
      <div style="height:8px"></div>
      <button type="submit" id="btn" class="btn btn-primary">로그인</button>
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
<style>.input::placeholder { color: rgba(255,255,255,.6) !important; }</style>
<script>
const KAKAO_CLIENT_ID = '${kakaoClientId}';
const NAVER_CLIENT_ID = '${naverClientId}';
async function doLogin(e) {
  e.preventDefault();
  const btn=document.getElementById('btn'); btn.disabled=true; btn.textContent='로그인 중...';
  try {
    const r=await API.post('/auth/login',{email:document.getElementById('email').value,password:document.getElementById('pw').value});
    if(r.user.userType!=='station_owner')return showToast('사장님 계정으로 로그인해주세요.','error');
    setUser(r.token,r.user); window.location.href='/owner';
  } catch(e){showToast(e.message||'로그인 실패','error');btn.disabled=false;btn.textContent='로그인';}
}
function socialLogin(provider) {
  if(!KAKAO_CLIENT_ID && provider==='kakao'){showToast('카카오 로그인이 준비되지 않았습니다.','error');return;}
  if(!NAVER_CLIENT_ID && provider==='naver'){showToast('네이버 로그인이 준비되지 않았습니다.','error');return;}
  const redirect=encodeURIComponent(location.origin+'/api/auth/'+provider+'/callback');
  const url=provider==='kakao'?'https://kauth.kakao.com/oauth/authorize?client_id='+KAKAO_CLIENT_ID+'&redirect_uri='+redirect+'&response_type=code':'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id='+NAVER_CLIENT_ID+'&redirect_uri='+redirect+'&state='+Math.random().toString(36).slice(2);
  window.open(url,'social_login','width=520,height=620');
  window.addEventListener('message',e=>{if(e.data?.type==='social_login'){if(e.data.user?.userType!=='station_owner'){showToast('사장님 계정으로 로그인해주세요.','error');return;}setUser(e.data.token,e.data.user);window.location.href='/owner';}},{once:true});
}
</script>
`)
}
