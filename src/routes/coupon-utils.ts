// 쿠폰/환불 공통 유틸리티
import type { Env, JWTPayload } from '../types'

export type AppEnv = { Bindings: Env; Variables: { user: JWTPayload } }

// 토스 결제수단별 환불 안내 메시지
export function getRefundMethodNotice(method: string | null | undefined): string {
  switch (method) {
    case 'card':
      return '카드 환불은 영업일 기준 3~4일 후 처리됩니다. (카드사 정책에 따라 부분취소 불가 시 전액 취소 후 재결제 안내)'
    case 'transfer':
      return '계좌이체 환불은 즉시 처리됩니다.'
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

// Toss 에러코드 → 한국어 사용자 안내 메시지
export function getTossErrorMessage(code: string | null | undefined, defaultMsg?: string): string {
  switch (code) {
    case 'NOT_ALLOWED_PARTIAL_REFUND':
      return '해당 결제는 부분 취소가 불가능합니다. 전액 환불만 가능합니다. (카드사 정책)'
    case 'EXCEED_MAX_REFUND_DUE':
      return '환불 가능 기간이 지났습니다. (카드사별 취소 기한 초과)'
    case 'NOT_CANCELABLE_PAYMENT':
      return '취소 불가능한 결제 상태입니다.'
    case 'ALREADY_CANCELED_PAYMENT':
      return '이미 취소된 결제입니다.'
    case 'NOT_FOUND_PAYMENT':
      return '결제 정보를 찾을 수 없습니다.'
    case 'NOT_MATCHES_REFUNDABLE_AMOUNT':
      return '환불 가능 금액이 맞지 않습니다. 잠시 후 다시 시도해주세요.'
    case 'EXCEED_MAX_AMOUNT':
      return '환불 금액이 잔여 취소 가능 금액을 초과합니다.'
    case 'INVALID_REQUEST':
      return '잘못된 환불 요청입니다. 이미 취소되었거나 취소 기간이 지났을 수 있습니다.'
    case 'UNAUTHORIZED_KEY':
      return '결제 인증 오류입니다. 관리자에게 문의해주세요.'
    case 'NETWORK_ERROR':
      return '네트워크 오류로 환불에 실패했습니다. 잠시 후 다시 시도해주세요.'
    default:
      return defaultMsg || '환불 처리 중 오류가 발생했습니다. 고객센터에 문의해주세요.'
  }
}

// Toss 결제 취소 API 호출 (idempotency-key 지원)
export async function callTossCancel(
  secretKey: string,
  paymentKey: string,
  cancelAmount: number,
  cancelReason: string,
  idempotencyKey?: string
): Promise<{ ok: boolean; data: any; status: number }> {
  const authStr = btoa(`${secretKey}:`)
  const headers: Record<string, string> = {
    Authorization: `Basic ${authStr}`,
    'Content-Type': 'application/json',
  }
  // 멱등성 키: 동일 요청이 두 번 처리되지 않도록 방지
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const res = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}/cancels`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ cancelReason, cancelAmount }),
    }
  )
  const data = await res.json() as any
  return { ok: res.ok, data, status: res.status }
}

// Toss 결제 조회 API (isPartialCancelable 확인용)
export async function fetchTossPayment(
  secretKey: string,
  paymentKey: string
): Promise<{ ok: boolean; data: any }> {
  const authStr = btoa(`${secretKey}:`)
  const res = await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${authStr}`,
        'Content-Type': 'application/json',
      },
    }
  )
  const data = await res.json() as any
  return { ok: res.ok, data }
}

// Toss 테스트 결제키 여부 판단
// 테스트키: tviva...(샌드박스), test_...(레거시), local_...(로컬 더미)
export function isTossTestPayment(paymentKey: string | null | undefined): boolean {
  if (!paymentKey) return true
  return (
    paymentKey.startsWith('tviva') ||
    paymentKey.startsWith('test_') ||
    paymentKey.startsWith('local_')
  )
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
