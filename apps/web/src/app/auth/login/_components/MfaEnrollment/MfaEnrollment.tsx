/* eslint-disable prettier/prettier */
'use client'
import React, { useEffect, useState } from 'react'
import { useMfaSetup, useMfaSetupVerify } from '../../../../../lib/hooks/useAuth'

interface MfaEnrollmentProps {
  accessToken: string
  onComplete: () => void
  onSkip: () => void
}

export function MfaEnrollment({ accessToken, onComplete, onSkip }: MfaEnrollmentProps) {
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')

  const setupMutation = useMfaSetup(accessToken)
  const verifyMutation = useMfaSetupVerify()

  useEffect(() => {
    setupMutation.mutate()
  }, []) // intentionally runs once on mount

  useEffect(() => {
    if (verifyMutation.isSuccess) {
      onComplete()
    }
  }, [verifyMutation.isSuccess, onComplete])

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    setCodeError('')
    if (!code) {
      setCodeError('Code is required')
      return
    }
    if (!/^\d{6}$/.test(code)) {
      setCodeError('Code must be 6 digits')
      return
    }
    verifyMutation.mutate({ code, accessToken })
  }

  function handleCopy() {
    if (setupMutation.data?.secret) {
      navigator.clipboard.writeText(setupMutation.data.secret)
    }
  }

  if (setupMutation.isPending && !setupMutation.data) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <p>Scan the QR code with your authenticator app to set up MFA.</p>

      {setupMutation.data && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setupMutation.data.qrCode} alt="QR code" />
          <p>{setupMutation.data.secret}</p>
          <button type="button" aria-label="Copy secret" onClick={handleCopy}>
            Copy
          </button>
        </>
      )}

      {verifyMutation.isError && (
        <div role="alert">{(verifyMutation.error as Error)?.message ?? 'Verification failed'}</div>
      )}

      <form onSubmit={handleSubmit}>
        <label htmlFor="mfa-code">Verification Code</label>
        <input
          id="mfa-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
        />
        {codeError && <p>{codeError}</p>}

        <button type="submit" disabled={verifyMutation.isPending}>
          {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      <button type="button" onClick={onSkip}>
        Skip
      </button>
    </div>
  )
}
