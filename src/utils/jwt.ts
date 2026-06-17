// JWT 유틸리티 (Web Crypto API 사용 - Cloudflare Workers 호환)
import type { JWTPayload } from '../types'

function base64urlEncode(str: string): string {
  // 유니코드 안전 인코딩
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const binary = atob(str)
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export async function signJWT(payload: JWTPayload, secret: string, expiresIn = 7 * 24 * 3600): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = { ...payload, iat: now, exp: now + expiresIn }

  const headerB64 = base64urlEncode(JSON.stringify(header))
  const payloadB64 = base64urlEncode(JSON.stringify(fullPayload))
  const unsigned = `${headerB64}.${payloadB64}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsigned))
  const sigB64 = base64urlEncode(String.fromCharCode(...new Uint8Array(signature)))

  return `${unsigned}.${sigB64}`
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, sigB64] = parts
    const unsigned = `${headerB64}.${payloadB64}`

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const sigBytes = Uint8Array.from(base64urlDecode(sigB64), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(unsigned))
    if (!valid) return null

    const payload = JSON.parse(base64urlDecode(payloadB64)) as JWTPayload
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  // bcrypt 대신 PBKDF2 사용 (Cloudflare Workers 호환)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  const hashArray = new Uint8Array(bits)
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2:${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    if (stored.startsWith('$2')) {
      // 레거시 bcrypt (마이그레이션용) - 어드민 초기 비번은 별도 처리
      return false
    }
    const [, saltHex, hashHex] = stored.split(':')
    const salt = Uint8Array.from(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16)))
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    )
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      256
    )
    const hashArray = new Uint8Array(bits)
    const computed = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
    return computed === hashHex
  } catch {
    return false
  }
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function getJwtSecret(secret: string | undefined): string {
  if (!secret) throw new Error('JWT_SECRET environment variable is not configured')
  return secret
}

// KST (UTC+9) 현재 시각 → 'YYYY-MM-DD HH:MM:SS'
export function kstNow(): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000)
  return d.toISOString().replace('T', ' ').substring(0, 19)
}

// KST 오늘 날짜 → 'YYYY-MM-DD'
export function kstDate(): string {
  return kstNow().substring(0, 10)
}

// KST 어제 날짜 → 'YYYY-MM-DD'
export function kstYesterday(): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000 - 86400000)
  return d.toISOString().substring(0, 10)
}
