export default {
  'apps/web/**/*.{ts,tsx}': [
    'pnpm --filter web exec eslint --fix --max-warnings=0',
    'pnpm --filter web exec prettier --write',
  ],

  'apps/api/**/*.ts': [
    'pnpm --filter api exec eslint --fix --max-warnings=0',
    'pnpm --filter api exec prettier --write',
  ],

  'packages/**/*.{ts,tsx}': [
    'pnpm exec eslint --fix --max-warnings=0',
    'pnpm exec prettier --write',
  ],

  '**/*.prisma': [
    'pnpm exec prisma format',
  ],

  '**/*.{json,yml,yaml,md}': [
    'pnpm exec prettier --write',
  ],

  '**/pnpm-lock.yaml': [], 
};