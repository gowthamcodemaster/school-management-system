/* eslint-disable prettier/prettier */
// apps/web/src/design-system/tokens/colors.ts
export const colors = {
  // ── Brand — Green ──────────────────────────────────────────────
  brand: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // primary
    600: '#16a34a', // primary dark
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // ── Neutral ────────────────────────────────────────────────────
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // ── Semantic ───────────────────────────────────────────────────
  semantic: {
    success: {
      light: '#dcfce7',
      base: '#22c55e',
      dark: '#15803d',
    },
    error: {
      light: '#fee2e2',
      base: '#ef4444',
      dark: '#b91c1c',
    },
    warning: {
      light: '#fef9c3',
      base: '#eab308',
      dark: '#a16207',
    },
    info: {
      light: '#dbeafe',
      base: '#3b82f6',
      dark: '#1d4ed8',
    },
  },
} as const

// ── CSS variable mapping ────────────────────────────────────────
export const cssVariables = {
  '--color-brand-50': colors.brand[50],
  '--color-brand-100': colors.brand[100],
  '--color-brand-200': colors.brand[200],
  '--color-brand-300': colors.brand[300],
  '--color-brand-400': colors.brand[400],
  '--color-brand-500': colors.brand[500],
  '--color-brand-600': colors.brand[600],
  '--color-brand-700': colors.brand[700],
  '--color-brand-800': colors.brand[800],
  '--color-brand-900': colors.brand[900],

  '--color-primary': colors.brand[600],
  '--color-primary-hover': colors.brand[700],
  '--color-primary-light': colors.brand[50],
  '--color-primary-ring': colors.brand[300],

  '--color-text-primary': colors.neutral[900],
  '--color-text-secondary': colors.neutral[600],
  '--color-text-tertiary': colors.neutral[400],
  '--color-text-inverse': colors.neutral[0],

  '--color-bg-primary': colors.neutral[0],
  '--color-bg-secondary': colors.neutral[50],
  '--color-bg-tertiary': colors.neutral[100],

  '--color-border-default': colors.neutral[200],
  '--color-border-focus': colors.brand[500],
  '--color-border-error': colors.semantic.error.base,

  '--color-error': colors.semantic.error.base,
  '--color-error-light': colors.semantic.error.light,
  '--color-success': colors.semantic.success.base,
  '--color-success-light': colors.semantic.success.light,
} as const
