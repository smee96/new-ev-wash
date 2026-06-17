// 랜딩 페이지 / 이용약관 / 개인정보처리방침

// ============================================================
// 공통 레이아웃 (랜딩용)
// ============================================================
function landingHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>${title}</title>
<meta name="description" content="EV-Wash - 전국 주유소 세차 쿠폰 서비스">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a1628; color: #fff; }
</style>
</head>
<body>
${body}
</body>
</html>`
}

// ============================================================
// 메인 랜딩 페이지
// ============================================================
export function landingPage(): string {
  return landingHtml('EV-Wash', `
<style>
html, body { height: 100%; }

.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background: #0a1628;
  padding: 0 24px;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  position: relative;
  overflow: hidden;
}



/* 로고 영역 */
.logo-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  position: relative;
  z-index: 1;
}

.logo-badge { display: none; }

.logo-icon {
  font-size: 56px;
  line-height: 1;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 0 24px rgba(132,204,22,.5));
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.logo-text {
  font-size: clamp(52px, 18vw, 92px);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  color: #bef264;
  text-align: center;
}

.logo-sub {
  margin-top: 16px;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.35);
  text-transform: uppercase;
  text-align: center;
}

.logo-desc {
  margin-top: 20px;
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  text-align: center;
  line-height: 1.7;
}

/* 피처 뱃지 */
.features {
  display: flex;
  gap: 8px;
  margin-top: 28px;
  flex-wrap: wrap;
  justify-content: center;
}
.feat-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 100px;
  padding: 6px 12px;
  font-size: 12px;
  color: rgba(255,255,255,.6);
}
.feat-chip i { color: #84cc16; font-size: 11px; }

/* 하단 영역 */
.bottom-area {
  width: 100%;
  max-width: 400px;
  padding-bottom: max(32px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  position: relative;
  z-index: 1;
}

.start-btn {
  display: block;
  width: 100%;
  padding: 17px;
  background: #bef264;
  color: #0a1628;
  border: none;
  border-radius: 14px;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.02em;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  transition: all 0.15s;
  -webkit-font-smoothing: antialiased;
  box-shadow: 0 4px 20px rgba(132,204,22,.35);
}

.start-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2px 10px rgba(132,204,22,.2);
}

/* 푸터 */
.footer {
  width: 100%;
  max-width: 480px;
  padding: 24px 0 0;
  border-top: 1px solid rgba(255,255,255,.07);
  margin-top: 24px;
}

.footer-company {
  font-size: 11px;
  color: rgba(255,255,255,0.2);
  line-height: 1.8;
  text-align: center;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 10px;
}

.footer-links a {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  text-decoration: none;
  border-bottom: 1px solid rgba(255,255,255,.15);
  padding-bottom: 1px;
  transition: color 0.15s;
}

.footer-links a:hover {
  color: rgba(255,255,255,0.6);
}
</style>

<div class="landing">
  <div class="logo-wrap">
    <div class="logo-icon">⚡</div>
    <div class="logo-text">EV-WASH</div>
    <div class="logo-sub">Electric Vehicle Car Wash</div>
    <p class="logo-desc">전국 주유소 세차 쿠폰을<br>간편하게 구매하고 사용하세요</p>
    <div class="features">
      <span class="feat-chip"><i class="fas fa-check-circle"></i> 간편 구매</span>
      <span class="feat-chip"><i class="fas fa-check-circle"></i> QR 인증</span>
      <span class="feat-chip"><i class="fas fa-check-circle"></i> 즉시 환불</span>
    </div>
  </div>

  <div class="bottom-area">
    <a href="/login" class="start-btn">시작하기</a>
    <a href="/guide" style="display:block;width:100%;padding:15px;margin-top:10px;background:rgba(255,255,255,.07);color:rgba(255,255,255,.75);border:1.5px solid rgba(255,255,255,.12);border-radius:14px;font-size:15px;font-weight:700;text-align:center;text-decoration:none;letter-spacing:0.01em;">
      <i class="fas fa-book-open" style="margin-right:8px;color:#84cc16"></i>이용방법 보기
    </a>

    <div class="footer">
      <div class="footer-company">
        (주)모빈 &nbsp;|&nbsp; 대표이사 이규한 &nbsp;|&nbsp; 개인정보 관리책임자 안중경<br>
        통신판매업신고: 2018-서울서초-0006호<br>
        서울시 구로구 디지털로31길 12, 본관 2층 2호 넥스트데이 (구로동, 티피타워)<br>
        mobin_info@mobin-inc.com
      </div>
      <div class="footer-links">
        <a href="/terms">서비스 이용약관</a>
        <a href="/privacy">개인정보처리방침</a>
      </div>
    </div>
  </div>
</div>
`)
}

// ============================================================
// 공통 문서 페이지 스타일
// ============================================================
const DOC_STYLE = `
<style>
body { background: #f4f7fb; color: #1a202c; }
.doc-wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px 60px;
}
.doc-header {
  position: sticky;
  top: 0;
  background: #fff;
  border-bottom: 1px solid #eef1f7;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
  margin: 0 -20px;
  box-shadow: 0 1px 4px rgba(10,22,40,.05);
}
.doc-header a {
  color: #4a5568;
  text-decoration: none;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #f4f7fb;
}
.doc-header a:hover { background: #eef1f7; }
.doc-header h1 {
  font-size: 16px;
  font-weight: 700;
  color: #0a1628;
}
.doc-content {
  padding-top: 28px;
}
.doc-content h2 {
  font-size: 14px;
  font-weight: 700;
  color: #1a2f5e;
  margin: 28px 0 10px;
  padding: 8px 12px;
  background: #f0ffd4;
  border-left: 3px solid #84cc16;
  border-radius: 0 8px 8px 0;
}
.doc-content h2:first-child {
  margin-top: 0;
}
.doc-content p, .doc-content li {
  font-size: 14px;
  line-height: 1.8;
  color: #4a5568;
}
.doc-content ul, .doc-content ol {
  padding-left: 18px;
  margin: 6px 0;
}
.doc-content li {
  margin-bottom: 4px;
}
.doc-content .date {
  font-size: 13px;
  color: #8e9ab4;
  margin-bottom: 24px;
}
.doc-content strong {
  color: #1a202c;
  font-weight: 600;
}
.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin: 10px 0;
  border-radius: 10px;
  overflow: hidden;
}
.info-table th {
  background: #1a2f5e;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #fff;
  border: none;
  white-space: nowrap;
}
.info-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #eef1f7;
  color: #4a5568;
  line-height: 1.6;
  background: #fff;
}
.info-table tr:last-child td { border-bottom: none; }
</style>
`

// ============================================================
// 서비스 이용약관
// ============================================================
export function termsPage(): string {
  return landingHtml('서비스 이용약관 - EV-Wash', `
