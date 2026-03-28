// lint-staged.config.js — monorepo root
// Security rules flow from packages/config/eslint-preset.js into both apps
// via their eslint.config.mjs — lint-staged just triggers the right app's linter

module.exports = {
  // ── Next.js app ───────────────────────────────────────────────
  'apps/web/**/*.{ts,tsx}': [
    'pnpm --filter web exec eslint --fix --max-warnings=0',
    'pnpm --filter web exec prettier --write',
  ],

  // ── NestJS app ────────────────────────────────────────────────
  'apps/api/**/*.ts': [
    'pnpm --filter api exec eslint --fix --max-warnings=0',
    'pnpm --filter api exec prettier --write',
  ],

  // ── Shared packages ───────────────────────────────────────────
  // These inherit base rules from eslint-preset.js directly
  'packages/**/*.{ts,tsx}': [
    'pnpm exec eslint --fix --max-warnings=0',
    'pnpm exec prettier --write',
  ],

  // ── Prisma schema ─────────────────────────────────────────────
  '**/*.prisma': [
    'pnpm exec prisma format',
  ],

  // ── JSON / YAML / Markdown ────────────────────────────────────
  '**/*.{json,yml,yaml,md}': [
    'prettier --write',
  ],
};