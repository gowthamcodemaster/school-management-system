/* eslint-disable prettier/prettier */
// apps/web/src/design-system/components/Logo/Logo.tsx
import React from 'react'
interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon'
  className?: string
}

const sizes = {
  sm: { icon: 28, text: 'text-lg' },
  md: { icon: 36, text: 'text-2xl' },
  lg: { icon: 48, text: 'text-3xl' },
}

function getSizeConfig(size: 'sm' | 'md' | 'lg') {
  if (size === 'sm') return sizes.sm
  if (size === 'lg') return sizes.lg
  return sizes.md
}

export function Logo({ size = 'md', variant = 'full', className = '' }: Readonly<LogoProps>) {
  const { icon, text } = getSizeConfig(size)

  return (
    <div className={`flex items-center gap-2.5 ${className}`} data-testid="logo">
      {/* Icon mark — stylised book/leaf */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Background circle */}
        <rect width="48" height="48" rx="12" fill="var(--color-primary)" />

        {/* Book pages */}
        <path
          d="M24 12C24 12 14 15 14 24V36C14 36 19 33 24 33C29 33 34 36 34 36V24C34 15 24 12 24 12Z"
          fill="white"
          fillOpacity="0.95"
        />

        {/* Center spine */}
        <line x1="24" y1="12" x2="24" y2="33" stroke="var(--color-primary)" strokeWidth="1.5" />

        {/* Leaf accent */}
        <path d="M24 10C24 10 29 6 34 10C34 10 29 14 24 10Z" fill="white" fillOpacity="0.8" />
      </svg>

      {/* Wordmark */}
      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <span
            className={`${text} font-bold tracking-tight text-neutral-900`}
            style={{ letterSpacing: '-0.02em' }}
          >
            Vidya<span className="text-primary">Dhara</span>
          </span>
          {size !== 'sm' && (
            <span className="mt-0.5 text-xs uppercase tracking-wider text-neutral-500">
              School Management
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default Logo
