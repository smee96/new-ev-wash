-- EV-Wash Database Schema v1.0
-- Cloudflare D1 (SQLite)

-- ========================
-- 1. USERS (사용자)
-- ========================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT,
  user_type TEXT NOT NULL DEFAULT 'customer', -- customer | station_owner | admin
  social_provider TEXT, -- kakao | naver | null
  social_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_social ON users(social_provider, social_id);

-- ========================
-- 2. GAS STATION APPLICATIONS (주유소 등록 신청)
-- ========================
CREATE TABLE IF NOT EXISTS gas_station_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  station_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  phone TEXT NOT NULL,
  car_wash_type TEXT NOT NULL DEFAULT 'automatic', -- self | automatic | both
  business_registration TEXT NOT NULL,
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,
  business_doc_url TEXT,
  account_doc_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  rejection_reason TEXT,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  reviewed_by INTEGER,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_applications_owner ON gas_station_applications(owner_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON gas_station_applications(status);

-- ========================
-- 3. GAS STATIONS (승인된 주유소)
-- ========================
CREATE TABLE IF NOT EXISTS gas_stations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  station_name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  phone TEXT,
  car_wash_type TEXT NOT NULL DEFAULT 'automatic', -- self | automatic | both
  business_registration TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,
  qr_code TEXT UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_stations_owner ON gas_stations(owner_id);
CREATE INDEX IF NOT EXISTS idx_stations_location ON gas_stations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_stations_active ON gas_stations(is_active);

-- ========================
-- 4. COUPONS (쿠폰 템플릿)
-- ========================
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  wash_count INTEGER NOT NULL DEFAULT 1, -- 1~10회
  original_price INTEGER NOT NULL, -- 원가 (원)
  discount_price INTEGER NOT NULL, -- 판매가 (원)
  valid_days INTEGER, -- 구매일로부터 유효기간(일), NULL=무제한
  remaining_quantity INTEGER NOT NULL DEFAULT 9999, -- 재고
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES gas_stations(id)
);

CREATE INDEX IF NOT EXISTS idx_coupons_station ON coupons(station_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

-- ========================
-- 5. TEMPORARY ORDERS (임시 주문 - 결제 전)
-- ========================
CREATE TABLE IF NOT EXISTS temporary_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL,
  coupon_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | completed | failed | expired
  payment_key TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);

CREATE INDEX IF NOT EXISTS idx_temp_orders_customer ON temporary_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_temp_orders_order_id ON temporary_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_temp_orders_status ON temporary_orders(status);

-- ========================
-- 6. COUPON PURCHASES (쿠폰 구매 완료)
-- ========================
CREATE TABLE IF NOT EXISTS coupon_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  coupon_id INTEGER NOT NULL,
  station_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1, -- 구매 수량 (잔여 포함)
  used_quantity INTEGER NOT NULL DEFAULT 0, -- 사용한 수량
  unit_price INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  payment_method TEXT DEFAULT 'toss',
  payment_status TEXT NOT NULL DEFAULT 'completed', -- completed | refunded | partial_refunded
  payment_key TEXT,
  order_id TEXT,
  expires_at DATETIME, -- 유효기간 (NULL=무제한)
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (station_id) REFERENCES gas_stations(id)
);

CREATE INDEX IF NOT EXISTS idx_purchases_customer ON coupon_purchases(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_coupon ON coupon_purchases(coupon_id);
CREATE INDEX IF NOT EXISTS idx_purchases_station ON coupon_purchases(station_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON coupon_purchases(payment_status);

-- ========================
-- 7. COUPON USAGES (쿠폰 사용 기록)
-- ========================
CREATE TABLE IF NOT EXISTS coupon_usages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL,
  coupon_id INTEGER NOT NULL,
  station_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_by INTEGER, -- 검증한 사장님 ID (NULL=고객 직접 사용)
  FOREIGN KEY (purchase_id) REFERENCES coupon_purchases(id),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (station_id) REFERENCES gas_stations(id),
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_usages_purchase ON coupon_usages(purchase_id);
CREATE INDEX IF NOT EXISTS idx_usages_station ON coupon_usages(station_id);
CREATE INDEX IF NOT EXISTS idx_usages_customer ON coupon_usages(customer_id);
CREATE INDEX IF NOT EXISTS idx_usages_date ON coupon_usages(used_at);

-- ========================
-- 8. CANCELLATIONS (취소/환불 내역)
-- ========================
CREATE TABLE IF NOT EXISTS cancellations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  cancel_quantity INTEGER NOT NULL,
  refund_amount INTEGER NOT NULL,
  cancel_fee INTEGER NOT NULL DEFAULT 0, -- 취소 수수료
  cancel_reason TEXT,
  status TEXT NOT NULL DEFAULT 'completed', -- completed | failed
  payment_key TEXT,
  toss_cancel_id TEXT,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (purchase_id) REFERENCES coupon_purchases(id),
  FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_cancellations_purchase ON cancellations(purchase_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_customer ON cancellations(customer_id);

-- ========================
-- 9. SETTLEMENTS (정산)
-- ========================
CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  station_id INTEGER NOT NULL,
  settlement_date TEXT NOT NULL, -- YYYY-MM-DD (정산 기준일 = 전날 사용분)
  total_used_count INTEGER NOT NULL DEFAULT 0, -- 사용된 쿠폰 수
  total_used_amount INTEGER NOT NULL DEFAULT 0, -- 총 사용 금액 (할인가 기준)
  platform_fee_rate REAL NOT NULL DEFAULT 0.15, -- 플랫폼 수수료율
  platform_fee INTEGER NOT NULL DEFAULT 0, -- 플랫폼 수수료
  settlement_amount INTEGER NOT NULL DEFAULT 0, -- 정산 금액 (주유소 수령)
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | completed
  processed_at DATETIME,
  processed_by INTEGER,
  memo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES gas_stations(id),
  FOREIGN KEY (processed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_settlements_station ON settlements(station_id);
CREATE INDEX IF NOT EXISTS idx_settlements_date ON settlements(settlement_date);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_settlements_unique ON settlements(station_id, settlement_date);

-- ========================
-- 10. PLATFORM SETTINGS (플랫폼 설정)
-- ========================
CREATE TABLE IF NOT EXISTS platform_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 기본 설정값
INSERT OR IGNORE INTO platform_settings (setting_key, setting_value, description) VALUES
  ('platform_fee_rate', '0.15', '플랫폼 수수료율 (15%)'),
  ('cancel_fee_hours', '24', '수수료 없는 취소 가능 시간 (시간)'),
  ('cancel_fee_rate', '0.033', '24시간 이후 취소 수수료율 (3.3%)'),
  ('cs_email', 'bensmee96@gmail.com', 'CS 이메일');
