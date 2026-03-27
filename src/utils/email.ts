// Resend 이메일 유틸리티

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions, resendApiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'EV-Wash <noreply@ev-wash.com>',
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function csEmailTemplate(data: {
  customerName: string;
  customerEmail: string;
  message: string;
  type: string;
}): string {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">EV-Wash CS 문의</h2>
      <p><strong>유형:</strong> ${data.type}</p>
      <p><strong>이름:</strong> ${data.customerName}</p>
      <p><strong>이메일:</strong> ${data.customerEmail}</p>
      <p><strong>문의 내용:</strong></p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
        ${data.message.replace(/\n/g, '<br>')}
      </div>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
        EV-Wash 시스템 자동 발송
      </p>
    </div>
  `;
}

export function applicationEmailTemplate(data: {
  ownerName: string;
  stationName: string;
  status: string;
  reason?: string;
}): string {
  const isApproved = data.status === 'approved';
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">EV-Wash 주유소 등록 ${isApproved ? '승인' : '거절'} 안내</h2>
      <p>${data.ownerName}님 안녕하세요.</p>
      <p><strong>${data.stationName}</strong> 주유소 등록 신청이 ${isApproved ? '승인' : '거절'}되었습니다.</p>
      ${!isApproved && data.reason ? `<p><strong>거절 사유:</strong> ${data.reason}</p>` : ''}
      ${isApproved ? `
        <p>이제 쿠폰을 생성하고 QR 코드를 출력하여 서비스를 시작하실 수 있습니다.</p>
        <a href="https://ev-wash.com/owner" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
          대시보드 바로가기
        </a>
      ` : `<p>다시 신청하시거나 문의사항은 고객센터로 연락해 주세요.</p>`}
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">EV-Wash Team</p>
    </div>
  `;
}
