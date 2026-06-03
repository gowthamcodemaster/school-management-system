// apps/web/src/app/auth/login/_components/MfaForm/MfaForm.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../../../../../design-system/components/Input/Input'
import { Button } from '../../../../../design-system/components/Button'
import { Alert } from '../../../../../design-system/components/Alert/Alert'
import { useMfaVerify, useSendOtp } from '../../../../../lib/hooks/useAuth'
import { mfaSchema, type MfaFormValues } from '../../../../../lib/validations/auth.schema'

const RESEND_COOLDOWN_SECONDS = 60

export interface MfaFormProps {
  mfaToken: string
  mfaMethod: 'TOTP' | 'EMAIL_OTP'
  onBack: () => void
}

export function MfaForm({ mfaToken, mfaMethod: initialMethod, onBack }: MfaFormProps) {
  const [currentMethod, setCurrentMethod] = useState<'TOTP' | 'EMAIL_OTP'>(initialMethod)
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const verify = useMfaVerify()
  const sendOtp = useSendOtp()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema),
  })

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [])

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS)
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function handleResend() {
    sendOtp.mutate({ mfaToken })
    startCooldown()
  }

  function handleSwitchMethod() {
    const newMethod = currentMethod === 'TOTP' ? 'EMAIL_OTP' : 'TOTP'
    setCurrentMethod(newMethod)
    reset()
    if (newMethod === 'EMAIL_OTP') {
      sendOtp.mutate({ mfaToken })
      startCooldown()
    }
  }

  const onSubmit = (values: MfaFormValues) => {
    verify.mutate({
      code: values.code,
      mfaToken,
      method: currentMethod,
    })
  }

  const errorMessage = verify.isError
    ? ((verify.error as Error)?.message ?? 'Verification failed')
    : undefined

  const instructions =
    currentMethod === 'TOTP'
      ? 'Enter the 6-digit code from your authenticator app.'
      : 'Enter the 6-digit code sent to your email.'

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Two-Factor Verification
          </h1>
          <p className="text-muted-foreground text-sm">{instructions}</p>
        </div>

        {errorMessage && <Alert variant="error" message={errorMessage} />}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Input
            {...register('code')}
            id="code"
            label="Verification code"
            type="text"
            inputMode="numeric"
            placeholder="000000"
            maxLength={6}
            autoComplete="one-time-code"
            error={errors.code?.message}
            required
          />

          {currentMethod === 'EMAIL_OTP' && (
            <div className="flex justify-end">
              <button
                type="button"
                disabled={cooldown > 0}
                onClick={handleResend}
                className="text-primary text-sm hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={verify.isPending}
            loadingText="Verifying..."
          >
            Verify
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={handleSwitchMethod}>
            {currentMethod === 'TOTP' ? 'Use email instead' : 'Use authenticator app instead'}
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
            Back
          </Button>
        </form>
      </div>
    </div>
  )
}
