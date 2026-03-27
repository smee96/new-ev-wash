# EV-Wash ⚡

전국 EV 세차 쿠폰 서비스 - 주유소 자동 세차기 전용 쿠폰 플랫폼

## 🌐 서비스 URL

- **프로덕션**: https://new-ev-wash.pages.dev
- **관리자**: https://new-ev-wash.pages.dev/admin
- **사장님**: https://new-ev-wash.pages.dev/owner

## ✅ 구현 완료

### 고객 (모바일웹)
- [x] 이메일 회원가입/로그인
- [x] 카카오/네이버 소셜 로그인
- [x] 주유소 검색 (위치기반 + 키워드)
- [x] 쿠폰 구매 (Toss Payments 연동)
- [x] 내 쿠폰 관리 (주유소별 그룹)
- [x] QR 코드 스캔으로 쿠폰 사용
- [x] 환불 요청 (미사용 쿠폰 언제든지, 부분환불 지원)
- [x] 마이페이지

### 주유소 사장님
- [x] 사장님 로그인/소셜 로그인
- [x] 주유소 등록 신청 (사업자등록증/통장사본 업로드)
- [x] 쿠폰 등록/관리 (1~10회, 자유 할인율)
- [x] QR 코드 조회/다운로드
- [x] 사용 내역 조회
- [x] 정산 현황 조회

### 어드민
- [x] 대시보드 (통계, 주간 매출 차트)
- [x] 주유소 신청 심사 (승인/반려, 이메일 알림)
- [x] 주유소 관리 (폐업 처리 → 미사용 쿠폰 자동 환불)
- [x] 회원 관리
- [x] 결제 내역
- [x] 정산 관리 (익일 정산, 수수료 설정)
- [x] 플랫폼 설정 (수수료율 조정 가능)

## 📋 비즈니스 로직

- **쿠폰 유효기간**: 없음 (미사용 시 언제든 환불 가능)
- **정산**: 사용된 쿠폰 금액만 익일 지급 (플랫폼 수수료 15% 차감)
- **폐업 처리**: 주유소 폐업 시 미사용 쿠폰 전액 자동 환불
- **결제 보관**: 고객 결제금액은 플랫폼이 보유, 사용분만 주유소에 지급

## 🔧 기술 스택

- **백엔드**: Hono (TypeScript) + Cloudflare Workers
- **DB**: Cloudflare D1 (SQLite)
- **스토리지**: Cloudflare R2 (서류 이미지)
- **배포**: Cloudflare Pages
- **결제**: Toss Payments
- **이메일**: Resend

## 🔑 환경 변수 (설정 필요)

```bash
JWT_SECRET=...                # JWT 서명 키
TOSS_CLIENT_KEY=...           # 토스 클라이언트 키
TOSS_SECRET_KEY=...           # 토스 시크릿 키
KAKAO_CLIENT_ID=...           # 카카오 앱 키
KAKAO_CLIENT_SECRET=...       # 카카오 시크릿
NAVER_CLIENT_ID=...           # 네이버 클라이언트 ID
NAVER_CLIENT_SECRET=...       # 네이버 시크릿
RESEND_API_KEY=...            # Resend API 키
APP_URL=https://new-ev-wash.pages.dev
CS_EMAIL=bensmee96@gmail.com
```

## 🚀 관리자 기본 계정

- **이메일**: admin@ev-wash.com  
- **비밀번호**: admin1234 (최초 로그인 후 변경 권장)

## ❌ 미구현 (다음 단계)

- 실제 Toss/Kakao/Naver API 키 연동
- 푸시 알림
- 지도 표시 (KakaoMap 연동)
- 앱 (Android/iOS) - 별도 문서 제공 예정

## 📱 앱 개발 문서

앱 개발사(Jenspark) 전달용 API 문서는 별도 제공 예정

---
**마지막 업데이트**: 2026-03-27  
**버전**: v2.0.0
