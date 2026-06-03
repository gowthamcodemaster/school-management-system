// apps/web/src/app/auth/login/page.tsx
'use client'

import React, { useState } from 'react'
import { LoginForm } from './_components/LoginForm/LoginForm'
import { MfaForm } from './_components/MfaForm/MfaForm'

type LoginStep = 'credentials' | 'mfa'

interface MfaState {
  mfaToken: string
  mfaMethod: 'TOTP' | 'EMAIL_OTP'
}

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('credentials')
  const [mfaState, setMfaState] = useState<MfaState | null>(null)

  const handleMfaRequired = (data: MfaState) => {
    setMfaState(data)
    setStep('mfa')
  }

  const handleBack = () => {
    setMfaState(null)
    setStep('credentials')
  }

  if (step === 'mfa' && mfaState) {
    return (
      <MfaForm mfaToken={mfaState.mfaToken} mfaMethod={mfaState.mfaMethod} onBack={handleBack} />
    )
  }

  return <LoginForm onMfaRequired={handleMfaRequired} />
}
