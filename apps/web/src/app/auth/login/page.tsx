// apps/web/src/app/auth/login/page.tsx
'use client'

import React, { useState } from 'react'
import { LoginForm } from './_components/LoginForm/LoginForm'
import { MfaForm } from './_components/MfaForm/MfaForm'
import { useRouter } from 'next/navigation'
import { MfaEnrollment } from './_components/MfaEnrollment/MfaEnrollment'

type LoginStep = 'credentials' | 'mfa-enrollment' | 'mfa-verify'

interface MfaState {
  mfaToken: string
  mfaMethod: 'TOTP' | 'EMAIL_OTP'
}

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<LoginStep>('credentials')
  const [mfaState, setMfaState] = useState<MfaState | null>(null)
  const [enrollmentToken, setEnrollmentToken] = useState<string | null>(null)

  const handleMfaRequired = (data: {
    mfaToken: string
    mfaMethod: 'TOTP' | 'EMAIL_OTP'
    mfaEnabled: boolean
  }) => {
    setMfaState({ mfaToken: data.mfaToken, mfaMethod: data.mfaMethod })
    if (!data.mfaEnabled) {
      setEnrollmentToken(data.mfaToken) // ← access token for setup
      setStep('mfa-enrollment')
    } else {
      setStep('mfa-verify')
    }
  }

  const handleBack = () => {
    setMfaState(null)
    setStep('credentials')
  }

  if (step === 'mfa-verify' && mfaState) {
    return (
      <MfaForm mfaToken={mfaState.mfaToken} mfaMethod={mfaState.mfaMethod} onBack={handleBack} />
    )
  }

  if (step === 'mfa-enrollment' && enrollmentToken) {
    return (
      <MfaEnrollment
        accessToken={enrollmentToken}
        onComplete={() => router.push('/admin/dashboard')}
        onSkip={() => router.push('/admin/dashboard')}
      />
    )
  }

  return <LoginForm onMfaRequired={handleMfaRequired} />
}
