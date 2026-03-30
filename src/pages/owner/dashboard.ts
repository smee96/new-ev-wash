// 사장님 대시보드 + 주유소 등록 신청 페이지
import { htmlPage } from '../layout'

export function ownerDashboardPage(): string {
  return htmlPage('사장님 대시보드', `
<div class="min-h-screen pb-6">
  <!-- 헤더 -->
  <div class="ev-bg text-white px-5 pb-7" style="padding-top:max(48px,env(safe-area-inset-top))">
    <div class="flex justify-between items-center">
      <div>
        <p class="text-sm opacity-60 mb-0.5" id="ownerName">사장님</p>
        <h1 class="text-2xl font-bold">대시보드</h1>
      </div>
      <button onclick="doLogout()" class="w-10 h-10 rounded-full flex items-center justify-center" style="background:rgba(255,255,255,.15)">
        <i class="fas fa-sign-out-alt text-white"></i>
      </button>
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
    const r=await API.get('/stations/my-applications');
    const apps=r.applications||[];
    const pending=apps.filter(function(a){return a.status==='pending';});
    const rejected=apps.filter(function(a){return a.status==='rejected';});
    const el=document.getElementById('applicationStatus');
    const parts=[];

    // 심사 중인 신청 표시
    if(pending.length){
      const pList=pending.map(function(a){
        return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #fef3c7">'
          +'<i class="fas fa-clock" style="color:#f59e0b;font-size:14px;flex-shrink:0"></i>'
          +'<div><p style="font-size:13px;font-weight:600;color:#1a202c;margin:0">'+a.station_name+'</p>'
          +'<p style="font-size:11px;color:#8e9ab4;margin:2px 0 0">신청일: '+(a.created_at?a.created_at.slice(0,10):'-')+' · 1~2 영업일 소요</p>'
          +'</div></div>';
      }).join('');
      parts.push('<div class="card" style="border-left:4px solid #f59e0b;margin-bottom:12px">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
        +'<i class="fas fa-hourglass-half" style="color:#f59e0b;font-size:16px"></i>'
        +'<p style="font-weight:700;color:#92400e;margin:0">심사 중인 신청 ('+pending.length+'건)</p>'
        +'</div>'+pList+'</div>');
    }

    // 반려된 신청 표시 (승인 여부와 무관하게 항상 표시)
    if(rejected.length){
      const rList=rejected.map(function(a){
        return '<div id="app-item-'+a.id+'" style="background:#fff5f5;border:1px solid #fecaca;border-radius:10px;padding:12px;margin-bottom:8px">'
          +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">'
          +'<span style="font-weight:600;font-size:14px;color:#1a202c">'+a.station_name+'</span>'
          +'<span style="font-size:11px;color:#c0c8d8">'+(a.created_at?a.created_at.slice(0,10):'-')+'</span>'
          +'</div>'
          +'<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:10px">'
          +'<i class="fas fa-exclamation-circle" style="color:#dc2626;font-size:12px;margin-top:2px;flex-shrink:0"></i>'
          +'<p style="font-size:12px;color:#dc2626;margin:0;line-height:1.5">'+(a.reject_reason||'반려 사유가 기록되지 않았습니다.')+'</p>'
          +'</div>'
          +'<div style="display:flex;gap:8px">'
          +'<a href="/owner/apply" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:600;color:#2563eb;text-decoration:none;padding:8px 0;border:1px solid #bfdbfe;border-radius:8px;background:#eff6ff">'
          +'<i class="fas fa-redo" style="font-size:11px"></i>재신청하기</a>'
          +'<button onclick="deleteApplication('+a.id+')" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:600;color:#ef4444;border:1px solid #fecaca;border-radius:8px;background:#fff5f5;padding:8px 0;cursor:pointer">'
          +'<i class="fas fa-trash" style="font-size:11px"></i>삭제</button>'
          +'</div>'
          +'</div>';
      }).join('');
      parts.push('<div class="card" style="border-left:4px solid #ef4444">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'
        +'<i class="fas fa-times-circle" style="color:#ef4444;font-size:18px"></i>'
        +'<p style="font-weight:700;color:#ef4444;margin:0">반려된 신청 ('+rejected.length+'건)</p>'
        +'</div>'
        +'<p style="font-size:12px;color:#8e9ab4;margin-bottom:12px">반려 사유를 확인하고 내용을 수정하여 재신청해주세요.</p>'
        +rList+'</div>');
    }

    el.innerHTML=parts.join('');
  } catch(err){
    console.error('loadApplications error:', err);
  }
}

async function loadStations() {
  try {
    const r=await API.get('/stations/my-stations'); const list=r.stations||[];
    const el=document.getElementById('stationList');
    if(!list.length){
      el.innerHTML='<div class="card text-center py-12"><i class="fas fa-gas-pump text-5xl mb-4" style="color:#dde3ef"></i><p class="mb-1 font-medium" style="color:#4a5568">등록된 주유소가 없습니다</p><p class="text-sm mb-5" style="color:#8e9ab4">주유소를 등록하여 쿠폰을 판매하세요</p><a href="/owner/apply" class="btn btn-primary" style="width:auto;display:inline-block;padding:13px 28px">주유소 등록 신청</a></div>';
      return;
    }
    el.innerHTML='<h2 class="section-title">내 주유소</h2>'
      +list.map(function(s){
        const canDelete=(s.total_purchases===0||s.total_purchases==='0');
        return '<div id="station-item-'+s.id+'" class="card mb-3 fade-in" style="border:1px solid #eef1f7">'
          +'<a href="/owner/stations/'+s.id+'" style="text-decoration:none;display:block">'
          +'<div class="flex items-center justify-between">'
          +'<div class="flex-1 min-w-0">'
          +'<div class="flex items-center gap-2 mb-1">'
          +'<h3 class="font-semibold truncate" style="color:#1a202c">'+s.station_name+'</h3>'
          +(s.is_closed?'<span class="badge badge-red flex-shrink-0">폐업</span>':s.is_active?'<span class="badge badge-green flex-shrink-0">운영중</span>':'<span class="badge badge-gray flex-shrink-0">비활성</span>')
          +'</div>'
          +'<p class="text-xs truncate" style="color:#8e9ab4">'+s.address+'</p>'
          +'<div class="flex gap-4 mt-1.5 text-xs" style="color:#8e9ab4">'
          +'<span>쿠폰 <b style="color:#1a2f5e">'+s.coupon_count+'</b>종</span>'
          +'<span>이번달 <b style="color:#1a2f5e">'+s.monthly_usages+'</b>건</span>'
          +'</div>'
          +'</div>'
          +'<i class="fas fa-chevron-right ml-2" style="color:#dde3ef"></i>'
          +'</div>'
          +'</a>'
          +(canDelete
            ?'<div style="margin-top:10px;padding-top:10px;border-top:1px solid #f4f7fb">'
            +'<button onclick="deleteStation('+s.id+')" '
            +'style="width:100%;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:600;color:#ef4444;background:#fff5f5;border:1px solid #fecaca;border-radius:8px;padding:8px 0;cursor:pointer">'
            +'<i class="fas fa-trash" style="font-size:11px"></i>주유소 삭제</button>'
            +'</div>'
            :'')
          +'</div>';
      }).join('')
      +'<a href="/owner/apply" class="btn btn-outline mt-2"><i class="fas fa-plus mr-2"></i>주유소 추가 등록</a>';
  } catch {}
}
function deleteApplication(id) {
  showDialog({
    icon:'', title:'신청 삭제',
    msg:'반려된 신청 내역을 삭제하시겠습니까?',
    confirmText:'삭제', confirmClass:'btn-danger',
    onConfirm: async function() {
      try {
        await API.delete('/stations/my-applications/'+id);
        showToast('삭제되었습니다.');
        var el=document.getElementById('app-item-'+id);
        if(el){ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(function(){loadApplications();},300); }
      } catch(e){ showToast(e.message||'삭제 실패','error'); }
    }
  });
}

function deleteStation(id) {
  var nameEl=document.querySelector('#station-item-'+id+' h3');
  var name=nameEl?nameEl.textContent:'이 주유소';
  showDialog({
    icon:'', title:'주유소 삭제',
    msg:name+' 주유소를 삭제하시겠습니까?<br><span style="font-size:12px;color:#8e9ab4">등록된 쿠폰도 함께 삭제됩니다.</span>',
    confirmText:'삭제', confirmClass:'btn-danger',
    onConfirm: async function() {
      try {
        await API.delete('/stations/my-stations/'+id);
        showToast('주유소가 삭제되었습니다.');
        var el=document.getElementById('station-item-'+id);
        if(el){ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(function(){loadStations();},300); }
      } catch(e){ showToast(e.message||'삭제 실패','error'); }
    }
  });
}

function doLogout() {
  showDialog({ icon:'👋', title:'로그아웃', msg:'로그아웃 하시겠습니까?', confirmText:'로그아웃', confirmClass:'btn-danger', onConfirm: logout });
}
</script>
`)
}

