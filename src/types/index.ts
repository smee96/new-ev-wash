export type UserType = 'customer' | 'station_owner' | 'admin';
export type CarWashType = 'self' | 'automatic' | 'both';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partial_refunded';
export type SettlementStatus = 'pending' | 'processing' | 'completed';

export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  JWT_SECRET: string;
  TOSS_CLIENT_KEY: string;
  TOSS_SECRET_KEY: string;
  TOSS_SUCCESS_URL: string;
  TOSS_FAIL_URL: string;
  KAKAO_API_KEY: string;
  KAKAO_REDIRECT_URI: string;
  NAVER_CLIENT_ID: string;
  NAVER_CLIENT_SECRET: string;
  NAVER_REDIRECT_URI: string;
  RESEND_API_KEY: string;
  CS_EMAIL: string;
  PLATFORM_URL: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  userType: UserType;
  name: string;
  iat: number;
  exp: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  user_type: UserType;
  social_provider?: string;
  social_id?: string;
  is_active: number;
  created_at: string;
}

export interface GasStation {
  id: number;
  owner_id: number;
  station_name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  car_wash_type: CarWashType;
  qr_code?: string;
  is_active: number;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
  created_at: string;
}

export interface Coupon {
  id: number;
  station_id: number;
  title: string;
  description?: string;
  wash_count: number;
  original_price: number;
  discount_price: number;
  valid_days?: number;
  remaining_quantity: number;
  is_active: number;
  created_at: string;
}

export interface CouponPurchase {
  id: number;
  customer_id: number;
  coupon_id: number;
  station_id: number;
  quantity: number;
  used_quantity: number;
  unit_price: number;
  total_amount: number;
  payment_method: string;
  payment_status: PaymentStatus;
  payment_key?: string;
  order_id?: string;
  expires_at?: string;
  purchased_at: string;
}
