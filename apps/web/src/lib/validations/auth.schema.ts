/* eslint-disable prettier/prettier */
// apps/web/src/lib/validations/auth.schema.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
})

export const mfaSchema = z.object({
  code: z
    .string()
    .min(1, 'Verification code is required')
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type MfaFormValues = z.infer<typeof mfaSchema>
