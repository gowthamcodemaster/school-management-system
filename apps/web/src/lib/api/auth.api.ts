/* eslint-disable prettier/prettier */
// apps/web/src/lib/api/auth.api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

// ── Types ──────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  mfaRequired?: boolean
  mfaMethod?: 'TOTP' | 'EMAIL_OTP'
  mfaToken?: string
  user?: {
    id: string
    email: string
    role: string
    firstName: string
    lastName: string
  }
}

export interface MfaVerifyRequest {
  code: string
  mfaToken: string
  method: 'TOTP' | 'EMAIL_OTP'
}

export interface RefreshResponse {
  accessToken: string
}

// ── API helpers ────────────────────────────────────────────────────
async function apiPost<TBody, TResponse>(
  path: string,
  body: TBody,
  token?: string
): Promise<TResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include', // send/receive HttpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error((error as { message?: string }).message ?? 'An error occurred')
  }

  return res.json() as Promise<TResponse>
}

// ── Auth API functions ─────────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) => apiPost<LoginRequest, LoginResponse>('/auth/login', data),

  verifyMfa: (data: MfaVerifyRequest) =>
    apiPost<MfaVerifyRequest, LoginResponse>('/auth/mfa/verify', data),

  logout: (token: string) => apiPost<Record<string, never>, void>('/auth/logout', {}, token),

  refresh: () => apiPost<Record<string, never>, RefreshResponse>('/auth/refresh', {}),
}
