// apps/web/e2e/step-definitions/auth/login.steps.ts
import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { CustomWorld } from '../../support/world'

// ── Page selectors ─────────────────────────────────────────────────
// Update these to match your actual UI selectors
const SELECTORS = {
  emailInput: '[data-testid="email-input"]',
  passwordInput: '[data-testid="password-input"]',
  loginButton: '[data-testid="login-button"]',
  mfaInput: '[data-testid="mfa-input"]',
  mfaSubmitButton: '[data-testid="mfa-submit-button"]',
  errorMessage: '[data-testid="error-message"]',
  lockedMessage: '[data-testid="account-locked-message"]',
  sessionExpired: '[data-testid="session-expired-message"]',
  welcomeMessage: '[data-testid="welcome-message"]',
  dashboard: '[data-testid="admin-dashboard"]',
}

// ── Test credentials (from env, never hardcoded) ───────────────────
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'superadmin@test.local',
  password: process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!',
  mfaCode: process.env.TEST_MFA_CODE || '000000', // mock in test env
}

// ── Given steps ────────────────────────────────────────────────────
Given('I am on the login page', async function (this: CustomWorld) {
  await this.page.goto('/auth/login')
  await this.page.waitForSelector(SELECTORS.emailInput)
})

Given('I am already logged in as super admin', async function (this: CustomWorld) {
  // Navigate to login and complete auth flow
  await this.page.goto('/auth/login')
  await this.page.fill(SELECTORS.emailInput, TEST_ADMIN.email)
  await this.page.fill(SELECTORS.passwordInput, TEST_ADMIN.password)
  await this.page.click(SELECTORS.loginButton)
  await this.page.fill(SELECTORS.mfaInput, TEST_ADMIN.mfaCode)
  await this.page.click(SELECTORS.mfaSubmitButton)
  await this.page.waitForSelector(SELECTORS.dashboard)
})

Given('I am not logged in', async function (this: CustomWorld) {
  await this.context.clearCookies()
  await this.page.evaluate(() => sessionStorage.clear())
})

Given('I am logged in as super admin', async function (this: CustomWorld) {
  await this.page.goto('/auth/login')
  await this.page.fill(SELECTORS.emailInput, TEST_ADMIN.email)
  await this.page.fill(SELECTORS.passwordInput, TEST_ADMIN.password)
  await this.page.click(SELECTORS.loginButton)
  await this.page.fill(SELECTORS.mfaInput, TEST_ADMIN.mfaCode)
  await this.page.click(SELECTORS.mfaSubmitButton)
  await this.page.waitForSelector(SELECTORS.dashboard)
})

// ── When steps ─────────────────────────────────────────────────────
When('I enter valid admin email and password', async function (this: CustomWorld) {
  await this.page.fill(SELECTORS.emailInput, TEST_ADMIN.email)
  await this.page.fill(SELECTORS.passwordInput, TEST_ADMIN.password)
})

When('I enter valid admin email and an incorrect password', async function (this: CustomWorld) {
  await this.page.fill(SELECTORS.emailInput, TEST_ADMIN.email)
  await this.page.fill(SELECTORS.passwordInput, 'WrongPassword999!')
})

When('I enter a non-existent email and any password', async function (this: CustomWorld) {
  await this.page.fill(SELECTORS.emailInput, 'nonexistent@test.local')
  await this.page.fill(SELECTORS.passwordInput, 'AnyPassword123!')
})

When('I click the login button', async function (this: CustomWorld) {
  await this.page.click(SELECTORS.loginButton)
  await this.page.waitForLoadState('networkidle')
})

When('I enter a valid MFA code', async function (this: CustomWorld) {
  await this.page.fill(SELECTORS.mfaInput, TEST_ADMIN.mfaCode)
  await this.page.click(SELECTORS.mfaSubmitButton)
  await this.page.waitForLoadState('networkidle')
})

When('I enter an invalid MFA code', async function (this: CustomWorld) {
  await this.page.fill(SELECTORS.mfaInput, '999999')
  await this.page.click(SELECTORS.mfaSubmitButton)
  await this.page.waitForLoadState('networkidle')
})

When('I navigate to the login page', async function (this: CustomWorld) {
  await this.page.goto('/auth/login')
})

When('I navigate to the admin dashboard directly', async function (this: CustomWorld) {
  await this.page.goto('/admin/dashboard')
})

When('I refresh the page', async function (this: CustomWorld) {
  await this.page.reload()
  await this.page.waitForLoadState('networkidle')
})

When('my session token expires', async function (this: CustomWorld) {
  // Clear cookies to simulate session expiry
  await this.context.clearCookies()
  await this.page.reload()
})

// ── Then steps ─────────────────────────────────────────────────────
Then('I should be prompted for MFA verification', async function (this: CustomWorld) {
  await expect(this.page.locator(SELECTORS.mfaInput)).toBeVisible()
})

Then('I should be redirected to the admin dashboard', async function (this: CustomWorld) {
  await this.page.waitForURL('**/admin/dashboard')
  await expect(this.page.locator(SELECTORS.dashboard)).toBeVisible()
})

Then('I should see a welcome message', async function (this: CustomWorld) {
  await expect(this.page.locator(SELECTORS.welcomeMessage)).toBeVisible()
})

Then('I should still be on the admin dashboard', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/.*admin\/dashboard/)
})

Then('I should see an invalid credentials error', async function (this: CustomWorld) {
  await expect(this.page.locator(SELECTORS.errorMessage)).toBeVisible()
})

Then('I should remain on the login page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/.*auth\/login/)
})

Then('I should see an account locked message', async function (this: CustomWorld) {
  await expect(this.page.locator(SELECTORS.lockedMessage)).toBeVisible()
})

Then('the login button should be disabled', async function (this: CustomWorld) {
  await expect(this.page.locator(SELECTORS.loginButton)).toBeDisabled()
})

Then('I should see an invalid MFA error', async function (this: CustomWorld) {
  await expect(this.page.locator(SELECTORS.errorMessage)).toBeVisible()
})

Then('I should remain on the MFA verification page', async function (this: CustomWorld) {
  await expect(this.page.locator(SELECTORS.mfaInput)).toBeVisible()
})

Then('I should be redirected to the login page', async function (this: CustomWorld) {
  await this.page.waitForURL('**/auth/login')
  await expect(this.page).toHaveURL(/.*auth\/login/)
})

Then('I should see a session expired message', async function (this: CustomWorld) {
  await expect(this.page.locator(SELECTORS.sessionExpired)).toBeVisible()
})
