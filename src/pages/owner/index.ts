// 사장님 페이지들 - EV-Wash
import { htmlPage } from '../layout'

export function ownerLoginPage(): string {
  return htmlPage('사장님 로그인', `
<div class="min-h-screen px-5 py-10 flex flex-col">
  <div class="text-center mb-8">
    <div class="text-4xl mb-3">⚡</div>
    <h1 class="text-xl font-bold text-gray-800">EV-Wash 사장님</h1>
    <p class="text-gray-400 text-sm mt-1">주유소 관리 대시보드</p>
  </div>
  <form onsubmit="doLogin(event)" class="space-y-4">
    <input id="email" type="email" placeholder="이메일" class="input" required>
    <input id="pw" type="password" placeholder="비밀번호" class="input" required>
    <button type="submit" id="btn" class="btn btn-primary">로그인</button>
  </form>
  <div class="divider my-6">소셜 로그인</div>
  <div class="space-y-3">
    <button onclick="socialLogin('kakao')" class="btn" style="background:#FEE500;color:#3C1E1E"><i class="fas fa-comment mr-2"></i>카카오로 로그인</button>
    <button onclick="socialLogin('naver')" class="btn" style="background:#03C75A;color:#fff"><span class="font-bold mr-1">N</span>네이버로 로그인</button>
  </div>
  <p class="text-center text-sm text-gray-400 mt-6">계정이 없으신가요? <a href="/register" class="ev-green font-semibold">회원가입</a></p>
</div>
<script>
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
  const redirect=encodeURIComponent(location.origin+'/api/auth/'+provider+'/callback');
  const url=provider==='kakao'?'https://kauth.kakao.com/oauth/authorize?client_id=KAKAO_PLACEHOLDER&redirect_uri='+redirect+'&response_type=code':'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=NAVER_PLACEHOLDER&redirect_uri='+redirect+'&state='+Math.random().toString(36).slice(2);
  window.open(url,'social_login','width=520,height=620');
  window.addEventListener('message',e=>{if(e.data?.type==='social_login'){if(e.data.user?.userType!=='station_owner'){showToast('사장님 계정으로 로그인해주세요.','error');return;}setUser(e.data.token,e.data.user);window.location.href='/owner';}},{once:true});
}
</script>
`)
}

