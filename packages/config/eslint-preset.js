// packages/config/eslint-preset.js
// Flat config format — compatible with eslint.config.mjs in all apps
// Usage:
//   import { base, nestjs, nextjs } from '@repo/config/eslint-preset';
//   export default [...base, ...nestjs];  // in apps/api
//   export default [...base, ...nextjs];  // in apps/web

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import noSecrets from 'eslint-plugin-no-secrets';
import prettier from 'eslint-plugin-prettier/recommended';

// ── Shared ignore patterns ─────────────────────────────────────────
export const ignores = [
  '**/dist/**',
  '**/node_modules/**',
  '**/.next/**',
  '**/coverage/**',
  '**/build/**',
  '**/.turbo/**',
];

// ── Base config — applies to ALL apps ─────────────────────────────
export const base = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  security.configs['recommended'],
  prettier,
  {
    plugins: {
      'no-secrets': noSecrets,
    },
    rules: {
      // ── TypeScript ─────────────────────────────────────────────
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // ── Security ───────────────────────────────────────────────
'security/detect-object-injection':                'warn',
'security/detect-non-literal-regexp':              'warn',
'security/detect-non-literal-fs-filename':         'warn',
'security/detect-non-literal-require':             'warn',
'security/detect-eval-with-expression':            'error',
'security/detect-pseudoRandomBytes':               'error',
'security/detect-possible-timing-attacks':         'warn',
'security/detect-unsafe-regex':                    'error',
'security/detect-no-csrf-before-method-override':  'error',
'security/detect-buffer-noassert':                 'error',
'security/detect-child-process':                   'warn',
'security/detect-disable-mustache-escape':         'error',
'security/detect-new-buffer':                      'error',
'security/detect-bidi-characters':                 'error',

      // ── No hardcoded secrets ───────────────────────────────────
      'no-secrets/no-secrets': ['error', { tolerance: 4.2 }],
    },
  },
  // ── Test file overrides ────────────────────────────────────────
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
    rules: {
      'no-secrets/no-secrets':                   'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection':        'off',
    },
  },
];

// ── NestJS config — extends base, stricter security ───────────────
export const nestjs = [
  ...base,
  {
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/no-floating-promises':     'warn',
      '@typescript-eslint/no-unsafe-argument':       'warn',
      'security/detect-object-injection':            'error',
      'security/detect-non-literal-fs-filename':     'error',
      'security/detect-possible-timing-attacks':     'error',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
];

// ── Next.js config — extends base, browser-aware ──────────────────
export const nextjs = [
  ...base,
  {
    rules: {
      // Not relevant in browser/React context
      'security/detect-possible-timing-attacks': 'off',
    },
  },
];