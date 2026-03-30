// 공통 레이아웃 헬퍼

export const COMMON_CSS = `
<style>
* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f7fb; margin: 0; }

/* ── 컬러 팔레트
   딥네이비   : #0a1628
   미드네이비 : #1a2f5e
   라임       : #84cc16
   라이트라임 : #bef264
   솔레이트   : #f0ffd4  (라임 계열 연한 배경)
── */
:root {
  --navy-deep:  #0a1628;
  --navy-mid:   #1a2f5e;
  --navy-light: #243b6e;
  --lime:       #84cc16;
  --lime-dark:  #65a30d;
  --lime-light: #bef264;
  --solarate:   #f0ffd4;
  --solarate-2: #e8fbb8;
  --white:      #ffffff;
  --gray-50:    #f4f7fb;
  --gray-100:   #eef1f7;
  --gray-200:   #dde3ef;
  --gray-400:   #8e9ab4;
  --gray-600:   #4a5568;
  --gray-800:   #1a202c;
  --red:        #ef4444;
  --amber:      #f59e0b;
}

.ev-green  { color: var(--lime); }
.ev-navy   { color: var(--navy-deep); }
.ev-bg     { background: var(--navy-deep); }
.ev-bg-mid { background: var(--navy-mid); }

/* ── 버튼 ── */
.btn { display:block; width:100%; padding:14px; border-radius:12px; font-size:16px; font-weight:600; border:none; cursor:pointer; transition:all .15s; text-align:center; text-decoration:none; -webkit-appearance:none; }
.btn-primary { background: var(--lime); color: var(--navy-deep); }
.btn-primary:hover { background: var(--lime-light); }
.btn-primary:active { background: var(--lime-dark); color:#fff; transform: scale(0.98); }
.btn-primary:disabled { background: var(--gray-200); color: var(--gray-400); cursor: not-allowed; }
.btn-outline { background: #fff; color: var(--navy-mid); border: 2px solid var(--navy-mid); }
.btn-outline:hover { background: var(--solarate); border-color: var(--lime); color: var(--navy-deep); }
.btn-danger { background: #fff; color: var(--red); border: 2px solid var(--red); }
.btn-danger:active { background: #fee2e2; }
.btn-gray { background: #fff; color: var(--gray-600); border: 2px solid var(--gray-200); }
.btn-navy { background: var(--navy-mid); color: #fff; }
.btn-navy:hover { background: var(--navy-deep); }
.btn-sm { padding: 10px 16px; font-size: 14px; border-radius: 10px; }

/* ── 인풋 ── */
.input { width:100%; padding:14px 16px; border:1.5px solid var(--gray-200); border-radius:12px; font-size:16px; outline:none; transition:border .15s; background:#fff; -webkit-appearance:none; color: var(--gray-800); }
.input:focus { border-color: var(--lime); box-shadow: 0 0 0 3px rgba(132,204,22,.1); }

/* ── 카드 ── */
.card { background: #fff; border-radius: 16px; padding: 16px; box-shadow: 0 1px 6px rgba(10,22,40,.06); }

/* ── 배지 ── */
.badge { display:inline-block; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; }
.badge-green  { background: var(--solarate); color: var(--lime-dark); }
.badge-navy   { background: var(--navy-mid); color: #fff; }
.badge-gray   { background: var(--gray-100); color: var(--gray-600); }
.badge-red    { background: #fee2e2; color: var(--red); }
.badge-amber  { background: #fef3c7; color: #92400e; }
.badge-lime   { background: var(--lime-light); color: var(--navy-deep); }

/* ── 토스트 ── */
.toast { position:fixed; top:max(20px, env(safe-area-inset-top)); left:50%; transform:translateX(-50%); padding:13px 22px; border-radius:12px; font-size:15px; z-index:9999; display:none; white-space:nowrap; box-shadow:0 4px 16px rgba(0,0,0,.18); max-width:90vw; white-space:normal; text-align:center; }

/* ── 하단 네비 ── */
.bottom-nav { position:fixed; bottom:0; left:0; right:0; background:#fff; border-top:1px solid var(--gray-100); display:flex; z-index:100; padding-bottom:env(safe-area-inset-bottom); box-shadow: 0 -2px 12px rgba(10,22,40,.06); }
.bottom-nav a { flex:1; display:flex; flex-direction:column; align-items:center; padding:10px 4px 8px; font-size:11px; color:var(--gray-400); text-decoration:none; gap:3px; }
.bottom-nav a.active, .bottom-nav a:hover { color:var(--lime-dark); }
.bottom-nav i { font-size:22px; }

/* ── 유틸 ── */
.spinner { animation: spin 1s linear infinite; display:inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
.fade-in { animation: fadeIn .2s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
.divider { display:flex; align-items:center; gap:12px; color:var(--gray-400); font-size:13px; }
.divider::before, .divider::after { content:''; flex:1; height:1px; background:var(--gray-200); }

/* ── 공통 모달 ── */
.modal-bg { position:fixed; inset:0; background:rgba(10,22,40,.55); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
.modal-bg.hidden { display:none; }
.modal { background:#fff; border-radius:24px 24px 0 0; padding:24px 20px calc(24px + env(safe-area-inset-bottom)); width:100%; max-width:480px; max-height:90vh; overflow-y:auto; }
.modal-center { background:#fff; border-radius:20px; padding:24px 20px; width:calc(100% - 40px); max-width:360px; margin:auto; }
.modal-handle { width:40px; height:4px; background:var(--gray-200); border-radius:4px; margin:0 auto 20px; }
.modal-title { font-size:18px; font-weight:700; color:var(--navy-deep); margin-bottom:4px; }
.modal-sub { font-size:14px; color:var(--gray-400); margin-bottom:20px; }

/* ── 다이얼로그 ── */
.dialog-bg { position:fixed; inset:0; background:rgba(10,22,40,.55); z-index:300; display:flex; align-items:center; justify-content:center; padding:20px; }
.dialog-bg.hidden { display:none; }
.dialog { background:#fff; border-radius:20px; padding:24px 20px; width:100%; max-width:320px; text-align:center; }
.dialog-icon { font-size:40px; margin-bottom:12px; }
.dialog-title { font-size:17px; font-weight:700; color:var(--navy-deep); margin-bottom:8px; }
.dialog-msg { font-size:14px; color:var(--gray-600); line-height:1.6; margin-bottom:20px; white-space:pre-line; }
.dialog-btns { display:flex; gap:10px; }
.dialog-btns .btn { flex:1; padding:13px; font-size:15px; }

/* ── 페이지 헤더 ── */
.page-header { background:#fff; border-bottom:1px solid var(--gray-100); padding:0 16px; height:56px; display:flex; align-items:center; gap:12px; position:sticky; top:0; z-index:50; box-shadow: 0 1px 4px rgba(10,22,40,.04); }
.page-header-title { font-size:17px; font-weight:700; color:var(--navy-deep); flex:1; }
.back-btn { width:40px; height:40px; display:flex; align-items:center; justify-content:center; color:var(--gray-600); border:none; background:none; cursor:pointer; border-radius:10px; font-size:18px; }
.back-btn:active { background:var(--gray-100); }
.section-title { font-size:16px; font-weight:700; color:var(--navy-deep); margin-bottom:12px; }
</style>
`