${DOC_STYLE}

<div class="doc-wrap">
  <div class="doc-header">
    <a href="/"><i class="fas fa-arrow-left"></i></a>
    <h1>서비스 이용약관</h1>
  </div>

  <div class="doc-content">
    <p class="date">시행일: 2025년 1월 1일 &nbsp;|&nbsp; 최종 개정: 2025년 1월 1일</p>

    <h2>제1조 (목적)</h2>
    <p>본 약관은 주식회사 모빈(이하 "회사")이 운영하는 EV-Wash 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.</p>

    <h2>제2조 (용어의 정의)</h2>
    <ul>
      <li><strong>"서비스"</strong>란 회사가 제공하는 EV-Wash 세차 쿠폰 플랫폼(웹, 앱 포함)을 의미합니다.</li>
      <li><strong>"이용자"</strong>란 본 약관에 따라 서비스에 접속하여 회사가 제공하는 서비스를 이용하는 고객 및 사업자를 말합니다.</li>
      <li><strong>"고객"</strong>이란 서비스를 통해 쿠폰을 구매·사용하는 개인을 말합니다.</li>
      <li><strong>"파트너(사장님)"</strong>란 서비스에 입점하여 세차 쿠폰을 등록·판매하는 주유소 사업자를 말합니다.</li>
      <li><strong>"쿠폰"</strong>이란 회사의 플랫폼을 통해 판매되는 세차 서비스 이용권을 말합니다.</li>
    </ul>

    <h2>제3조 (약관의 효력 및 변경)</h2>
    <ul>
      <li>본 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
      <li>회사는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정 사유를 명시하여 서비스 내 공지합니다.</li>
      <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
    </ul>

    <h2>제4조 (서비스의 내용)</h2>
    <ul>
      <li>회사는 이용자에게 다음과 같은 서비스를 제공합니다.
        <ol>
          <li>세차 쿠폰 구매 및 사용 서비스</li>
          <li>주유소(파트너) 정보 제공 서비스</li>
          <li>쿠폰 구매 내역 및 사용 내역 조회 서비스</li>
          <li>파트너 대상 쿠폰 등록·관리·정산 서비스</li>
        </ol>
      </li>
      <li>쿠폰의 유효기간은 별도 지정이 없으며, 파트너 주유소가 폐업하는 경우 미사용 쿠폰은 전액 환불됩니다.</li>
    </ul>

    <h2>제5조 (회원가입)</h2>
    <ul>
      <li>이용자는 회사가 정한 가입 양식에 따라 회원 정보를 입력하고 본 약관에 동의함으로써 회원가입을 신청합니다.</li>
      <li>회사는 다음의 경우 가입 신청을 거부하거나 사후에 이용 계약을 해지할 수 있습니다.
        <ol>
          <li>실명이 아닌 명의로 신청한 경우</li>
          <li>타인의 정보를 도용한 경우</li>
          <li>관련 법령에 위반되는 목적으로 신청한 경우</li>
        </ol>
      </li>
    </ul>

    <h2>제6조 (쿠폰 구매 및 결제)</h2>
    <ul>
      <li>고객은 서비스에서 제공하는 결제 수단(신용카드, 체크카드, 계좌이체, 휴대폰 결제 등)을 통해 쿠폰을 구매할 수 있습니다.</li>
      <li>결제는 토스페이먼츠(주) 결제 시스템을 통해 처리됩니다.</li>
      <li>미성년자가 법정대리인의 동의 없이 결제한 경우, 해당 계약은 취소될 수 있습니다.</li>
    </ul>

    <h2>제7조 (쿠폰 환불 정책)</h2>
    <ul>
      <li>구매한 쿠폰은 <strong>미사용 횟수에 대해 언제든지 환불 신청</strong>이 가능합니다.</li>
      <li>환불 금액은 <strong>실제 결제 금액 ÷ 총 이용 횟수 × 잔여 횟수</strong>로 산정됩니다. (수량 할인 등 적용된 금액 기준)</li>
      <li>환불 처리 기간은 결제 수단에 따라 다음과 같습니다.
        <ul>
          <li>신용·체크카드: 영업일 기준 3~4일 (부분취소 포함)</li>
          <li>계좌이체: 즉시 처리 (180일 이내 거래에 한함)</li>
          <li>가상계좌: 영업일 기준 2일</li>
          <li>휴대폰 결제: 결제 당월에만 취소 가능</li>
        </ul>
      </li>
      <li>파트너 주유소 폐업 시 미사용 쿠폰 전액은 회사가 직권으로 환불 처리합니다.</li>
      <li>이미 사용된 횟수에 대해서는 환불이 불가합니다.</li>
    </ul>

    <h2>제8조 (정산)</h2>
    <ul>
      <li>파트너는 고객이 실제로 사용한 쿠폰 금액에서 플랫폼 수수료를 제외한 금액을 익영업일에 지급받습니다.</li>
      <li>플랫폼 수수료율은 서비스 내 공지된 기준에 따르며, 사전 고지 후 변경될 수 있습니다.</li>
      <li>미사용 쿠폰에 대한 금액은 플랫폼이 보유하며, 환불 요청 시 고객에게 반환됩니다.</li>
    </ul>

    <h2>제9조 (이용자의 의무)</h2>
    <ul>
      <li>이용자는 다음 행위를 하여서는 안 됩니다.
        <ol>
          <li>타인의 정보를 도용하거나 허위 정보를 등록하는 행위</li>
          <li>회사의 저작권 등 지적재산권을 침해하는 행위</li>
          <li>서비스 운영을 방해하거나 정보를 위·변조하는 행위</li>
          <li>기타 관련 법령에 위반되는 행위</li>
        </ol>
      </li>
    </ul>

    <h2>제10조 (서비스 중단)</h2>
    <ul>
      <li>회사는 시스템 점검, 서버 장애, 천재지변 등의 사유로 서비스를 일시 중단할 수 있습니다.</li>
      <li>회사는 서비스 중단으로 인한 손해에 대해 회사의 고의 또는 중과실이 없는 한 책임을 지지 않습니다.</li>
    </ul>

    <h2>제11조 (면책 조항)</h2>
    <ul>
      <li>회사는 파트너가 제공하는 세차 서비스의 품질에 대해 직접적인 책임을 지지 않습니다.</li>
      <li>회사는 이용자의 귀책 사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
    </ul>

    <h2>제12조 (분쟁 해결)</h2>
    <ul>
      <li>서비스 이용과 관련한 분쟁은 당사자 간 협의를 원칙으로 합니다.</li>
      <li>분쟁이 해결되지 않을 경우 회사의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.</li>
    </ul>

    <h2>부칙</h2>
    <p>본 약관은 2025년 1월 1일부터 시행됩니다.</p>
    <br>
    <p style="font-size:13px;color:#8e9ab4;">문의: mobin_info@mobin-inc.com &nbsp;|&nbsp; (주)모빈</p>
  </div>
