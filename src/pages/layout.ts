// 공통 레이아웃 헬퍼

export const COMMON_CSS = `
<style>
* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; }
:root { --green: #10b981; --green-dark: #059669; --green-light: #d1fae5; --gray-50: #f8fafc; --gray-100: #f1f5f9; --gray-200: #e2e8f0; --gray-400: #94a3b8; --gray-600: #475569; --gray-800: #1e293b; --red: #ef4444; --amber: #f59e0b; }
.ev-green { color: var(--green); }
.ev-bg { background: var(--green); }
.btn { display:block; width:100%; padding:13px; border-radius:10px; font-size:15px; font-weight:600; border:none; cursor:pointer; transition:all .15s; text-align:center; text-decoration:none; }
.btn-primary { background: var(--green); color: #fff; }
.btn-primary:hover { background: var(--green-dark); }
.btn-primary:disabled { background: var(--gray-400); cursor: not-allowed; }
.btn-outline { background: #fff; color: var(--green); border: 2px solid var(--green); }
.btn-danger { background: #fff; color: var(--red); border: 2px solid var(--red); }
.btn-sm { padding: 8px 14px; font-size: 13px; border-radius: 8px; }
.input { width:100%; padding:12px 14px; border:1.5px solid var(--gray-200); border-radius:10px; font-size:15px; outline:none; transition:border .15s; background:#fff; }
.input:focus { border-color: var(--green); }
.card { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
.badge-green { background: var(--green-light); color: var(--green-dark); }
.badge-gray { background: var(--gray-100); color: var(--gray-600); }
.badge-red { background: #fee2e2; color: var(--red); }
.badge-amber { background: #fef3c7; color: #92400e; }
.toast { position:fixed; top:20px; left:50%; transform:translateX(-50%); padding:12px 20px; border-radius:10px; font-size:14px; z-index:9999; display:none; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,.15); }
.bottom-nav { position:fixed; bottom:0; left:0; right:0; background:#fff; border-top:1px solid var(--gray-100); display:flex; z-index:100; padding-bottom:env(safe-area-inset-bottom); }
.bottom-nav a { flex:1; display:flex; flex-direction:column; align-items:center; padding:10px 4px 8px; font-size:10px; color:var(--gray-400); text-decoration:none; gap:3px; }
.bottom-nav a.active, .bottom-nav a:hover { color:var(--green); }
.bottom-nav i { font-size:20px; }
.spinner { animation: spin 1s linear infinite; display:inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }
.fade-in { animation: fadeIn .2s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
.divider { display:flex; align-items:center; gap:12px; color:var(--gray-400); font-size:13px; }
.divider::before, .divider::after { content:''; flex:1; height:1px; background:var(--gray-200); }
.modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
.modal { background:#fff; border-radius:20px 20px 0 0; padding:24px 20px 32px; width:100%; max-width:480px; }
.page-header { background:#fff; border-bottom:1px solid var(--gray-100); padding:16px; display:flex; align-items:center; gap:12px; position:sticky; top:0; z-index:50; }
.section-title { font-size:16px; font-weight:700; color:var(--gray-800); margin-bottom:12px; }
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
  el.style.background = type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : '#10b981';
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
</script>
`

export function htmlPage(title: string, body: string, extraHead = ''): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
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
