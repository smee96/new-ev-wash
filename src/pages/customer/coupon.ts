// 고객 쿠폰 페이지 (내 쿠폰 목록, 쿠폰 상세/사용)
import { htmlPage } from '../layout'

export function myCouponsPage(): string {
  return htmlPage('내 쿠폰', `
<div class="min-h-screen pb-24">
  <div class="page-header">
    <span class="page-header-title">내 쿠폰</span>
  </div>
  <div id="content" class="p-4">
    <div class="card text-center py-12">
      <i class="fas fa-spinner fa-spin text-2xl" style="color:#84cc16"></i>
    </div>
  </div>
</div>
<nav class="bottom-nav">
  <a href="/home"><i class="fas fa-home"></i>홈</a>
  <a href="/stations"><i class="fas fa-gas-pump"></i>주유소</a>
  <a href="/my-coupons" class="active"><i class="fas fa-ticket-alt"></i>내 쿠폰</a>
  <a href="/mypage"><i class="fas fa-user"></i>마이</a>
</nav>
<script>
window.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth('customer')) return;
  try {
    const r=await API.get('/coupons/my'); const stations=r.stations||[];
    const el=document.getElementById('content');
    if (!stations.length) {
      el.innerHTML='<div class="card text-center py-14"><i class="fas fa-ticket-alt text-5xl mb-4" style="color:#dde3ef"></i><p class="mb-1 font-medium" style="color:#4a5568">보유한 쿠폰이 없습니다</p><p class="text-sm mb-5" style="color:#8e9ab4">주유소에서 쿠폰을 구매해보세요</p><a href="/stations" class="btn btn-primary" style="width:auto;display:inline-block;padding:12px 28px">주유소 찾기</a></div>';
      return;
    }
    el.innerHTML=stations.map(st=>'<a href="/my-coupons/'+st.station_id+'" class="card block mb-3 fade-in" style="border:1px solid #eef1f7"><div class="flex items-center justify-between"><div><h3 class="font-semibold" style="color:#1a202c">'+st.station_name+'</h3><p class="text-xs mt-0.5" style="color:#8e9ab4">'+st.address+'</p></div><div class="text-right ml-3 flex-shrink-0"><p class="text-2xl font-bold" style="color:#65a30d">'+st.remaining_quantity+'</p><p class="text-xs" style="color:#8e9ab4">회 남음</p></div></div></a>').join('');
  } catch { document.getElementById('content').innerHTML='<div class="card text-center py-10" style="color:#ef4444">불러올 수 없습니다</div>'; }
});
</script>
`)
}