</div>
`)
}

// ============================================================
// 개인정보처리방침
// ============================================================
export function privacyPage(): string {
  return landingHtml('개인정보처리방침 - EV-Wash', `
${DOC_STYLE}

<div class="doc-wrap">
  <div class="doc-header">
    <a href="/"><i class="fas fa-arrow-left"></i></a>
    <h1>개인정보처리방침</h1>
  </div>

  <div class="doc-content">
    <p class="date">시행일: 2025년 1월 1일 &nbsp;|&nbsp; 최종 개정: 2025년 1월 1일</p>

    <p>주식회사 모빈(이하 "회사")은 개인정보보호법 등 관련 법령에 따라 이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.</p>

    <h2>제1조 (수집하는 개인정보 항목 및 수집 방법)</h2>
    <p>회사는 서비스 제공을 위해 아래와 같이 개인정보를 수집합니다.</p>
    <table class="info-table">
      <thead>
        <tr>
          <th>수집 시점</th>
          <th>수집 항목</th>
          <th>목적</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>회원가입</td>
          <td>이름, 이메일, 휴대폰번호, 비밀번호(암호화)</td>
          <td>본인 확인, 서비스 제공</td>
        </tr>
        <tr>
          <td>소셜 로그인</td>
          <td>소셜 제공사 고유 ID, 이름, 이메일</td>
          <td>간편 로그인</td>
        </tr>
        <tr>
          <td>쿠폰 구매</td>
          <td>결제 수단 정보(토스페이먼츠 처리), 구매 내역</td>
          <td>결제 처리, 환불</td>
        </tr>
        <tr>
          <td>파트너 신청</td>
          <td>사업자등록번호, 상호명, 주소, 계좌 정보, 대표자 정보</td>
          <td>입점 심사, 정산</td>
        </tr>
        <tr>
          <td>서비스 이용</td>
          <td>서비스 이용 기록, IP 주소, 접속 기기 정보</td>
          <td>서비스 개선, 보안</td>
        </tr>
      </tbody>
    </table>

    <h2>제2조 (개인정보의 수집 및 이용 목적)</h2>
    <ul>
      <li>회원 가입 및 관리: 회원제 서비스 제공, 본인 확인, 서비스 부정이용 방지</li>
      <li>서비스 제공: 쿠폰 구매·사용·환불, 정산 처리</li>
      <li>고충 처리: 문의사항 접수 및 처리</li>
      <li>서비스 개선: 신규 서비스 개발, 통계 분석</li>
    </ul>

    <h2>제3조 (개인정보의 보유 및 이용 기간)</h2>
    <ul>
      <li>회원 탈퇴 시까지 보유하며, 탈퇴 후 지체 없이 파기합니다.</li>
      <li>단, 관계 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
        <ul>
          <li>계약 또는 청약 철회 기록: 5년 (전자상거래법)</li>
          <li>대금 결제 및 재화 공급 기록: 5년 (전자상거래법)</li>
          <li>소비자 불만 또는 분쟁 처리 기록: 3년 (전자상거래법)</li>
          <li>접속 로그 기록: 3개월 (통신비밀보호법)</li>
        </ul>
      </li>
    </ul>

    <h2>제4조 (개인정보의 제3자 제공)</h2>
    <ul>
      <li>회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.</li>
      <li>단, 이용자의 동의가 있거나 법령에 근거한 경우 예외로 합니다.</li>
      <li>결제 처리를 위해 토스페이먼츠(주)에 필요한 정보가 전달됩니다.</li>
    </ul>

    <h2>제5조 (개인정보 처리 위탁)</h2>
    <table class="info-table">
      <thead>
        <tr><th>수탁업체</th><th>위탁 업무</th></tr>
      </thead>
      <tbody>
        <tr><td>토스페이먼츠(주)</td><td>결제 처리 및 결제 정보 관리</td></tr>
        <tr><td>Cloudflare, Inc.</td><td>서버 운영 및 데이터 저장</td></tr>
        <tr><td>Resend Inc.</td><td>이메일 발송</td></tr>
      </tbody>
    </table>

    <h2>제6조 (이용자의 권리와 행사 방법)</h2>
    <ul>
      <li>이용자는 언제든지 다음 권리를 행사할 수 있습니다.
        <ol>
          <li>개인정보 열람 요구</li>
          <li>오류 정정 요구</li>
          <li>삭제 요구</li>
          <li>처리 정지 요구</li>
        </ol>
      </li>
      <li>권리 행사는 mobin_info@mobin-inc.com 으로 이메일 문의 또는 서비스 내 회원 탈퇴를 통해 가능합니다.</li>
    </ul>

    <h2>제7조 (개인정보의 파기)</h2>
    <ul>
      <li>회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때 지체 없이 파기합니다.</li>
      <li>전자적 파일 형태의 정보는 복구 및 재생이 불가능한 기술적 방법으로 파기합니다.</li>
    </ul>

    <h2>제8조 (개인정보 보호를 위한 기술적·관리적 대책)</h2>
    <ul>
      <li>비밀번호 암호화 저장 (bcrypt)</li>
      <li>HTTPS를 통한 데이터 암호화 전송</li>
      <li>접근 권한 최소화 및 내부 관리 절차 수립</li>
      <li>민감 정보(API 키, 결제 정보 등) 환경 변수 분리 관리</li>
    </ul>

    <h2>제9조 (쿠키의 사용)</h2>
    <ul>
      <li>회사는 로그인 상태 유지를 위해 브라우저 localStorage를 사용합니다.</li>
      <li>이용자는 브라우저 설정을 통해 저장된 정보를 삭제할 수 있습니다.</li>
    </ul>

    <h2>제10조 (개인정보 보호책임자)</h2>
    <ul>
      <li><strong>개인정보 관리책임자</strong>: 안중경</li>
      <li><strong>소속/직위</strong>: (주)모빈</li>
      <li><strong>이메일</strong>: mobin_info@mobin-inc.com</li>
      <li><strong>주소</strong>: 서울시 구로구 디지털로31길 12, 본관 2층 2호 넥스트데이 (구로동, 티피타워)</li>
    </ul>
    <p>개인정보 관련 불만 처리 및 피해 구제를 위해 아래 기관에 문의하실 수 있습니다.</p>
    <ul>
      <li>개인정보 침해 신고센터: privacy.kisa.or.kr / 118</li>
      <li>대검찰청 사이버수사과: www.spo.go.kr / 1301</li>
      <li>경찰청 사이버안전국: cyberbureau.police.go.kr / 182</li>
    </ul>

    <h2>부칙</h2>
    <p>본 방침은 2025년 1월 1일부터 시행됩니다.</p>
    <br>
    <p style="font-size:13px;color:#8e9ab4;">(주)모빈 &nbsp;|&nbsp; 사업자등록번호: 통신판매업신고 2018-서울서초-0006호</p>
  </div>
