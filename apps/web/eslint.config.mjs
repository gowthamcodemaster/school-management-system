// apps/web/eslint.config.mjs
import { nextjs, ignores } from '@school/config/eslint-preset';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextPlugin from '@next/eslint-plugin-next';
import storybook from 'eslint-plugin-storybook';

const eslintConfig = defineConfig([
  // Shared Next.js preset (base + security, browser-aware)
  ...nextjs,

  // Next.js plugin in flat config format
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  globalIgnores([
    ...ignores,
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),

  // Storybook
  ...storybook.configs['flat/recommended'],
]);

export default eslintConfig;