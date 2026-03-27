-- 기본 관리자 계정 생성
-- 비밀번호: Admin1234! (bcrypt hash)
INSERT OR IGNORE INTO users (email, name, phone, password_hash, user_type) VALUES
  ('admin@ev-wash.com', 'EV-Wash 관리자', '01000000000', '$2a$10$rXJ7YMqX9Kp8K5VQX1WPQeF7K4nZ2mB3cD5eF6gH7iJ8kL9mN0oP', 'admin');
