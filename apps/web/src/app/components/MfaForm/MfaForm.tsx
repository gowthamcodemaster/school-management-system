/* eslint-disable prettier/prettier */
// apps/web/src/app/auth/login/_components/MfaForm/MfaForm.tsx
'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../../../design-system/components/Input/Input'
import { Button } from '../../../design-system/components/Button/Button'
import { Alert } from '../../../design-system/components/Alert/Alert'
import { useMfaVerify } from '../../../lib/hooks/useAuth'
import { mfaSchema, type MfaFormValues } from '../../../lib/validations/auth.schema'

export interface MfaFormProps {
  mfaToken: string
  mfaMethod: 'TOTP' | 'EMAIL_OTP'
  onBack: () => void
}

export function MfaForm({ mfaToken, mfaMethod, onBack }: Readonly<MfaFormProps>) {
  const verify = useMfaVerify()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema),
  })

  const onSubmit = (values: MfaFormValues) => {
    verify.mutate({
      code: values.code,
      mfaToken,
      method: mfaMethod,
    })
  }

  const errorMessage = verify.isError
    ? ((verify.error as Error)?.message ?? 'Verification failed')
    : undefined

  const instructions =
    mfaMethod === 'TOTP'
      ? 'Enter the 6-digit code from your authenticator app.'
      : 'Enter the 6-digit code sent to your email.'

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Two-Factor Verification
          </h1>
          <p className="text-muted-foreground text-sm">{instructions}</p>
        </div>

        {/* Error alert */}
        {errorMessage && <Alert variant="error" message={errorMessage} />}

        {/* Form */}
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

          <Button type="submit" className="w-full" disabled={verify.isPending}>
            {verify.isPending ? 'Verifying...' : 'Verify'}
          </Button>

          <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
            Back
          </Button>
        </form>
      </div>
    </div>
  )
}
