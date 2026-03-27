// 이메일 유틸리티 (Resend API)

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail(apiKey: string, from: string, options: EmailOptions): Promise<boolean> {
  if (!apiKey || apiKey === 'placeholder') {
    console.log('[Email] API key not set, skipping:', options.subject)
    return true
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || 'EV-Wash <noreply@ev-wash.com>',
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
      }),
    })
    return res.ok
  } catch (err) {
    console.error('[Email] Send failed:', err)
    return false
  }
}

export function applicationApprovedEmail(stationName: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#10b981">EV-Wash 주유소 등록 승인</h2>
      <p>안녕하세요, <strong>${stationName}</strong> 사장님!</p>
      <p>주유소 등록 신청이 <strong>승인</strong>되었습니다.</p>
      <p>이제 EV-Wash 사장님 대시보드에서 쿠폰을 등록하고 관리하실 수 있습니다.</p>
      <a href="https://new-ev-wash.pages.dev/owner" 
         style="display:inline-block;background:#10b981;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
        사장님 대시보드 바로가기
      </a>
    </div>
  `
}

export function applicationRejectedEmail(stationName: string, reason: string): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#ef4444">EV-Wash 주유소 등록 반려</h2>
      <p>안녕하세요, <strong>${stationName}</strong> 사장님.</p>
      <p>죄송합니다. 주유소 등록 신청이 <strong>반려</strong>되었습니다.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0">
        <strong>반려 사유:</strong><br>${reason}
      </div>
      <p>서류를 수정하신 후 다시 신청해 주세요.</p>
      <p style="color:#6b7280;font-size:14px">문의: bensmee96@gmail.com</p>
    </div>
  `
}

export function stationClosedRefundEmail(stationName: string, refundAmount: number): string {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#f59e0b">EV-Wash 주유소 폐업 안내 및 환불</h2>
      <p>이용 중이신 <strong>${stationName}</strong>이(가) 운영을 종료하였습니다.</p>
      <p>보유하신 미사용 쿠폰에 대해 자동으로 환불 처리됩니다.</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:16px 0">
        <strong>환불 예정 금액: ${refundAmount.toLocaleString()}원</strong>
      </div>
      <p style="color:#6b7280;font-size:14px">환불은 원결제 수단으로 3-5 영업일 내 처리됩니다.</p>
      <p style="color:#6b7280;font-size:14px">문의: bensmee96@gmail.com</p>
    </div>
  `
}
