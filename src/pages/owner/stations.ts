// 사장님 주유소 목록 페이지
import { htmlPage } from '../layout'

export function ownerStationListPage(): string {
  return htmlPage('내 주유소', `
<div class="min-h-screen pb-24">
  <div class="page-header">
    <span class="page-header-title">내 주유소</span>
    <a href="/owner/apply" class="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" style="background:#f0ffd4">
      <i class="fas fa-plus" style="color:#65a30d;font-size:14px"></i>
    </a>
  </div>

  <div class="p-4">
    <div id="applicationStatus"></div>
    <div id="stationList">
      <div class="card text-center py-12">
        <i class="fas fa-spinner fa-spin text-2xl" style="color:#84cc16"></i>
      </div>
    </div>
  </div>
</div>

<!-- 하단 내비 -->
<nav class="bottom-nav">
  <a href="/owner"><i class="fas fa-home"></i>홈</a>
  <a href="/owner/stations" class="active"><i class="fas fa-gas-pump"></i>주유소</a>
  <a href="/owner/mypage"><i class="fas fa-user"></i>마이</a>
</nav>

<script>
window.addEventListener('DOMContentLoaded', async () => {
  const u = requireAuth('station_owner');
  if (!u) return;
  await Promise.all([loadApplications(), loadStations()]);
});

async function loadApplications() {
  try {
    const r = await API.get('/stations/my-applications');
    const apps = r.applications || [];
    const pending  = apps.filter(a => a.status==='pending');
    const rejected = apps.filter(a => a.status==='rejected');
    const el = document.getElementById('applicationStatus');
    const parts = [];

    if (pending.length) {
      const pList = pending.map(a =>
        '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #fef3c7">'
        +'<i class="fas fa-clock" style="color:#f59e0b;font-size:14px;flex-shrink:0"></i>'
        +'<div><p style="font-size:13px;font-weight:600;color:#1a202c;margin:0">'+a.station_name+'</p>'
        +'<p style="font-size:11px;color:#8e9ab4;margin:2px 0 0">신청일: '+(a.created_at?a.created_at.slice(0,10):'-')+' · 1~2 영업일 소요</p>'
        +'</div></div>'
      ).join('');
      parts.push('<div class="card mb-3" style="border-left:4px solid #f59e0b">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
        +'<i class="fas fa-hourglass-half" style="color:#f59e0b;font-size:16px"></i>'
        +'<p style="font-weight:700;color:#92400e;margin:0">심사 중 ('+pending.length+'건)</p>'
        +'</div>'+pList+'</div>');
    }

    if (rejected.length) {
      const rList = rejected.map(a =>
        '<div id="app-item-'+a.id+'" style="background:#fff5f5;border:1px solid #fecaca;border-radius:10px;padding:12px;margin-bottom:8px">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">'
        +'<span style="font-weight:600;font-size:14px;color:#1a202c">'+a.station_name+'</span>'
        +'<span style="font-size:11px;color:#c0c8d8">'+(a.created_at?a.created_at.slice(0,10):'-')+'</span>'
        +'</div>'
        +'<div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:10px">'
        +'<i class="fas fa-exclamation-circle" style="color:#dc2626;font-size:12px;margin-top:2px;flex-shrink:0"></i>'
        +'<p style="font-size:12px;color:#dc2626;margin:0;line-height:1.5">'+(a.reject_reason||'반려 사유 미기재')+'</p>'
        +'</div>'
        +'<div style="display:flex;gap:8px">'
        +'<a href="/owner/apply" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:600;color:#2563eb;text-decoration:none;padding:8px 0;border:1px solid #bfdbfe;border-radius:8px;background:#eff6ff">'
        +'<i class="fas fa-redo" style="font-size:11px"></i>재신청</a>'
        +'<button onclick="deleteApplication('+a.id+')" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:600;color:#ef4444;border:1px solid #fecaca;border-radius:8px;background:#fff5f5;padding:8px 0;cursor:pointer">'
        +'<i class="fas fa-trash" style="font-size:11px"></i>삭제</button>'
        +'</div></div>'
      ).join('');
      parts.push('<div class="card mb-3" style="border-left:4px solid #ef4444">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'
        +'<i class="fas fa-times-circle" style="color:#ef4444;font-size:18px"></i>'
        +'<p style="font-weight:700;color:#ef4444;margin:0">반려된 신청 ('+rejected.length+'건)</p>'
        +'</div>'
        +'<p style="font-size:12px;color:#8e9ab4;margin-bottom:12px">반려 사유를 확인하고 재신청해주세요.</p>'
        +rList+'</div>');
    }
    el.innerHTML = parts.join('');
  } catch(e) { console.error(e); }
}

async function loadStations() {
  try {
    const r = await API.get('/stations/my-stations');
    const list = r.stations || [];
    const el = document.getElementById('stationList');
    if (!list.length) {
      el.innerHTML = '<div class="card text-center py-12">'
        +'<i class="fas fa-gas-pump text-5xl mb-4" style="color:#dde3ef"></i>'
        +'<p class="mb-1 font-medium" style="color:#4a5568">등록된 주유소가 없습니다</p>'
        +'<p class="text-sm mb-5" style="color:#8e9ab4">주유소를 등록하여 쿠폰을 판매하세요</p>'
        +'<a href="/owner/apply" class="btn btn-primary" style="width:auto;display:inline-block;padding:13px 28px">주유소 등록 신청</a></div>';
      return;
    }
    el.innerHTML = list.map(s => {
      const canDelete = (s.total_purchases===0||s.total_purchases==='0');
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
        +'</div></a>'
        +(canDelete
          ?'<div style="margin-top:10px;padding-top:10px;border-top:1px solid #f4f7fb">'
          +'<button onclick="deleteStation('+s.id+')" style="width:100%;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:600;color:#ef4444;background:#fff5f5;border:1px solid #fecaca;border-radius:8px;padding:8px 0;cursor:pointer">'
          +'<i class="fas fa-trash" style="font-size:11px"></i>주유소 삭제</button></div>' :'')
      +'</div>';
    }).join('');
  } catch {}
}

function deleteApplication(id) {
  showDialog({ icon:'', title:'신청 삭제', msg:'반려된 신청 내역을 삭제하시겠습니까?',
    confirmText:'삭제', confirmClass:'btn-danger',
    onConfirm: async () => {
      try {
        await API.delete('/stations/my-applications/'+id);
        showToast('삭제되었습니다.');
        const el=document.getElementById('app-item-'+id);
        if(el){ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>loadApplications(),300); }
      } catch(e){ showToast(e.message||'삭제 실패','error'); }
    }
  });
}

function deleteStation(id) {
  const nameEl = document.querySelector('#station-item-'+id+' h3');
  const name = nameEl ? nameEl.textContent : '이 주유소';
  showDialog({ icon:'', title:'주유소 삭제',
    msg:name+' 주유소를 삭제하시겠습니까?<br><span style="font-size:12px;color:#8e9ab4">등록된 쿠폰도 함께 삭제됩니다.</span>',
    confirmText:'삭제', confirmClass:'btn-danger',
    onConfirm: async () => {
      try {
        await API.delete('/stations/my-stations/'+id);
        showToast('주유소가 삭제되었습니다.');
        const el=document.getElementById('station-item-'+id);
        if(el){ el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>loadStations(),300); }
      } catch(e){ showToast(e.message||'삭제 실패','error'); }
    }
  });
}
</script>
`)
}