</div>
`)
}

// ============================================================
// 이용방법 가이드 페이지
// ============================================================
export function guidePage(): string {
  return landingHtml('이용방법 - EV-Wash', `
<style>
body { background: #f4f7fb; color: #1a202c; }

.guide-header {
  background: #0a1628;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  padding-top: env(safe-area-inset-top);
}
.guide-header-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
}
.guide-header-inner a {
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255,255,255,.08);
  flex-shrink: 0;
}
.guide-header-inner h1 {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
}

/* 탭 영역 - 히어로 아래 눈에 띄게 */
.tab-section {
  background: #fff;
  padding: 20px 16px;
  border-bottom: 1px solid #eef1f7;
  position: sticky;
  top: 52px;
  z-index: 50;
  box-shadow: 0 2px 12px rgba(10,22,40,.08);
}
.tab-section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8e9ab4;
  text-align: center;
  margin-bottom: 10px;
}
.tab-bar {
  display: flex;
  gap: 10px;
  max-width: 480px;
  margin: 0 auto;
}
.tab-btn {
  flex: 1;
  padding: 16px 0;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all .2s;
  letter-spacing: -0.01em;
}
.tab-btn.active {
  background: #bef264;
  color: #0a1628;
  border-color: #a3e635;
  box-shadow: 0 4px 16px rgba(132,204,22,.35);
}
.tab-btn:not(.active) {
  background: #f4f7fb;
  color: #6b7280;
  border-color: #e2e8f0;
}