export function ownerDashboardPage(): string {
  return htmlPage('사장님 대시보드', `
<div class="min-h-screen pb-6">
  <div class="ev-bg text-white px-5 pt-10 pb-6">
    <div class="flex justify-between items-start">
      <div><p class="text-sm opacity-75" id="ownerName">-</p><h1 class="text-xl font-bold mt-0.5">사장님 대시보드</h1></div>
      <button onclick="if(confirm('로그아웃?'))logout()" class="text-white opacity-75"><i class="fas fa-sign-out-alt"></i></button>
    </div>
  </div>
  <div class="p-4 space-y-4">
    <div id="applicationStatus"></div>
    <div id="stationList"></div>
  </div>
</div>
<script>
window.addEventListener('DOMContentLoaded',async()=>{
  const u=requireAuth('station_owner'); if(!u)return;
  document.getElementById('ownerName').textContent=u.name+'님';
  await Promise.all([loadApplications(),loadStations()]);
});
async function loadApplications() {
  try {
    const r=await API.get('/stations/my-applications'); const apps=r.applications||[];
    const pending=apps.filter(a=>a.status==='pending');
    const rejected=apps.filter(a=>a.status==='rejected');
    const el=document.getElementById('applicationStatus');
    if(pending.length){el.innerHTML='<div class="card border-l-4 border-amber-400"><div class="flex items-center gap-2"><i class="fas fa-clock text-amber-400"></i><div><p class="font-semibold text-gray-800">심사 중</p><p class="text-xs text-gray-400">'+pending[0].station_name+' - 심사까지 1~2 영업일 소요</p></div></div></div>';}
    else if(rejected.length&&!apps.find(a=>a.status==='approved')){el.innerHTML='<div class="card border-l-4 border-red-400"><p class="font-semibold text-red-600 mb-1">신청이 반려되었습니다</p><p class="text-sm text-gray-600">'+(rejected[0].reject_reason||'')+'</p><a href="/owner/apply" class="btn btn-primary mt-3">재신청하기</a></div>';}
  } catch {}
}
async function loadStations() {
  try {
    const r=await API.get('/stations/my-stations'); const list=r.stations||[];
    const el=document.getElementById('stationList');
    if(!list.length){el.innerHTML='<div class="card text-center py-10"><i class="fas fa-gas-pump text-4xl text-gray-200 mb-3"></i><p class="text-gray-500 mb-4">등록된 주유소가 없습니다</p><a href="/owner/apply" class="btn btn-primary" style="width:auto;padding:12px 28px">주유소 등록 신청</a></div>';return;}
    el.innerHTML='<h2 class="section-title">내 주유소</h2>'+list.map(s=>'<a href="/owner/stations/'+s.id+'" class="card block mb-3 fade-in"><div class="flex items-start justify-between"><div class="flex-1"><div class="flex items-center gap-2"><h3 class="font-semibold text-gray-800">'+s.station_name+'</h3>'+(s.is_closed?'<span class="badge badge-red">폐업</span>':s.is_active?'<span class="badge badge-green">운영중</span>':'<span class="badge badge-gray">비활성</span>')+'</div><p class="text-xs text-gray-400 mt-1">'+s.address+'</p><div class="flex gap-4 mt-2 text-xs text-gray-500"><span>쿠폰 <b>'+s.coupon_count+'</b>종</span><span>이번달 <b>'+s.monthly_usages+'</b>건</span></div></div><i class="fas fa-chevron-right text-gray-200 mt-1"></i></div></a>').join('')
    +'<a href="/owner/apply" class="btn btn-outline"><i class="fas fa-plus mr-2"></i>주유소 추가 등록</a>';
  } catch {}
}
</script>
`)
}

export function ownerApplyPage(): string {
  return htmlPage('주유소 등록 신청', `
<div class="min-h-screen pb-8">
  <div class="page-header">
    <button onclick="history.back()" class="text-gray-500 w-8"><i class="fas fa-arrow-left"></i></button>
    <h1 class="font-bold text-gray-800">주유소 등록 신청</h1>
  </div>
  <form onsubmit="doApply(event)" class="p-4 space-y-4">
    <div class="card">
      <h3 class="font-semibold text-gray-700 mb-3">기본 정보</h3>
      <div class="space-y-3">
        <input id="station_name" type="text" placeholder="주유소명" class="input" required>
        <input id="address" type="text" placeholder="주소" class="input" required>
        <input id="address_detail" type="text" placeholder="상세주소 (선택)" class="input">
        <input id="phone" type="tel" placeholder="주유소 전화번호 (선택)" class="input">
        <div><label class="text-xs text-gray-500 mb-1 block">세차기 유형</label>
          <select id="car_wash_type" class="input">
            <option value="automatic">자동 세차기</option>
            <option value="self">셀프 세차</option>
            <option value="both">자동 + 셀프</option>
          </select></div>
      </div>
    </div>
    <div class="card">
      <h3 class="font-semibold text-gray-700 mb-3">사업자 정보</h3>
      <div class="space-y-3">
        <input id="business_reg_number" type="text" placeholder="사업자등록번호" class="input" required>
        <div><label class="text-xs text-gray-500 mb-1 block">사업자등록증 사진</label>
          <input id="biz_file" type="file" accept="image/*,.pdf" class="input" style="padding:10px"></div>
      </div>
    </div>
    <div class="card">
      <h3 class="font-semibold text-gray-700 mb-3">정산 계좌</h3>
      <div class="space-y-3">
        <input id="bank_name" type="text" placeholder="은행명" class="input" required>
        <input id="account_number" type="text" placeholder="계좌번호" class="input" required>
        <input id="account_holder" type="text" placeholder="예금주명" class="input" required>
        <div><label class="text-xs text-gray-500 mb-1 block">통장 사본</label>
          <input id="acc_file" type="file" accept="image/*,.pdf" class="input" style="padding:10px"></div>
      </div>
    </div>
    <p class="text-xs text-gray-400 text-center">승인까지 1~2 영업일 소요 · 승인 후 이메일 안내</p>
    <button type="submit" id="submitBtn" class="btn btn-primary">신청하기</button>
  </form>
</div>
<script>
window.addEventListener('DOMContentLoaded',()=>requireAuth('station_owner'));
async function uploadFile(file) {
  if(!file)return null;
  const fd=new FormData(); fd.append('file',file);
  const res=await fetch('/api/stations/upload',{method:'POST',headers:{Authorization:'Bearer '+localStorage.getItem('ev_token')},body:fd});
  if(!res.ok)throw new Error('파일 업로드 실패');
  return (await res.json()).key;
}
async function doApply(e) {
  e.preventDefault();
  const btn=document.getElementById('submitBtn'); btn.disabled=true; btn.textContent='제출 중...';
  try {
    const [bizKey,accKey]=await Promise.all([uploadFile(document.getElementById('biz_file').files[0]),uploadFile(document.getElementById('acc_file').files[0])]);
    await API.post('/stations/apply',{station_name:document.getElementById('station_name').value,address:document.getElementById('address').value,address_detail:document.getElementById('address_detail').value||undefined,phone:document.getElementById('phone').value||undefined,car_wash_type:document.getElementById('car_wash_type').value,business_reg_number:document.getElementById('business_reg_number').value,bank_name:document.getElementById('bank_name').value,account_number:document.getElementById('account_number').value,account_holder:document.getElementById('account_holder').value,business_reg_image_key:bizKey||undefined,account_image_key:accKey||undefined});
    showToast('신청이 접수되었습니다!');
    setTimeout(()=>window.location.href='/owner',1200);
  } catch(e){showToast(e.message||'신청 실패','error');btn.disabled=false;btn.textContent='신청하기';}
}
</script>
`)
}