export function myCouponDetailPage(): string {
  return htmlPage('쿠폰 사용', `
<div class="min-h-screen pb-8">
  <div class="page-header">
    <button onclick="history.back()" class="back-btn"><i class="fas fa-arrow-left"></i></button>
    <span id="pageTitle" class="page-header-title">쿠폰 사용</span>
  </div>
  <div id="content" class="p-4">
    <div class="card text-center py-12">
      <i class="fas fa-spinner fa-spin text-2xl" style="color:#84cc16"></i>
    </div>
  </div>
</div>

<!-- QR 스캔 모달 -->
<div id="qrModal" class="modal-bg hidden">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-handle"></div>
    <h3 class="modal-title mb-1">QR 코드 스캔</h3>
    <p class="text-sm mb-4" style="color:#8e9ab4">주유소에 부착된 QR 코드를 스캔하세요</p>
    <div id="reader" style="width:100%;border-radius:16px;overflow:hidden;"></div>
    <button onclick="closeQR()" class="btn btn-gray mt-4">취소</button>
  </div>
</div>

<!-- 쿠폰 사용 확인 모달 -->
<div id="useConfirmModal" class="modal-bg hidden" style="z-index:9999">
  <div class="modal" onclick="event.stopPropagation()" style="text-align:center;padding:32px 24px">
    <div class="modal-handle"></div>
    <!-- 날짜/시간 -->
    <div class="rounded-2xl py-5 px-4 mb-5" style="background:#0a1628">
      <div class="text-xs font-medium mb-1" style="color:#84cc16;letter-spacing:0.08em">사용 일시</div>
      <div id="useConfirmDate" class="text-lg font-bold" style="color:#bef264"></div>
      <div id="useConfirmTime" class="font-black" style="color:#f0ffd4;font-size:2.6rem;line-height:1.1;font-variant-numeric:tabular-nums"></div>
    </div>
    <!-- 사용 완료 아이콘 -->
    <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style="background:#f0ffd4">
      <i class="fas fa-check-circle text-3xl" style="color:#65a30d"></i>
    </div>
    <div class="text-xl font-bold mb-1" style="color:#0a1628">쿠폰 사용 완료!</div>
    <div class="text-sm mb-5" style="color:#8e9ab4">이 화면을 직원에게 보여주세요</div>
    <!-- 주유소·쿠폰 정보 -->
    <div class="rounded-2xl p-4 mb-6 text-left" style="background:#f4f7fb;border:1.5px solid #e2e8f0">
      <div class="flex items-center gap-2 mb-3">
        <i class="fas fa-gas-pump text-base" style="color:#84cc16"></i>
        <span class="text-xs font-semibold" style="color:#8e9ab4">주유소</span>
      </div>
      <div id="useConfirmStation" class="font-bold text-base mb-4" style="color:#1a202c"></div>
      <div class="flex items-center gap-2 mb-2">
        <i class="fas fa-ticket-alt text-base" style="color:#84cc16"></i>
        <span class="text-xs font-semibold" style="color:#8e9ab4">사용 쿠폰</span>
      </div>
      <div id="useConfirmCoupon" class="font-bold text-base mb-3" style="color:#1a202c"></div>
      <div class="flex items-center justify-between pt-3" style="border-top:1px solid #e2e8f0">
        <span class="text-sm" style="color:#8e9ab4">이번 사용 후 잔여</span>
        <span id="useConfirmRemaining" class="text-2xl font-black" style="color:#65a30d"></span>
      </div>
    </div>
    <button onclick="closeUseConfirm()" class="btn btn-primary w-full" style="font-size:1rem;padding:16px">확인</button>
  </div>
</div>

<!-- 환불 모달 -->
<div id="refundModal" class="modal-bg hidden">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-handle"></div>
    <div class="modal-title">환불 요청</div>
    <p class="modal-sub" id="refundSub"></p>
    <div class="mb-5">
      <label class="text-sm font-medium mb-3 block" style="color:#4a5568">환불할 횟수</label>
      <div class="flex items-center justify-between rounded-2xl p-2" style="background:#f4f7fb">
        <button onclick="changeRefundQty(-1)" class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold active:bg-gray-100" style="color:#4a5568">−</button>
        <div class="text-center">
          <div class="text-3xl font-bold" style="color:#1a202c" id="refundQtyNum">1</div>
          <div class="text-xs" style="color:#8e9ab4">회</div>
        </div>
        <button onclick="changeRefundQty(1)" class="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl font-bold" style="color:#84cc16">+</button>
      </div>
    </div>
    <div class="rounded-2xl p-4 mb-5" style="background:#f0ffd4">
      <div class="flex justify-between items-center mb-1">
        <span class="text-sm" style="color:#4a5568">회당 환불금액</span>
        <span class="text-sm font-semibold" style="color:#1a202c" id="refundUnitLabel"></span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm" style="color:#4a5568">예상 환불금액</span>
        <span class="text-xl font-bold" style="color:#65a30d" id="refundTotalLabel"></span>
      </div>
    </div>
    <div class="rounded-xl p-3 mb-2 text-xs" style="background:#fef3c7;border:1px solid #fde68a;color:#92400e">
      <p>• 카드: 결제일로부터 <b>180일 이내</b>만 가능 · 영업일 3~4일 소요</p>
      <p>• 계좌이체: 결제일로부터 <b>180일 이내</b>만 가능 · 즉시 환불</p>
      <p>• 휴대폰: <b>결제 당월</b>에만 취소 가능</p>
    </div>
    <div id="refundReasonWrap" class="mb-5">
      <label class="text-sm font-medium mb-2 block" style="color:#4a5568">환불 사유</label>
      <select id="refundReason" class="input">
        <option value="단순 변심">단순 변심</option>
        <option value="서비스 불만족">서비스 불만족</option>
        <option value="주유소 폐업/변경">주유소 폐업/변경</option>
        <option value="기타">기타</option>
      </select>
    </div>
    <div class="flex gap-3">
      <button onclick="closeModal('refundModal')" class="btn btn-gray" style="flex:1">취소</button>
      <button onclick="confirmRefund()" class="btn btn-danger" style="flex:1">환불 신청</button>
    </div>
  </div>
</div>

<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
<script>
const stationId=location.pathname.split('/').pop();
let scanner=null, currentPurchaseId=null, _refundData={};
window.addEventListener('DOMContentLoaded',()=>{ if(!requireAuth('customer'))return; loadDetail(); });
async function loadDetail() {
  try {
    const r=await API.get('/coupons/my/'+stationId);
    const s=r.station, purchases=r.purchases||[];
    document.getElementById('pageTitle').textContent=s?.station_name||'쿠폰';
    const totalUses=purchases.reduce((sum,p)=>sum+p.remaining_uses,0);
    document.getElementById('content').innerHTML=
      '<div class="card mb-4" style="border-left:4px solid #84cc16">'
      +'<h2 class="font-bold text-base" style="color:#1a202c">'+s?.station_name+'</h2>'
      +'<p class="text-xs mt-1" style="color:#8e9ab4">'+s?.address+'</p>'
      +'<div class="mt-4">'
      +'<p class="text-xs mb-1" style="color:#8e9ab4">사용 가능 횟수</p>'
      +'<p class="text-4xl font-bold" style="color:#65a30d">'+totalUses+'<span class="text-lg ml-1">회</span></p>'
      +(totalUses===0?'<p class="text-xs mt-2" style="color:#8e9ab4">아래 구매 내역에서 사용 완료된 쿠폰을 확인하세요</p>':'<p class="text-xs mt-2" style="color:#8e9ab4">아래 구매 내역에서 쿠폰을 선택해 QR 사용하세요</p>')
      +'</div></div>'
      +'<h3 class="section-title">구매 내역</h3>'
      +purchases.map(p=>'<div class="card mb-3 fade-in">'
        +'<div class="flex justify-between items-start mb-3">'
        +'<div><p class="font-semibold" style="color:#1a202c">'+p.coupon_title+'</p><p class="text-xs mt-0.5" style="color:#8e9ab4">'+formatDate(p.created_at)+' 구매 · '+formatPrice(p.total_amount)+'</p></div>'
        +'<span class="badge '+(p.remaining_uses>0?'badge-green':'badge-gray')+' flex-shrink-0">'+p.remaining_uses+'회</span>'
        +'</div>'
        +(p.remaining_uses>0
          ?'<div class="flex gap-2">'
           +'<button onclick="currentPurchaseId='+p.id+';openQR()" class="btn btn-outline btn-sm" style="flex:1">QR 사용</button>'
           +'<button onclick="openRefundModal('+p.id+','+p.remaining_uses+','+p.total_amount+','+p.unit_price+','+p.wash_count+')" class="btn btn-danger btn-sm" style="flex:1">환불</button>'
           +'</div>'
          :'')
        +'</div>'
      ).join('');
  } catch { document.getElementById('content').innerHTML='<div class="card text-center py-10" style="color:#ef4444">불러올 수 없습니다</div>'; }
}
function openQR() {
  openModal('qrModal');
  scanner=new Html5Qrcode('reader');
  scanner.start({facingMode:'environment'},{fps:10,qrbox:{width:240,height:240}},async code=>{ await closeQR(); await useWithQR(code); }).catch(()=>showToast('카메라 접근이 필요합니다.','error'));
}
async function closeQR() {
  closeModal('qrModal');
  if(scanner){try{await scanner.stop();}catch{}scanner=null;}
}
async function useWithQR(qrCode) {
  try {
    const purchaseId=currentPurchaseId;
    if(!purchaseId)return showToast('사용할 쿠폰을 선택해주세요.','error');
    const r=await API.post('/stations/'+stationId+'/use-coupon',{purchase_id:purchaseId,qr_code:qrCode});
    currentPurchaseId=null;
    showUseConfirm(r);
    setTimeout(loadDetail,1500);
  } catch(e){showToast(e.message||'사용 처리 실패','error');}
}
let _clockTimer=null;
function showUseConfirm(r) {
  const modal=document.getElementById('useConfirmModal');
  document.getElementById('useConfirmStation').textContent=r.station_name||'';
  document.getElementById('useConfirmCoupon').textContent=r.coupon_title||'';
  document.getElementById('useConfirmRemaining').textContent=(r.remaining_uses!=null?r.remaining_uses:'?')+'회 남음';
  function tick(){
    const now=new Date();
    const ymd=[now.getFullYear(),(now.getMonth()+1+'').padStart(2,'0'),(now.getDate()+'').padStart(2,'0')].join('-');
    const dow=['일','월','화','수','목','금','토'][now.getDay()];
    const hms=[(now.getHours()+'').padStart(2,'0'),(now.getMinutes()+'').padStart(2,'0'),(now.getSeconds()+'').padStart(2,'0')].join(':');
    document.getElementById('useConfirmDate').textContent=ymd+' ('+dow+')';
    document.getElementById('useConfirmTime').textContent=hms;
  }
  tick();
  _clockTimer=setInterval(tick,1000);
  openModal('useConfirmModal');
}
function closeUseConfirm(){
  if(_clockTimer){clearInterval(_clockTimer);_clockTimer=null;}
  closeModal('useConfirmModal');
}
function openRefundModal(purchaseId, remaining, totalAmount, unitPrice, washCount) {
  // 회당 환불단가 = 장당가격 ÷ 장당횟수 (서버 calcRefundAmountPerUse 와 동일 로직)
  const unitAmount = Math.floor(unitPrice / washCount);
  _refundData = { purchaseId, remaining, totalAmount, unitAmount, qty: 1 };
  document.getElementById('refundSub').textContent = '최대 '+remaining+'회 환불 가능';
  document.getElementById('refundQtyNum').textContent = 1;
  document.getElementById('refundUnitLabel').textContent = formatPrice(unitAmount);
  document.getElementById('refundTotalLabel').textContent = formatPrice(unitAmount * 1);
  openModal('refundModal');
}
function changeRefundQty(d) {
  _refundData.qty = Math.max(1, Math.min(_refundData.remaining, (_refundData.qty||1) + d));
  document.getElementById('refundQtyNum').textContent = _refundData.qty;
  document.getElementById('refundTotalLabel').textContent = formatPrice(_refundData.unitAmount * _refundData.qty);
}
async function confirmRefund() {
  const reason = document.getElementById('refundReason').value;
  showDialog({
    icon: '💸',
    title: '환불 신청',
    msg: _refundData.qty+'회 환불 신청하시겠습니까? (예상 환불금액: '+formatPrice(_refundData.unitAmount*_refundData.qty)+')',
    confirmText: '신청',
    confirmClass: 'btn-danger',
    onConfirm: async () => {
      try {
        const r=await API.post('/coupons/refund/'+_refundData.purchaseId,{quantity:_refundData.qty,reason});
        closeModal('refundModal');
        showToast(r.message||'환불 신청이 완료되었습니다.');
        setTimeout(loadDetail,1000);
      } catch(e){showToast(e.message||'환불 실패','error');}
    }
  });
}
</script>
`)
}
