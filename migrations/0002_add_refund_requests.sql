-- 환불 신청 테이블 추가
-- 사용자가 보유쿠폰에서 환불신청 → 플랫폼이 Toss 취소 처리 후 완료 기록

CREATE TABLE IF NOT EXISTS refund_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES coupon_purchases(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  station_id INTEGER NOT NULL REFERENCES stations(id),

  -- 환불 범위
  refund_uses INTEGER NOT NULL,          -- 환불 요청 횟수
  refund_amount INTEGER NOT NULL,        -- 환불 금액 (원)

  -- 환불 계산 근거
  unit_price_per_use INTEGER NOT NULL,   -- 1회당 환불단가 (할인율 반영)
  discount_rate REAL NOT NULL DEFAULT 0, -- 적용된 할인율 (0~1, 예: 0.10 = 10%)

  -- 상태
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  -- Toss 처리 결과
  toss_cancel_key TEXT,                  -- Toss 취소 transactionKey
  toss_error_code TEXT,                  -- 실패 시 에러코드
  toss_error_message TEXT,

  -- 환불 유형
  refund_type TEXT NOT NULL DEFAULT 'customer'
    CHECK(refund_type IN ('customer', 'force_closure')),  -- customer: 고객신청, force_closure: 폐업강제

  -- 결제수단 (토스 응답에서 파악)
  payment_method TEXT,                   -- 'card', 'transfer', 'virtual_account', 'mobile'
  method_notice TEXT,                    -- 결제수단별 환불 안내 메시지

  reason TEXT,                           -- 환불 사유
  admin_note TEXT,                       -- 어드민 메모

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_purchase ON refund_requests(purchase_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_station ON refund_requests(station_id);

-- coupon_purchases 에 결제수단 컬럼 추가 (Toss 결제 승인 시 저장)
ALTER TABLE coupon_purchases ADD COLUMN payment_method TEXT;
ALTER TABLE coupon_purchases ADD COLUMN toss_total_cancelled INTEGER DEFAULT 0;  -- Toss 측 누적 취소금액 (잔액 계산용)