export const COMMON_JS = `
<script>
const API = {
  async request(method, url, data) {
    const token = localStorage.getItem('ev_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const opts = { method, headers };
    if (data) opts.body = JSON.stringify(data);
    const res = await fetch('/api' + url, opts);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(json.error || '오류'), { status: res.status, data: json });
    return json;
  },
  get: (url) => API.request('GET', url),
  post: (url, data) => API.request('POST', url, data),
  patch: (url, data) => API.request('PATCH', url, data),
  put: (url, data) => API.request('PUT', url, data),
  delete: (url) => API.request('DELETE', url),
};
function getUser() { try { return JSON.parse(localStorage.getItem('ev_user') || 'null'); } catch { return null; } }
function setUser(token, user) { localStorage.setItem('ev_token', token); localStorage.setItem('ev_user', JSON.stringify(user)); }
function logout() { localStorage.removeItem('ev_token'); localStorage.removeItem('ev_user'); window.location.href = '/login'; }
function showToast(msg, type = 'success') {
  const el = document.getElementById('_toast') || (() => { const t = document.createElement('div'); t.id='_toast'; t.className='toast'; document.body.appendChild(t); return t; })();
  el.textContent = msg;
  el.style.background = type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : '#1a2f5e';
  el.style.color = '#fff';
  el.style.display = 'block';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.style.display = 'none', 2800);
}
function formatPrice(n) { return Number(n || 0).toLocaleString() + '원'; }
function formatDate(s) { if (!s) return '-'; return new Date(s).toLocaleDateString('ko-KR'); }
function formatDateTime(s) { if (!s) return '-'; return new Date(s).toLocaleString('ko-KR'); }
function requireAuth(type) {
  const u = getUser();
  if (!u) { window.location.href = type === 'owner' ? '/owner/login' : type === 'admin' ? '/admin/login' : '/login'; return null; }
  if (type && u.userType !== type) { window.location.href = '/'; return null; }
  return u;
}

/* ── 공통 다이얼로그 ── */
function showDialog({ icon = '', title = '', msg = '', cancelText = '취소', confirmText = '확인', confirmClass = 'btn-primary', onConfirm, onCancel } = {}) {
  const existing = document.getElementById('_dialog');
  if (existing) existing.remove();
  const bg = document.createElement('div');
  bg.id = '_dialog';
  bg.className = 'dialog-bg';
  bg.innerHTML =
    '<div class="dialog">'
    + (icon ? '<div class="dialog-icon">' + icon + '</div>' : '')
    + (title ? '<div class="dialog-title">' + title + '</div>' : '')
    + (msg ? '<div class="dialog-msg">' + msg + '</div>' : '')
    + '<div class="dialog-btns">'
    + (cancelText ? '<button class="btn btn-gray" id="_dlg_cancel">' + cancelText + '</button>' : '')
    + '<button class="btn ' + confirmClass + '" id="_dlg_ok">' + confirmText + '</button>'
    + '</div></div>';
  document.body.appendChild(bg);
  document.getElementById('_dlg_ok').onclick = () => { bg.remove(); onConfirm && onConfirm(); };
  if (cancelText) document.getElementById('_dlg_cancel').onclick = () => { bg.remove(); onCancel && onCancel(); };
}
function showAlert({ icon = 'ℹ️', title = '', msg = '', btnText = '확인', onClose } = {}) {
  showDialog({ icon, title, msg, cancelText: '', confirmText: btnText, onConfirm: onClose });
}

/* ── 공통 모달 ── */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('hidden'); document.body.style.overflow = ''; }
}
</script>
`

export function htmlPage(title: string, body: string, extraHead = ''): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="theme-color" content="#0a1628">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>${title} - EV-Wash</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
${COMMON_CSS}
${extraHead}
</head>
<body>
${COMMON_JS}
${body}
</body>
</html>`
}