export function ownerApplyPage(): string {
  return htmlPage('주유소 등록 신청', `
<div class="min-h-screen pb-10">
  <div class="page-header">
    <button onclick="history.back()" class="back-btn"><i class="fas fa-arrow-left"></i></button>
    <span class="page-header-title">주유소 등록 신청</span>
  </div>
  <form onsubmit="doApply(event)" class="p-4 space-y-4">
    <!-- 기본 정보 -->
    <div class="card">
      <h3 class="font-semibold mb-3" style="color:#1a2f5e">기본 정보</h3>
      <div class="space-y-3">
        <input id="station_name" type="text" placeholder="주유소명" class="input" required>
        <div>
          <div class="flex gap-2">
            <input id="postcode" type="text" placeholder="우편번호" class="input" readonly
              style="flex:0 0 110px;background:#f4f7fb;color:#4a5568;cursor:default;">
            <button type="button" onclick="openAddrSearch()" class="btn btn-primary flex-1" style="white-space:nowrap;">
              <i class="fas fa-search mr-1.5"></i>주소 검색
            </button>
          </div>
          <input id="address" type="text" placeholder="도로명 주소 (검색 후 자동 입력)" class="input mt-2"
            readonly required style="background:#f4f7fb;color:#1a202c;cursor:default;">
          <input id="address_detail" type="text" placeholder="상세주소 (동·호수 등)" class="input mt-2">
        </div>
        <label class="text-xs mb-1.5 block" style="color:#4a5568">전화번호 <span style="color:#ef4444">*</span></label>
        <input id="phone" type="tel" placeholder="02-1234-5678" class="input" required
          oninput="formatPhone(this)" maxlength="13" inputmode="numeric">
        <div>
          <label class="text-xs mb-1.5 block" style="color:#4a5568">세차기 유형</label>
          <select id="car_wash_type" class="input">
            <option value="automatic">🚗 자동 세차기</option>
            <option value="self">💧 셀프 세차</option>
            <option value="both">🚗 자동 + 셀프</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 사업자 정보 -->
    <div class="card">
      <h3 class="font-semibold mb-3" style="color:#1a2f5e">사업자 정보</h3>
      <div class="space-y-3">
        <input id="business_reg_number" type="text" placeholder="사업자등록번호" class="input" required>
        <div>
          <label class="text-xs mb-1.5 block" style="color:#4a5568">사업자등록증 사진</label>
          <input id="biz_file" type="file" accept="image/*,.pdf" class="input" style="padding:12px">
        </div>
      </div>
    </div>

    <!-- 정산 계좌 -->
    <div class="card">
      <h3 class="font-semibold mb-3" style="color:#1a2f5e">정산 계좌</h3>
      <div class="space-y-3">
        <input id="bank_name" type="text" placeholder="은행명" class="input" required>
        <input id="account_number" type="text" placeholder="계좌번호" class="input" required>
        <input id="account_holder" type="text" placeholder="예금주명" class="input" required>
        <div>
          <label class="text-xs mb-1.5 block" style="color:#4a5568">통장 사본</label>
          <input id="acc_file" type="file" accept="image/*,.pdf" class="input" style="padding:12px">
        </div>
      </div>
    </div>

    <p class="text-xs text-center py-1" style="color:#8e9ab4">승인까지 1~2 영업일 소요</p>
    <button type="submit" id="submitBtn" class="btn btn-primary">신청하기</button>
  </form>
</div>
<script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
<script>
window.addEventListener('DOMContentLoaded',()=>requireAuth('station_owner'));

function formatPhone(input) {
  let v = input.value.replace(/[^0-9]/g, '').substring(0, 11);
  if (v.length < 4) input.value = v;
  else if (v.length < 8) input.value = v.slice(0,3) + '-' + v.slice(3);
  else input.value = v.slice(0,3) + '-' + v.slice(3,7) + '-' + v.slice(7);
}

function openAddrSearch() {
  new daum.Postcode({
    oncomplete: function(data) {
      const addr = data.roadAddress || data.jibunAddress;
      document.getElementById('postcode').value = data.zonecode;
      document.getElementById('address').value = addr;
      document.getElementById('address_detail').focus();
    },
    width: '100%',
    height: '100%',
    maxSuggestItems: 5
  }).open({ autoClose: true });
}

async function uploadFile(file) {
  if(!file)return null;
  const fd=new FormData(); fd.append('file',file);
  const res=await fetch('/api/stations/upload',{method:'POST',headers:{Authorization:'Bearer '+localStorage.getItem('ev_token')},body:fd});
  if(!res.ok)throw new Error('파일 업로드 실패');
  return (await res.json()).key;
}
async function doApply(e) {
  e.preventDefault();
  if (!document.getElementById('address').value) {
    showToast('주소 검색 버튼을 눌러 주소를 입력해주세요.', 'error');
    return;
  }
  const phoneRaw = document.getElementById('phone').value.replace(/[^0-9]/g, '');
  if (!phoneRaw || phoneRaw.length < 9) {
    showToast('전화번호를 입력해주세요.', 'error');
    return;
  }
  const btn=document.getElementById('submitBtn'); btn.disabled=true; btn.textContent='제출 중...';
  try {
    const [bizKey,accKey]=await Promise.all([uploadFile(document.getElementById('biz_file').files[0]),uploadFile(document.getElementById('acc_file').files[0])]);
    await API.post('/stations/apply',{
      station_name: document.getElementById('station_name').value,
      address: document.getElementById('address').value,
      address_detail: document.getElementById('address_detail').value || undefined,
      phone: phoneRaw,
      car_wash_type: document.getElementById('car_wash_type').value,
      business_reg_number: document.getElementById('business_reg_number').value,
      bank_name: document.getElementById('bank_name').value,
      account_number: document.getElementById('account_number').value,
      account_holder: document.getElementById('account_holder').value,
      business_reg_image_key: bizKey || undefined,
      account_image_key: accKey || undefined
    });
    showToast('신청이 접수되었습니다!');
    setTimeout(()=>window.location.href='/owner',1200);
  } catch(e){showToast(e.message||'신청 실패','error');btn.disabled=false;btn.textContent='신청하기';}
}
</script>
`)
}
