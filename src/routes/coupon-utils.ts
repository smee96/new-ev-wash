// 쿠폰/환불 공통 유틸리티
import type { Env, JWTPayload } from '../types'

export type AppEnv = { Bindings: Env; Variables: { user: JWTPayload } }

// 토스 결제수단별 환불 안내 메시지
export function getRefundMethodNotice(method: string | null | undefined): string {
  switch (method) {
    case 'card':
      return '카드 결제 환불은 영업일 기준 3~4일 소요됩니다. (당일 전액취소는 즉시 처리)'
    case 'transfer':
      return '계좌이체 환불은 즉시 처리됩니다. (180일 이내 거래만 가능)'
    case 'virtual_account':
      return '가상계좌 환불은 영업일 기준 2일 소요됩니다.'
    case 'mobile':
      return '휴대폰 결제는 결제 당월에만 취소 가능합니다.'
    default:
      return '환불은 영업일 기준 3~4일 소요될 수 있습니다.'
  }
}

// 할인율 기반 1회당 환불단가 계산
// 실제 결제금액(total_amount) ÷ 총 이용횟수(wash_count × quantity) → 내림
export function calcRefundAmountPerUse(
  totalAmount: number,
  washCount: number,
  quantity: number
): number {
  const totalUses = washCount * quantity
  return Math.floor(totalAmount / totalUses)
}

// Toss 결제 취소 API 호출
export async function callTossCancel(
  secretKey: string,
  paymentKey: string,
  cancelAmount: number,
  cancelReason: string
): Promise<{ ok: boolean; data: any }> {
  const authStr = btoa(`${secretKey}:`)
  const res = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}/cancels`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authStr}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancelReason, cancelAmount }),
    }
  )
  const data = await res.json() as any
  return { ok: res.ok, data }
}

// 결제수단 정규화
export function normalizePaymentMethod(method: string | null): string {
  if (!method) return 'unknown'
  const m = method.toLowerCase()
  if (m.includes('card') || m === '카드') return 'card'
  if (m.includes('transfer') || m === '계좌이체') return 'transfer'
  if (m.includes('virtual') || m === '가상계좌') return 'virtual_account'
  if (m.includes('mobile') || m === '휴대폰') return 'mobile'
  return 'card'
}
