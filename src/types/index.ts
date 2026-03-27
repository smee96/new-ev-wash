// EV-Wash 타입 정의

export type Env = {
  DB: D1Database
  R2: R2Bucket
  JWT_SECRET: string
  TOSS_CLIENT_KEY: string
  TOSS_SECRET_KEY: string
  KAKAO_CLIENT_ID: string
  KAKAO_CLIENT_SECRET: string
  NAVER_CLIENT_ID: string
  NAVER_CLIENT_SECRET: string
  RESEND_API_KEY: string
  APP_URL: string
  CS_EMAIL: string
  TEST_MODE: string
}

export type UserType = 'customer' | 'station_owner' | 'admin'
export type SocialProvider = 'kakao' | 'naver'

export interface User {
  id: number
  email: string | null
  name: string
  phone: string | null
  user_type: UserType
  social_provider: SocialProvider | null
  social_id: string | null
  is_active: number
  created_at: string
}

export interface JWTPayload {
  userId: number
  email: string | null
  name: string
  userType: UserType
  iat?: number
  exp?: number
}

export interface Station {
  id: number
  owner_id: number
  station_name: string
  address: string
  address_detail: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  car_wash_type: 'automatic' | 'self' | 'both'
  business_reg_number: string
  bank_name: string
  account_number: string
  account_holder: string
  qr_code: string
  is_active: number
  is_closed: number
  created_at: string
}

export interface Coupon {
  id: number
  station_id: number
  title: string
  description: string | null
  original_price: number
  discount_price: number
  wash_count: number
  total_stock: number | null
  remaining_stock: number | null
  is_active: number
  created_at: string
}

export interface CouponPurchase {
  id: number
  user_id: number
  coupon_id: number
  station_id: number
  order_id: string
  payment_key: string | null
  quantity: number
  unit_price: number
  total_amount: number
  remaining_uses: number
  status: 'active' | 'used' | 'refunded' | 'partial_refunded'
  refunded_amount: number
  refunded_uses: number
  created_at: string
}