/* 히어로 배너 */
.guide-hero {
  background: linear-gradient(135deg, #0a1628 0%, #1a2f5e 100%);
  padding: 32px 20px 36px;
  text-align: center;
}
.guide-hero .hero-icon {
  font-size: 52px;
  margin-bottom: 14px;
  display: block;
  filter: drop-shadow(0 0 18px rgba(132,204,22,.4));
}
.guide-hero h2 {
  font-size: 22px;
  font-weight: 800;
  color: #bef264;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}
.guide-hero p {
  font-size: 14px;
  color: rgba(255,255,255,.55);
  line-height: 1.7;
}

/* 단계 카드 */
.guide-body {
  padding: 20px 16px 40px;
  max-width: 480px;
  margin: 0 auto;
}
.section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #84cc16;
  text-transform: uppercase;
  margin-bottom: 12px;
  margin-top: 24px;
}
.section-label:first-child { margin-top: 0; }

.step-card {
  background: #fff;
  border-radius: 16px;
  padding: 18px 16px;
  margin-bottom: 10px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  box-shadow: 0 1px 4px rgba(10,22,40,.06);
  border: 1px solid #eef1f7;
}
.step-num {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f0ffd4;
  color: #65a30d;
  font-size: 15px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.step-content h3 {
  font-size: 15px;
  font-weight: 700;
  color: #0a1628;
  margin-bottom: 4px;
}
.step-content p {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.65;
}
.step-content .tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 4px 10px;
}
.step-content .tip i { font-size: 11px; }

/* 포인트 카드 */
.point-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(10,22,40,.06);
  border: 1px solid #eef1f7;
}
.point-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.point-card h3 { font-size: 14px; font-weight: 700; color: #0a1628; margin-bottom: 3px; }
.point-card p { font-size: 13px; color: #6b7280; line-height: 1.55; }

/* FAQ */
.faq-item {
  background: #fff;
  border-radius: 14px;
  margin-bottom: 8px;
  border: 1px solid #eef1f7;
  overflow: hidden;
}
.faq-q {
  padding: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1a202c;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  user-select: none;
}
.faq-q i { color: #8e9ab4; font-size: 12px; transition: transform .2s; flex-shrink: 0; }
.faq-q.open i { transform: rotate(180deg); }
.faq-a {
  padding: 0 16px;
  font-size: 13px;
  color: #4a5568;
  line-height: 1.7;
  max-height: 0;
  overflow: hidden;
  transition: max-height .3s ease, padding .3s;
}
.faq-a.open {
  max-height: 300px;
  padding: 0 16px 16px;
}

/* CTA 버튼 */
.cta-wrap {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cta-btn-main {
  display: block;
  width: 100%;
  padding: 16px;
  background: #bef264;
  color: #0a1628;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 800;
  text-align: center;
  text-decoration: none;
  box-shadow: 0 4px 16px rgba(132,204,22,.3);
}
.cta-btn-sub {
  display: block;
  width: 100%;
  padding: 15px;
  background: #fff;
  color: #1a2f5e;
  border: 1.5px solid #dde3ef;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}

/* 탭 패널 */
.tab-panel { display: none; }
.tab-panel.active { display: block; }
</style>

<!-- 헤더 (탭 없음) -->
<div class="guide-header">
  <div class="guide-header-inner">
    <a href="/"><i class="fas fa-arrow-left"></i></a>
    <h1>이용방법</h1>
  </div>
</div>

<!-- 공통 탭 바 - 두 패널 위에 단 한 번만 -->
<div class="tab-section">
  <div class="tab-section-label">이용 대상 선택</div>
  <div class="tab-bar">
    <button class="tab-btn active" onclick="switchTab('customer')" id="tab-customer">
      <i class="fas fa-user" style="margin-right:7px"></i>이용 고객
    </button>
    <button class="tab-btn" onclick="switchTab('owner')" id="tab-owner">
      <i class="fas fa-gas-pump" style="margin-right:7px"></i>주유소 사장님
    </button>
  </div>
</div>

<!-- ==================== 고객 탭 ==================== -->
<div id="panel-customer" class="tab-panel active">
  <div class="guide-hero">
    <span class="hero-icon">🚗</span>
    <h2>세차 쿠폰, 이렇게 쓰세요</h2>
    <p>앱에서 쿠폰을 구매하고<br>주유소 QR코드를 찍으면 끝!</p>
  </div>

  <div class="guide-body">
    <p class="section-label">이용 순서</p>

    <div class="step-card">
      <div class="step-num">1</div>
      <div class="step-content">
        <h3>회원가입 / 로그인</h3>
        <p>이메일 또는 카카오·네이버 소셜 계정으로 30초 만에 가입하세요.</p>
      </div>
    </div>

    <div class="step-card">
      <div class="step-num">2</div>
      <div class="step-content">
        <h3>주유소 찾기</h3>
        <p>내 위치 기반 또는 지역명·주유소명으로 원하는 주유소를 검색하세요.</p>
      </div>
    </div>

    <div class="step-card">
      <div class="step-num">3</div>
      <div class="step-content">
        <h3>쿠폰 구매</h3>
        <p>원하는 세차 쿠폰을 선택하고 카드·계좌이체 등 편한 결제 수단으로 결제하세요.</p>
      </div>
    </div>

    <div class="step-card">
      <div class="step-num">4</div>
      <div class="step-content">
        <h3>주유소 방문 후 앱에서 QR 스캔</h3>
        <p>주유소에 도착하면 <b style="color:#0a1628">내 쿠폰 → 해당 주유소 선택 → 구매 내역에서 'QR 사용' 버튼</b>을 눌러 카메라를 활성화하세요.<br>주유소에 부착된 QR코드를 카메라로 비추면 자동으로 인식되며 쿠폰이 차감됩니다.</p>
        <span class="tip"><i class="fas fa-exclamation-circle"></i>스마트폰 기본 카메라로는 사용 처리가 되지 않습니다. 반드시 앱 내 'QR 사용' 버튼을 이용하세요</span>
      </div>
    </div>

    <p class="section-label" style="margin-top:28px">알아두면 좋은 점</p>

    <div class="point-card">
      <div class="point-icon" style="background:#f0ffd4"><i class="fas fa-infinity" style="color:#65a30d"></i></div>
      <div>
        <h3>유효기간 없음</h3>
        <p>구매한 쿠폰은 유효기간이 없어요. 천천히 사용하세요.</p>
      </div>
    </div>

    <div class="point-card">
      <div class="point-icon" style="background:#eff6ff"><i class="fas fa-rotate-left" style="color:#2563eb"></i></div>
      <div>
        <h3>언제든지 환불 가능</h3>
        <p>미사용 쿠폰은 언제든지 환불 신청할 수 있어요.</p>
      </div>
    </div>

    <div class="point-card">
      <div class="point-icon" style="background:#fff5f5"><i class="fas fa-shield-alt" style="color:#ef4444"></i></div>
      <div>
        <h3>폐업 시 전액 환불</h3>
        <p>주유소가 폐업하면 미사용 쿠폰은 자동으로 전액 환불됩니다.</p>
      </div>
    </div>

    <p class="section-label" style="margin-top:28px">자주 묻는 질문</p>

    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">
        쿠폰 한 장으로 여러 번 사용할 수 있나요?
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="faq-a">쿠폰마다 포함된 세차 횟수가 다릅니다. 예를 들어 3회권은 한 장으로 세 번 방문해 쓸 수 있어요. 쿠폰 상세에서 남은 횟수를 확인하세요.</div>
    </div>

    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">
        환불하면 얼마나 돌려받나요?
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="faq-a">실제 결제 금액 ÷ 총 횟수 × 남은 횟수로 계산됩니다. 카드 결제는 3~4 영업일, 계좌이체는 즉시 처리돼요.</div>
    </div>

    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">
        다른 주유소 쿠폰으로 사용할 수 있나요?
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="faq-a">아니요, 쿠폰은 구매한 주유소에서만 사용할 수 있어요.</div>
    </div>

    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">
        일반 카메라 앱으로 QR을 찍으면 안 되나요?
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="faq-a">스마트폰 기본 카메라로 QR코드를 찍으면 링크가 열리지만 쿠폰 사용 처리는 되지 않습니다. 쿠폰 차감은 로그인된 EV-Wash 앱 안에서만 가능하기 때문에, 반드시 <b>내 쿠폰 → 주유소 선택 → 'QR 사용' 버튼</b>을 통해 카메라를 열어야 합니다.</div>
    </div>

    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">
        QR 사용 버튼은 어디에 있나요?
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="faq-a">하단 메뉴 '내 쿠폰' → 주유소를 선택 → 구매 내역 카드에서 <b>'QR 사용'</b> 버튼을 찾을 수 있습니다. 버튼을 누르면 카메라가 자동으로 켜지고, 주유소에 부착된 QR코드를 비추면 즉시 인식됩니다.</div>
    </div>

    <div class="cta-wrap">
      <a href="/login" class="cta-btn-main">지금 시작하기</a>
      <a href="/stations" class="cta-btn-sub"><i class="fas fa-map-marker-alt" style="margin-right:6px"></i>주유소 둘러보기</a>
    </div>
  </div>
</div>

<!-- ==================== 사장님 탭 ==================== -->
<div id="panel-owner" class="tab-panel">
  <div class="guide-hero">
    <span class="hero-icon">⛽</span>
    <h2>입점부터 정산까지</h2>
    <p>간단한 신청으로 쿠폰을 등록하고<br>고객을 유치해 매출을 올리세요</p>
  </div>

  <div class="guide-body">
    <p class="section-label">입점 신청 순서</p>

    <div class="step-card">
      <div class="step-num">1</div>
      <div class="step-content">
        <h3>사장님 계정 만들기</h3>
        <p>회원가입 시 '주유소 사장님'을 선택하고 이메일로 가입하세요.</p>
      </div>
    </div>

    <div class="step-card">
      <div class="step-num">2</div>
      <div class="step-content">
        <h3>주유소 등록 신청</h3>
        <p>대시보드 → 주유소 등록 신청에서 주유소명, 주소, 사업자등록번호, 정산 계좌를 입력하세요.</p>
        <span class="tip"><i class="fas fa-clock"></i>심사 1~2 영업일 소요</span>
      </div>
    </div>

    <div class="step-card">
      <div class="step-num">3</div>
      <div class="step-content">
        <h3>심사 승인 후 쿠폰 등록</h3>
        <p>승인 완료 알림 메일을 받으면 주유소 관리 → 쿠폰 탭에서 쿠폰을 만드세요. 가격·횟수·설명을 자유롭게 설정할 수 있어요.</p>
      </div>
    </div>

    <div class="step-card">
      <div class="step-num">4</div>
      <div class="step-content">
        <h3>QR코드 종이 출력·비치</h3>
        <p>주유소 관리 → QR 탭에서 내 주유소 전용 QR코드를 출력하세요. 세차기 옆이나 입구에 붙여두면 고객이 직접 스캔합니다.</p>
        <span class="tip"><i class="fas fa-print"></i>QR코드는 언제든지 재출력 가능합니다</span>
      </div>
    </div>

    <!-- 쿠폰 인증 화면 안내 카드 -->
    <div style="margin:4px 0 10px;background:#0a1628;border-radius:16px;padding:18px 16px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="width:28px;height:28px;border-radius:8px;background:#bef264;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="fas fa-shield-check" style="color:#0a1628;font-size:13px"></i>
        </div>
        <span style="font-size:13px;font-weight:800;color:#bef264;letter-spacing:-0.01em">고객 화면으로 진짜 쿠폰 확인하는 법</span>
      </div>
      <p style="font-size:13px;color:rgba(255,255,255,.7);line-height:1.7;margin-bottom:12px">고객이 QR 스캔에 성공하면 아래와 같은 <b style="color:#fff">사용 완료 화면</b>이 즉시 표시됩니다. 이 화면을 눈으로 확인한 후 세차를 진행하세요.</p>
      <!-- 미리보기 모형 -->
      <div style="background:#1a2f5e;border-radius:12px;padding:14px;margin-bottom:10px">
        <div style="text-align:center;margin-bottom:10px">
          <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:#84cc16;margin-bottom:2px">사용 일시</div>
          <div style="font-size:13px;font-weight:700;color:#bef264">2026-03-31 (화)</div>
          <div style="font-size:26px;font-weight:900;color:#f0ffd4;letter-spacing:0.05em;line-height:1.1">14:32:07</div>
          <div style="font-size:9px;color:rgba(255,255,255,.4);margin-top:3px">↑ 실제 화면에서는 초단위로 움직입니다</div>
        </div>
        <div style="background:rgba(255,255,255,.08);border-radius:8px;padding:10px 12px;font-size:12px;color:rgba(255,255,255,.8);line-height:1.9">
          <div><i class="fas fa-gas-pump" style="color:#84cc16;margin-right:6px"></i><b style="color:#fff">주유소명</b> 표시</div>
          <div><i class="fas fa-ticket-alt" style="color:#84cc16;margin-right:6px"></i><b style="color:#fff">쿠폰명</b> 표시</div>
          <div><i class="fas fa-layer-group" style="color:#84cc16;margin-right:6px"></i>사용 후 <b style="color:#bef264">잔여 횟수</b> 표시</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;align-items:flex-start">
        <i class="fas fa-exclamation-circle" style="color:#fbbf24;font-size:13px;margin-top:2px;flex-shrink:0"></i>
        <p style="font-size:12px;color:rgba(255,255,255,.55);line-height:1.65">시계가 실시간으로 움직이는 것이 정품 인증의 핵심입니다. 화면이 멈춰 있거나 캡처 이미지라면 정상 사용이 아닙니다.</p>
      </div>
    </div>

    <div class="step-card">
      <div class="step-num">5</div>
      <div class="step-content">
        <h3>정산 받기</h3>
        <p>고객이 실제로 사용한 쿠폰 금액에서 플랫폼 수수료를 제한 금액이 등록된 계좌로 정산됩니다.</p>
        <span class="tip"><i class="fas fa-info-circle"></i>미사용 쿠폰 금액은 플랫폼 보관 후 환불 시 고객에게 반환</span>
      </div>
    </div>

    <p class="section-label" style="margin-top:28px">운영 팁</p>

    <div class="point-card">
      <div class="point-icon" style="background:#f0ffd4"><i class="fas fa-ticket-alt" style="color:#65a30d"></i></div>
      <div>
        <h3>다양한 쿠폰 구성 추천</h3>
        <p>1회권 외에 3회·5회 묶음권을 만들면 고객 재방문율이 올라가요.</p>
      </div>
    </div>

    <div class="point-card">
      <div class="point-icon" style="background:#eff6ff"><i class="fas fa-percent" style="color:#2563eb"></i></div>
      <div>
        <h3>할인율 설정으로 노출 우선순위 올리기</h3>
        <p>정가 대비 할인된 쿠폰은 고객 검색 목록에서 더 눈에 띄어요.</p>
      </div>
    </div>

    <div class="point-card">
      <div class="point-icon" style="background:#fff5f5"><i class="fas fa-chart-line" style="color:#ef4444"></i></div>
      <div>
        <h3>사용 내역으로 매출 관리</h3>
        <p>주유소 관리 → 사용내역 탭에서 일별·쿠폰별 사용 현황을 실시간으로 확인하세요.</p>
      </div>
    </div>

    <p class="section-label" style="margin-top:28px">자주 묻는 질문</p>

    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">
        수수료는 얼마인가요?
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="faq-a">현재 고객이 실제 사용한 금액의 15%입니다. 미사용 쿠폰에는 수수료가 발생하지 않아요. 수수료율은 사전 공지 후 변경될 수 있습니다.</div>
    </div>

    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">
        주유소가 여러 개면 어떻게 하나요?
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="faq-a">한 계정으로 여러 주유소를 등록할 수 있어요. 대시보드에서 '주유소 추가 등록' 버튼을 눌러 신청하세요.</div>
    </div>

    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">
        신청이 반려되면 어떻게 되나요?
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="faq-a">반려 사유가 대시보드에 표시됩니다. 내용을 수정한 후 재신청 버튼을 눌러 다시 신청하시면 됩니다.</div>
    </div>

    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)">
        폐업하면 고객 쿠폰은 어떻게 되나요?
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="faq-a">관리자가 폐업 처리하는 순간 미사용 쿠폰이 고객에게 전액 자동 환불됩니다. 사전에 고객에게 안내해 주세요.</div>
    </div>

    <div class="cta-wrap">
      <a href="/owner/login" class="cta-btn-main">사장님 로그인</a>
      <a href="/owner/apply" class="cta-btn-sub"><i class="fas fa-plus" style="margin-right:6px"></i>주유소 등록 신청하기</a>
    </div>
  </div>
</div>

<script>
function switchTab(id) {
  document.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById('panel-'+id).classList.add('active');
  document.getElementById('tab-customer').classList.toggle('active', id==='customer');
  document.getElementById('tab-owner').classList.toggle('active', id==='owner');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function toggleFaq(el) {
  var ans = el.nextElementSibling;
  var isOpen = ans.classList.contains('open');
  el.closest('.tab-panel').querySelectorAll('.faq-a').forEach(function(a){ a.classList.remove('open'); });
  el.closest('.tab-panel').querySelectorAll('.faq-q').forEach(function(q){ q.classList.remove('open'); });
  if (!isOpen) { ans.classList.add('open'); el.classList.add('open'); }
}
// 초기 탭 상태 설정
document.addEventListener('DOMContentLoaded', function(){
  document.getElementById('tab-customer').classList.add('active');
  document.getElementById('tab-owner').classList.remove('active');
});
</script>
`)
}

export function proposalPage(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>EV-Wash 제안서</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Noto Sans KR',sans-serif;background:#bbb;display:flex;justify-content:center;padding:24px}
  .print-btn{position:fixed;top:16px;right:16px;background:#0a1628;color:#bef264;border:2px solid #84cc16;padding:10px 22px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;z-index:999}
  .page{width:210mm;height:297mm;background:#fff;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.22);overflow:hidden}

  /* 헤더 */
  .hd{background:#0a1628;padding:32px 44px 28px;flex-shrink:0}
  .logo-row{display:flex;align-items:center;gap:12px;margin-bottom:16px}
  .logo-icon{width:54px;height:54px;background:#84cc16;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:32px}
  .logo-name{font-size:38px;font-weight:900;color:#bef264;letter-spacing:-1px}
  .logo-sub{font-size:12px;color:rgba(255,255,255,.4);margin-top:2px}
  .hd-headline{font-size:27px;font-weight:900;color:#fff;line-height:1.45;letter-spacing:-.5px}
  .hd-headline em{color:#bef264;font-style:normal}

  /* 본문 */
  .body{flex:1;padding:28px 44px;display:flex;flex-direction:column;gap:20px}

  /* 가치 카드 2개 */
  .value-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .val-card{border-radius:18px;padding:32px 28px;display:flex;align-items:center;gap:18px}
  .val-card.dark{background:#0a1628}
  .val-card.lime{background:#84cc16}
  .val-ico{font-size:50px;line-height:1;flex-shrink:0}
  .val-title{font-size:21px;font-weight:900;line-height:1.4;letter-spacing:-.4px}
  .val-card.dark .val-title{color:#fff}
  .val-card.lime .val-title{color:#0a1628}

  /* 5단계 */
  .flow{display:flex;align-items:center;justify-content:space-between;background:#f7f9fc;border-radius:18px;padding:28px 20px}
  .step{display:flex;flex-direction:column;align-items:center;flex:1}
  .arrow{font-size:26px;color:#84cc16;font-weight:900;flex-shrink:0}
  .step-ico{font-size:50px;line-height:1;margin-bottom:12px}
  .step-name{font-size:17px;font-weight:900;color:#0a1628}
  .step.hl{background:#84cc16;border-radius:14px;padding:10px 6px}
  .step-sub{font-size:11px;color:rgba(10,22,40,.6);margin-top:4px;text-align:center;line-height:1.5}

  /* 세차기 풀가동 */
  .engine-box{background:#0a1628;border-radius:18px;padding:34px 38px;flex:1;display:flex;flex-direction:column;justify-content:center;gap:10px}
  .engine-tag{font-size:13px;color:#84cc16;font-weight:700;letter-spacing:.5px}
  .engine-title{font-size:30px;font-weight:900;color:#fff;line-height:1.35;letter-spacing:-.5px}
  .engine-title em{color:#bef264;font-style:normal}

  /* 익일 정산 강조 */
  .pay-box{background:#84cc16;border-radius:18px;padding:34px 38px;flex:1;display:flex;flex-direction:column;justify-content:center;gap:10px}
  .pay-tag{font-size:13px;color:rgba(10,22,40,.5);font-weight:700;letter-spacing:.5px}
  .pay-title{font-size:30px;font-weight:900;color:#0a1628;line-height:1.35;letter-spacing:-.5px}

  .big-row{display:flex;gap:16px;flex:1}

  /* 푸터 */
  .footer{background:#0a1628;padding:20px 44px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
  .ft-brand{font-size:22px;font-weight:900;color:#bef264}
  .ft-url{font-size:12px;color:rgba(255,255,255,.3);margin-top:2px}
  .ft-cta{background:#84cc16;color:#0a1628;font-size:15px;font-weight:900;padding:14px 32px;border-radius:10px;border:none;cursor:pointer;font-family:inherit}
  .ft-contact{font-size:11px;color:rgba(255,255,255,.3);text-align:right}

  @media print{body{background:#fff;padding:0}.page{box-shadow:none}@page{size:A4 portrait;margin:0}.print-btn{display:none}}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">🖨️ 인쇄 / PDF 저장</button>
<div class="page">

  <div class="hd">
    <div class="logo-row">
      <div class="logo-icon">⚡</div>
      <div><div class="logo-name">EV-Wash</div><div class="logo-sub">전기차 세차 쿠폰 플랫폼</div></div>
    </div>
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px">
      <div class="hd-headline">자동세차기로 <em>전기차 고객</em>을 유치하고<br><em>수익을 극대화</em>하세요.</div>
      <div style="flex-shrink:0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:10px 18px;text-align:center;margin-top:4px">
        <div style="font-size:16px;font-weight:900;color:#fff;letter-spacing:-.3px">ev-wash.com</div>
        <div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:3px">무료 등록 신청</div>
      </div>
    </div>
  </div>

  <div class="body">

    <div class="value-row">
      <div class="val-card dark">
        <div class="val-ico">⚡</div>
        <div class="val-title">전기차는<br>세차하기 어렵습니다</div>
      </div>
      <div class="val-card lime">
        <div class="val-ico">🔄</div>
        <div class="val-title">쿠폰으로<br>재방문 단골 확보</div>
      </div>
    </div>

    <div class="flow">
      <div class="step"><div class="step-ico">🏪</div><div class="step-name">주유소 등록</div></div>
      <div class="arrow">›</div>
      <div class="step"><div class="step-ico">🎫</div><div class="step-name">쿠폰 등록</div></div>
      <div class="arrow">›</div>
      <div class="step hl">
        <div class="step-ico">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- 좌상 -->
            <rect x="2" y="2" width="20" height="20" rx="3" fill="#0a1628"/>
            <rect x="6" y="6" width="12" height="12" rx="1" fill="white"/>
            <rect x="9" y="9" width="6" height="6" fill="#0a1628"/>
            <!-- 우상 -->
            <rect x="30" y="2" width="20" height="20" rx="3" fill="#0a1628"/>
            <rect x="34" y="6" width="12" height="12" rx="1" fill="white"/>
            <rect x="37" y="9" width="6" height="6" fill="#0a1628"/>
            <!-- 좌하 -->
            <rect x="2" y="30" width="20" height="20" rx="3" fill="#0a1628"/>
            <rect x="6" y="34" width="12" height="12" rx="1" fill="white"/>
            <rect x="9" y="37" width="6" height="6" fill="#0a1628"/>
            <!-- 데이터 도트 -->
            <rect x="30" y="30" width="5" height="5" rx="1" fill="#0a1628"/>
            <rect x="37" y="30" width="5" height="5" rx="1" fill="#0a1628"/>
            <rect x="44" y="30" width="5" height="5" rx="1" fill="#0a1628"/>
            <rect x="30" y="37" width="5" height="5" rx="1" fill="#0a1628"/>
            <rect x="44" y="37" width="5" height="5" rx="1" fill="#0a1628"/>
            <rect x="37" y="44" width="5" height="5" rx="1" fill="#0a1628"/>
            <rect x="44" y="44" width="5" height="5" rx="1" fill="#0a1628"/>
          </svg>
        </div>
        <div class="step-name" style="color:#0a1628">QR 한 장</div>
        <div class="step-sub">사장님은 붙이기만<br>손님은 찍기만</div>
      </div>
      <div class="arrow">›</div>
      <div class="step"><div class="step-ico">🚿</div><div class="step-name">세차</div></div>
      <div class="arrow">›</div>
      <div class="step"><div class="step-ico">💰</div><div class="step-name">정산 수령</div></div>
    </div>

    <!-- 두 큰 카드 -->
    <div class="big-row">
      <div class="engine-box">
        <div class="engine-tag">✦ 등록만 하면</div>
        <div class="engine-title">전기차들이<br><em>마구 찾아오고</em><br>세차기가<br><em>쉬지 못합니다</em></div>
      </div>
      <div class="pay-box">
        <div class="pay-tag">✦ 사용한 쿠폰은</div>
        <div class="pay-title">익일 바로<br>현금 지급</div>
      </div>
    </div>

  </div>

  <div class="footer">
    <div><div class="ft-brand">⚡ EV-Wash</div></div>
    <button class="ft-cta">무료 등록 신청 →</button>
    <div class="ft-contact">ev-wash.com</div>
  </div>

</div>
</body>
</html>`
}
