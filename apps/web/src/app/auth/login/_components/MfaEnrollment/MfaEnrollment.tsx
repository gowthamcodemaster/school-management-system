// apps/web/src/app/auth/login/_components/MfaEnrollment/MfaEnrollment.tsx
'use client'

import React, { useEffect, useState, useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '../../../../../design-system/components/Input/Input'
import { Button } from '../../../../../design-system/components/Button'
import { Alert } from '../../../../../design-system/components/Alert/Alert'
import { useMfaSetup, useMfaSetupVerify } from '../../../../../lib/hooks/useAuth'
import { mfaSchema, type MfaFormValues } from '../../../../../lib/validations/auth.schema'

export interface MfaEnrollmentProps {
  accessToken: string
  onComplete: () => void
  onSkip: () => void
}

export function MfaEnrollment({ accessToken, onComplete, onSkip }: Readonly<MfaEnrollmentProps>) {
  const [copied, setCopied] = useState(false)
  const instructionsId = useId()
  const secretDescId = useId()
  const copyStatusId = useId()

  const setup = useMfaSetup(accessToken)
  const verify = useMfaSetupVerify()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema),
  })

  // Fetch QR code on mount
  useEffect(() => {
    setup.mutate()
  }, [])

  // Call onComplete when verification succeeds
  useEffect(() => {
    if (verify.isSuccess) {
      onComplete()
    }
  }, [verify.isSuccess, onComplete])

  const onSubmit = (values: MfaFormValues) => {
    verify.mutate({ code: values.code, accessToken })
  }

  // ── Copy secret to clipboard ───────────────────────────────────
  async function handleCopy() {
    if (!setup.data?.secret) return
    await navigator.clipboard.writeText(setup.data.secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const errorMessage = verify.isError
    ? ((verify.error as Error)?.message ?? 'Verification failed')
    : undefined

  if (setup.isPending && !setup.data) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        aria-live="polite"
        aria-busy="true"
      >
        <p className="text-muted-foreground">Loading setup...</p>
      </div>
    )
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-foreground text-2xl font-bold tracking-tight">
            Set Up Two-Factor Authentication
          </h1>
          <p id={instructionsId} className="text-muted-foreground text-sm">
            Scan the QR code below with Microsoft Authenticator or any TOTP-compatible app to secure
            your account.
          </p>
        </div>

        {/* Error alert */}
        {errorMessage && <Alert variant="error" message={errorMessage} />}

        {setup.data && (
          <>
            {/* QR Code */}
            <div className="flex flex-col items-center gap-4">
              <div className="border-border rounded-xl border bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setup.data.qrCode}
                  alt="QR code for Microsoft Authenticator setup"
                  width={200}
                  height={200}
                  aria-describedby={secretDescId}
                />
              </div>

              {/* Manual entry — accessible alternative to QR code */}
              <div
                id={secretDescId}
                className="bg-muted w-full space-y-2 rounded-lg p-4"
                aria-label="Manual setup key — use this if you cannot scan the QR code"
              >
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  Can't scan? Enter this key manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-foreground flex-1 break-all font-mono text-sm">
                    {setup.data.secret}
                  </code>

                  {/* Copy button with status feedback */}
                  <div>
                    <button
                      type="button"
                      aria-label="Copy secret key to clipboard"
                      aria-describedby={copyStatusId}
                      onClick={handleCopy}
                      className="border-input hover:bg-accent focus-visible:ring-ring shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                    {/* ♿ Live region for screen reader feedback */}
                    <span
                      id={copyStatusId}
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                      className="sr-only"
                    >
                      {copied ? 'Secret key copied to clipboard' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <Input
                {...register('code')}
                id="enrollment-code"
                label="Verification code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                error={errors.code?.message}
                required
                aria-describedby={instructionsId}
              />

              <Button
                type="submit"
                fullWidth
                isLoading={verify.isPending}
                loadingText="Verifying..."
              >
                Verify & Enable MFA
              </Button>
            </form>
          </>
        )}

        {/* Skip button */}
        <Button
          type="button"
          variant="ghost"
          fullWidth
          onClick={onSkip}
          aria-label="Skip MFA setup for now — you can enable it later from your profile"
        >
          Skip for now
        </Button>
      </div>
    </div>
  )
}
