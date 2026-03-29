// apps/web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Only used for pure Playwright tests (non-Cucumber)
  // Cucumber uses its own runner via cucumber.cjs
  testDir: './e2e/playwright',

  // Global timeout per test
  timeout: 30_000,

  // Expect timeout for assertions
  expect: { timeout: 5_000 },

  // Fail fast in development
  fullyParallel: false,

  // Retry on CI
  retries: process.env.CI ? 2 : 0,

  // Reporter
  reporter: [['html', { outputFolder: 'e2e/reports/playwright-report' }], ['list']],

  use: {
    // Base URL — your Next.js dev server
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Always collect traces for failed tests
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Browser context options
    locale: 'en-US',
    timezoneId: 'Asia/Kolkata',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment when needed:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // Start Next.js dev server before running tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
