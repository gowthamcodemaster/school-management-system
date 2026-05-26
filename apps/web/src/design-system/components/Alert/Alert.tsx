// apps/web/src/design-system/components/Alert/Alert.tsx
import React from 'react'
import { cn } from '../../../lib/utils'

type AlertVariant = 'error' | 'success' | 'warning' | 'info'

export interface AlertProps {
  message: string
  title?: string
  variant?: AlertVariant
  showIcon?: boolean
  className?: string
}

const variantStyles: Record<AlertVariant, string> = {
  error: 'bg-destructive/10 border-destructive/20 text-destructive',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const variantIcons: Record<AlertVariant, React.ReactElement> = {
  error: (
    <svg
      role="img"
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  success: (
    <svg
      role="img"
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  warning: (
    <svg
      role="img"
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg
      role="img"
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
}

export function Alert({
  message,
  title,
  variant = 'error',
  showIcon = true,
  className,
}: Readonly<AlertProps>) {
  if (!message) return null

  const variantStyle = variantStyles[variant as keyof typeof variantStyles]
  const variantIcon = variantIcons[variant as keyof typeof variantIcons]

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-md border px-4 py-3 text-sm',
        variantStyle,
        className
      )}
    >
      {showIcon && <span className="mt-0.5 shrink-0">{variantIcon}</span>}
      <div className="flex flex-col gap-0.5">
        {title && <p className="font-semibold">{title}</p>}
        <p>{message}</p>
      </div>
    </div>
  )
}

export default Alert
