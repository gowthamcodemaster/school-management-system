/* eslint-disable prettier/prettier */
// apps/web/src/lib/hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi, LoginRequest, MfaVerifyRequest } from '../api/auth.api'

// ── useLogin hook ──────────────────────────────────────────────────
export function useLogin() {
  const router = useRouter()

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      if (response.mfaRequired) {
        // MFA required — handled by the form component
        return
      }
      // Store access token in memory (sessionStorage for persistence)
      sessionStorage.setItem('access_token', response.accessToken)
      router.push('/admin/dashboard')
    },
  })
}

// ── useMfaVerify hook ──────────────────────────────────────────────
export function useMfaVerify() {
  const router = useRouter()

  return useMutation({
    mutationFn: (data: MfaVerifyRequest) => authApi.verifyMfa(data),
    onSuccess: (response) => {
      sessionStorage.setItem('access_token', response.accessToken)
      router.push('/admin/dashboard')
    },
  })
}

export function useMfaSetup(accessToken: string) {
  return useMutation({
    mutationFn: () => authApi.setupMfa(accessToken),
  })
}

export function useMfaSetupVerify() {
  return useMutation({
    mutationFn: (data: { code: string; accessToken: string }) => authApi.verifySetup(data),
  })
}

export function useSendOtp() {
  return useMutation({ mutationFn: (data: { mfaToken: string }) => authApi.sendOtp(data.mfaToken) })
}

// ── useLogout hook ─────────────────────────────────────────────────
export function useLogout() {
  const router = useRouter()

  return useMutation({
    mutationFn: () => {
      const token = sessionStorage.getItem('access_token') ?? ''
      return authApi.logout(token)
    },
    onSuccess: () => {
      sessionStorage.removeItem('access_token')
      router.push('/auth/login')
    },
  })
}
