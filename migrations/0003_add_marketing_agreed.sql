-- 마케팅·광고 수신 동의 컬럼 추가
ALTER TABLE users ADD COLUMN marketing_agreed INTEGER NOT NULL DEFAULT 0;
