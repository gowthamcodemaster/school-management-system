// apps/web/src/design-system/components/Input/Input.tsx
import React, { forwardRef, useState, useId } from 'react'
import { cn } from '../../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, required, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const generatedId = useId()
    const inputId = id ?? generatedId
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type
    const hasError = !!error

    return (
      <div className="flex w-full flex-col gap-1.5">
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="text-foreground text-sm font-medium">
            {label}
            {required && (
              <span className="text-destructive ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            type={inputType}
            required={required}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={cn(
              // Base styles
              'bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm',
              'ring-offset-background transition-colors',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'placeholder:text-muted-foreground',
              // Focus styles
              'focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              // Disabled styles
              'disabled:cursor-not-allowed disabled:opacity-50',
              // Error styles
              hasError
                ? 'border-destructive focus-visible:ring-destructive/30'
                : 'border-input hover:border-ring/50',
              // Password padding
              isPassword && 'pr-10',
              // Error icon padding
              hasError && !isPassword && 'pr-10',
              className
            )}
            {...props}
          />

          {/* Password toggle */}
          {isPassword && (
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((v) => !v)}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'text-muted-foreground hover:text-foreground transition-colors',
                'focus-visible:ring-ring rounded-sm focus-visible:outline-none focus-visible:ring-2'
              )}
            >
              {showPassword ? (
                // Eye-off icon
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
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                // Eye icon
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
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}

          {/* Error icon */}
          {hasError && !isPassword && (
            <span className="text-destructive pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
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
            </span>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-destructive flex items-center gap-1 text-xs"
          >
            {error}
          </p>
        )}

        {/* Helper text */}
        {helperText && !hasError && (
          <p id={`${inputId}-helper`} className="text-muted-foreground text-xs">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
