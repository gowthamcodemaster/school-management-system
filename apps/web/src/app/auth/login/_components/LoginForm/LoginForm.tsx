// apps/web/src/app/auth/login/_components/LoginForm/LoginForm.tsx
'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Logo } from '../../../../../design-system/components/Logo/Logo'
import { Input } from '../../../../../design-system/components/Input/Input'
import { Button } from '../../../../../design-system/components/Button/Button'
import { Alert } from '../../../../../design-system/components/Alert/Alert'
import { useLogin } from '../../../../../lib/hooks/useAuth'
import { loginSchema, type LoginFormValues } from '../../../../../lib/validations/auth.schema'
import type { LoginResponse } from '../../../../../lib/api/auth.api'

export interface LoginFormProps {
  onMfaRequired?: (data: {
    mfaToken: string
    mfaMethod: 'TOTP' | 'EMAIL_OTP'
    mfaEnabled: boolean
  }) => void
}

export function LoginForm({ onMfaRequired }: Readonly<LoginFormProps>) {
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  // Handle MFA required response
  useEffect(() => {
    const data = login.data as LoginResponse | undefined
    if (data?.mfaRequired && data.mfaToken && data.mfaMethod && onMfaRequired) {
      onMfaRequired({
        mfaToken: data.mfaToken,
        mfaMethod: data.mfaMethod,
        mfaEnabled: false,
      })
    }
  }, [login.data, onMfaRequired])

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values)
  }

  const errorMessage = login.isError
    ? ((login.error as Error)?.message ?? 'Something went wrong')
    : undefined

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <Logo size="lg" />
          <p className="text-muted-foreground mt-2 text-sm">Sign in to your account</p>
        </div>

        {/* Error alert */}
        {errorMessage && <Alert variant="error" message={errorMessage} />}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <Input
            {...register('email')}
            id="email"
            label="Email address"
            type="email"
            placeholder="you@vidyadhara.com"
            autoComplete="email"
            error={errors.email?.message}
            required
          />

          <Input
            {...register('password')}
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password?.message}
            required
          />

          {/* Forgot password */}
          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="texts-primary text-sm underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
