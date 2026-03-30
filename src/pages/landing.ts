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
