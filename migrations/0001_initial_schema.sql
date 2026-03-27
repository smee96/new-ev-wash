-- EV-Wash 초기 스키마
-- 쿠폰 유효기간 없음 (valid_days 컬럼 제거)
-- 플랫폼이 결제 금액 보유, 사용된 쿠폰만큼 익일 정산

-- ============ 사용자 ============
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT,
  user_type TEXT NOT NULL DEFAULT 'customer' CHECK(user_type IN ('customer', 'station_owner', 'admin')),
  social_provider TEXT CHECK(social_provider IN ('kakao', 'naver')),
  social_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(social_provider, social_id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_social ON users(social_provider, social_id);

-- ============ 주유소 신청 ============
CREATE TABLE IF NOT EXISTS station_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  station_name TEXT NOT NULL,
  address TEXT NOT NULL,
  address_detail TEXT,
  latitude REAL,
  longitude REAL,
  phone TEXT,
  car_wash_type TEXT NOT NULL DEFAULT 'automatic' CHECK(car_wash_type IN ('automatic', 'self', 'both')),
  business_reg_number TEXT NOT NULL,
  business_reg_image_key TEXT,       -- R2 스토리지 키
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  account_image_key TEXT,            -- R2 스토리지 키
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  reject_reason TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_station_apps_owner ON station_applications(owner_id);
CREATE INDEX IF NOT EXISTS idx_station_apps_status ON station_applications(status);

-- ============ 주유소 (승인된 주유소) ============
CREATE TABLE IF NOT EXISTS stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER REFERENCES station_applications(id),
  owner_id INTEGER NOT NULL REFERENCES users(id),
  station_name TEXT NOT NULL,
  address TEXT NOT NULL,
  address_detail TEXT,
  latitude REAL,
  longitude REAL,
  phone TEXT,
  car_wash_type TEXT NOT NULL DEFAULT 'automatic',
  business_reg_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,      -- UUID 기반 QR 코드 값
  is_active INTEGER NOT NULL DEFAULT 1,
  is_closed INTEGER NOT NULL DEFAULT 0,  -- 폐업 여부
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stations_owner ON stations(owner_id);
CREATE INDEX IF NOT EXISTS idx_stations_qr ON stations(qr_code);
CREATE INDEX IF NOT EXISTS idx_stations_location ON stations(latitude, longitude);

-- ============ 쿠폰 (주유소별, 유효기간 없음) ============
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL REFERENCES stations(id),
  title TEXT NOT NULL,
  description TEXT,
  original_price INTEGER NOT NULL,   -- 정가 (원)
  discount_price INTEGER NOT NULL,   -- 판매가 (원)
  wash_count INTEGER NOT NULL DEFAULT 1 CHECK(wash_count BETWEEN 1 AND 10),
  total_stock INTEGER,               -- NULL = 무제한
  remaining_stock INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_coupons_station ON coupons(station_id);

-- ============ 임시 주문 (토스 결제 전) ============
CREATE TABLE IF NOT EXISTS temp_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE NOT NULL,     -- 토스용 주문ID
  user_id INTEGER NOT NULL REFERENCES users(id),
  coupon_id INTEGER NOT NULL REFERENCES coupons(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'failed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL DEFAULT (datetime('now', '+30 minutes'))
);

CREATE INDEX IF NOT EXISTS idx_temp_orders_order_id ON temp_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_temp_orders_user ON temp_orders(user_id);

-- ============ 쿠폰 구매 내역 ============
CREATE TABLE IF NOT EXISTS coupon_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  coupon_id INTEGER NOT NULL REFERENCES coupons(id),
  station_id INTEGER NOT NULL REFERENCES stations(id),
  order_id TEXT NOT NULL,            -- 토스 주문ID
  payment_key TEXT,                  -- 토스 결제키
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  remaining_uses INTEGER NOT NULL,   -- 남은 사용 횟수 (wash_count * quantity)
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'used', 'refunded', 'partial_refunded')),
  -- 환불 관련 (유효기간 없음, 미사용 쿠폰은 언제든 환불)
  refunded_amount INTEGER DEFAULT 0,
  refunded_uses INTEGER DEFAULT 0,
  refunded_at TEXT,
  -- 주유소 폐업 시 강제 환불
  force_refunded INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON coupon_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_station ON coupon_purchases(station_id);
CREATE INDEX IF NOT EXISTS idx_purchases_coupon ON coupon_purchases(coupon_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON coupon_purchases(status);

-- ============ 쿠폰 사용 내역 ============
CREATE TABLE IF NOT EXISTS coupon_usages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES coupon_purchases(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  station_id INTEGER NOT NULL REFERENCES stations(id),
  coupon_id INTEGER NOT NULL REFERENCES coupons(id),
  unit_price INTEGER NOT NULL,       -- 1회 사용 금액
  wash_count_used INTEGER NOT NULL DEFAULT 1,
  qr_code TEXT NOT NULL,             -- 스캔된 QR코드
  settled INTEGER NOT NULL DEFAULT 0,  -- 정산 완료 여부
  settlement_id INTEGER,
  used_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_usages_purchase ON coupon_usages(purchase_id);
CREATE INDEX IF NOT EXISTS idx_usages_station ON coupon_usages(station_id);
CREATE INDEX IF NOT EXISTS idx_usages_settled ON coupon_usages(settled);
CREATE INDEX IF NOT EXISTS idx_usages_date ON coupon_usages(used_at);

-- ============ 정산 ============
CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL REFERENCES stations(id),
  settlement_date TEXT NOT NULL,     -- 정산 기준일 (YYYY-MM-DD)
  gross_amount INTEGER NOT NULL,     -- 사용 쿠폰 총액
  platform_fee_rate REAL NOT NULL,   -- 수수료율 (예: 0.15)
  platform_fee INTEGER NOT NULL,     -- 수수료 금액
  net_amount INTEGER NOT NULL,       -- 실지급액
  usage_count INTEGER NOT NULL,      -- 사용 건수
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TEXT,
  processed_by INTEGER REFERENCES users(id),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_settlements_station ON settlements(station_id);
CREATE INDEX IF NOT EXISTS idx_settlements_date ON settlements(settlement_date);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);

-- ============ 플랫폼 설정 ============
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============ 기본 설정값 ============
INSERT OR IGNORE INTO platform_settings (key, value, description) VALUES
  ('platform_fee_rate', '0.15', '플랫폼 수수료율 (15%)'),
  ('cs_email', 'bensmee96@gmail.com', 'CS 이메일'),
  ('service_name', 'EV-Wash', '서비스명');

-- ============ 어드민 계정 ============
INSERT OR IGNORE INTO users (email, name, phone, password_hash, user_type) VALUES
  ('admin@ev-wash.com', 'EV-Wash 관리자', '01000000000', '$2a$10$rQnYJBKJ7QBwNqhfz0JdXuLMvFcS.W7pK5u6kHmNqXH0YOaJ8Zs5u', 'admin');
-- 기본 비밀번호: admin1234 (bcrypt hash)