export function ownerStationPage(): string {
  return htmlPage('주유소 관리', `
<div class="min-h-screen pb-6">
  <div class="page-header">
    <button onclick="history.back()" class="text-gray-500 w-8"><i class="fas fa-arrow-left"></i></button>
    <h1 id="pageTitle" class="font-bold text-gray-800">주유소 관리</h1>
  </div>
  <div class="bg-white border-b border-gray-100 flex">
    <button onclick="showTab('coupons')" id="tab_coupons" class="flex-1 py-3 text-sm font-medium border-b-2 border-green-500 text-green-600">쿠폰 관리</button>
    <button onclick="showTab('qr')" id="tab_qr" class="flex-1 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400">QR 코드</button>
    <button onclick="showTab('usage')" id="tab_usage" class="flex-1 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400">사용내역</button>
    <button onclick="showTab('settlement')" id="tab_settlement" class="flex-1 py-3 text-sm font-medium border-b-2 border-transparent text-gray-400">정산</button>
  </div>
  <div class="p-4">
    <div id="tab_coupons_content"></div>
    <div id="tab_qr_content" class="hidden"></div>
    <div id="tab_usage_content" class="hidden"></div>
    <div id="tab_settlement_content" class="hidden"></div>
  </div>
</div>

<div id="addCouponModal" class="modal-bg hidden" onclick="closeCouponModal()">
  <div class="modal" onclick="event.stopPropagation()">
    <h3 class="font-bold text-gray-800 mb-4">쿠폰 추가</h3>
    <div class="space-y-3">
      <input id="c_title" type="text" placeholder="쿠폰명 (예: 기본 세차 3회권)" class="input">
      <input id="c_desc" type="text" placeholder="설명 (선택)" class="input">
      <input id="c_orig" type="number" placeholder="정가 (원)" class="input" min="1000">
      <input id="c_disc" type="number" placeholder="판매가 (원)" class="input" min="100">
      <div><label class="text-xs text-gray-500 mb-1 block">이용 횟수 (1~10회)</label>
        <select id="c_count" class="input"><option value="1">1회</option><option value="2">2회</option><option value="3">3회</option><option value="4">4회</option><option value="5">5회</option><option value="6">6회</option><option value="7">7회</option><option value="8">8회</option><option value="9">9회</option><option value="10">10회</option></select></div>
      <input id="c_stock" type="number" placeholder="판매 수량 (비워두면 무제한)" class="input" min="1">
    </div>
    <div class="flex gap-3 mt-4">
      <button onclick="closeCouponModal()" class="btn btn-outline" style="flex:1">취소</button>
      <button onclick="saveCoupon()" class="btn btn-primary" style="flex:1">등록</button>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"></script>
<script>
const stationId=location.pathname.split('/')[3];
window.addEventListener('DOMContentLoaded',async()=>{
  requireAuth('station_owner');
  try{const r=await API.get('/stations/my-stations/'+stationId);document.getElementById('pageTitle').textContent=r.station.station_name;}catch{}
  showTab('coupons');
});
function showTab(tab) {
  ['coupons','qr','usage','settlement'].forEach(t=>{
    document.getElementById('tab_'+t).className='flex-1 py-3 text-sm font-medium border-b-2 '+(t===tab?'border-green-500 text-green-600':'border-transparent text-gray-400');
    document.getElementById('tab_'+t+'_content').classList.toggle('hidden',t!==tab);
  });
  if(tab==='coupons')loadCoupons();
  else if(tab==='qr')loadQR();
  else if(tab==='usage')loadUsages();
  else if(tab==='settlement')loadSettlements();
}
async function loadCoupons() {
  const el=document.getElementById('tab_coupons_content');
  el.innerHTML='<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-green-400"></i></div>';
  try {
    const r=await API.get('/coupons/owner/stations/'+stationId+'/coupons'); const coupons=r.coupons||[];
    el.innerHTML='<button onclick="document.getElementById(\'addCouponModal\').classList.remove(\'hidden\')" class="btn btn-primary mb-4"><i class="fas fa-plus mr-2"></i>쿠폰 추가</button>'
    +(coupons.length?coupons.map(c=>'<div class="card mb-3"><div class="flex justify-between items-start"><div><h3 class="font-semibold text-gray-800">'+c.title+'</h3>'+(c.description?'<p class="text-xs text-gray-400">'+c.description+'</p>':'')+'</div><label class="relative inline-flex items-center cursor-pointer ml-2"><input type="checkbox" '+(c.is_active?'checked':'')+' onchange="toggleCoupon('+c.id+',this.checked)" class="sr-only peer"><div class="w-10 h-5 bg-gray-200 peer-checked:bg-green-500 rounded-full peer transition-all"></div></label></div><div class="flex items-baseline gap-2 mt-2"><span class="text-lg font-bold text-green-600">'+formatPrice(c.discount_price)+'</span><span class="text-sm text-gray-300 line-through">'+formatPrice(c.original_price)+'</span><span class="badge badge-red">'+Math.round((1-c.discount_price/c.original_price)*100)+'%</span></div><p class="text-xs text-gray-400 mt-1">'+c.wash_count+'회권 · 판매 '+(c.active_purchases||0)+'건</p></div>').join('')
    :'<div class="card text-center py-10 text-gray-400">등록된 쿠폰이 없습니다</div>');
  } catch { el.innerHTML='<div class="card text-center py-8 text-red-400">불러올 수 없습니다</div>'; }
}
async function toggleCoupon(id,active) {
  try{await API.patch('/coupons/owner/coupons/'+id,{is_active:active?1:0});showToast(active?'활성화되었습니다.':'비활성화되었습니다.');}catch(e){showToast(e.message,'error');loadCoupons();}
}
function closeCouponModal(){document.getElementById('addCouponModal').classList.add('hidden');}
async function saveCoupon() {
  const orig=parseInt(document.getElementById('c_orig').value),disc=parseInt(document.getElementById('c_disc').value),stock=document.getElementById('c_stock').value;
  if(disc>=orig)return showToast('판매가는 정가보다 낮아야 합니다.','error');
  try {
    await API.post('/coupons/owner/stations/'+stationId+'/coupons',{title:document.getElementById('c_title').value,description:document.getElementById('c_desc').value||undefined,original_price:orig,discount_price:disc,wash_count:parseInt(document.getElementById('c_count').value),total_stock:stock?parseInt(stock):undefined});
    closeCouponModal(); showToast('쿠폰이 등록되었습니다!'); loadCoupons();
  } catch(e){showToast(e.message,'error');}
}
async function loadQR() {
  const el=document.getElementById('tab_qr_content');
  try {
    const r=await API.get('/stations/my-stations/'+stationId+'/qr');
    el.innerHTML='<div class="card text-center"><h3 class="font-bold text-gray-800 mb-1">'+r.station_name+'</h3><p class="text-xs text-gray-400 mb-4">고객이 세차 후 이 QR 코드를 스캔합니다</p><canvas id="qrCanvas" class="mx-auto mb-4" style="border-radius:12px"></canvas><p class="text-xs text-gray-300 break-all">'+r.qr_code+'</p><button onclick="downloadQR()" class="btn btn-outline mt-4"><i class="fas fa-download mr-2"></i>QR 다운로드</button></div>';
    QRCode.toCanvas(document.getElementById('qrCanvas'),r.qr_code,{width:220,margin:2});
  } catch { el.innerHTML='<div class="card text-center py-8 text-red-400">QR 코드를 불러올 수 없습니다</div>'; }
}
function downloadQR(){const c=document.getElementById('qrCanvas');const a=document.createElement('a');a.download='ev-wash-qr.png';a.href=c.toDataURL();a.click();}
async function loadUsages() {
  const el=document.getElementById('tab_usage_content');
  el.innerHTML='<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-green-400"></i></div>';
  try {
    const r=await API.get('/stations/my-stations/'+stationId+'/usages'); const usages=r.usages||[];
    el.innerHTML='<p class="text-xs text-gray-400 mb-3">총 '+r.total+'건</p>'+(usages.length?usages.map(u=>'<div class="card mb-2"><div class="flex justify-between items-center"><div><p class="text-sm font-medium text-gray-800">'+u.coupon_title+'</p><p class="text-xs text-gray-400">'+u.user_name+' · '+formatDateTime(u.used_at)+'</p></div><div class="text-right"><p class="font-semibold text-gray-800">'+formatPrice(u.unit_price)+'</p><span class="badge '+(u.settled?'badge-gray':'badge-amber')+'">'+(u.settled?'정산완료':'정산대기')+'</span></div></div></div>').join(''):'<div class="card text-center py-8 text-gray-400">사용 내역이 없습니다</div>');
  } catch { el.innerHTML='<div class="card text-center py-8 text-red-400">불러올 수 없습니다</div>'; }
}
async function loadSettlements() {
  const el=document.getElementById('tab_settlement_content');
  el.innerHTML='<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-green-400"></i></div>';
  try {
    const r=await API.get('/stations/my-stations/'+stationId+'/settlements'); const list=r.settlements||[];
    el.innerHTML='<div class="card mb-4 bg-green-50 border border-green-100"><p class="text-xs text-gray-500 mb-1">정산 대기 금액 (오늘 이전)</p><p class="text-2xl font-bold text-green-600">'+formatPrice(r.pending_amount)+'</p><p class="text-xs text-gray-400 mt-1">플랫폼 수수료 15% 차감 후 익일 지급</p></div>'
    +'<h3 class="section-title">정산 내역</h3>'+(list.length?list.map(s=>'<div class="card mb-2"><div class="flex justify-between items-start"><div><p class="font-medium text-gray-800">'+s.settlement_date+'</p><p class="text-xs text-gray-400">'+s.usage_count+'건 · 수수료 '+formatPrice(s.platform_fee)+'</p></div><div class="text-right"><p class="font-bold text-gray-800">'+formatPrice(s.net_amount)+'</p><span class="badge '+(s.status==='completed'?'badge-green':'badge-amber')+'">'+(s.status==='completed'?'지급완료':'처리중')+'</span></div></div></div>').join(''):'<div class="card text-center py-8 text-gray-400">정산 내역이 없습니다</div>');
  } catch { el.innerHTML='<div class="card text-center py-8 text-red-400">불러올 수 없습니다</div>'; }
}
</script>
`)
}
