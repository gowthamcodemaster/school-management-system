// apps/web/e2e/features/auth/login.feature - already exists

// apps/web/e2e/step-definitions/auth/login.steps.ts
import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { CustomWorld } from '../../support/world'

// ── Selectors ─────────────────────────────────────────────────────
const SEL = {
  emailInput: '[data-testid="email-input"], #email, input[type="email"]',
  passwordInput: '[data-testid="password-input"], #password, input[type="password"]',
  signInButton: 'button:has-text("Sign in")',
  forgotLink: 'a:has-text("Forgot password")',
  errorAlert: '[role="alert"]',
  logo: '[data-testid="logo"]',
  mfaInput: '#code, input[autocomplete="one-time-code"]',
  verifyButton: 'button:has-text("Verify")',
  backButton: 'button:has-text("Back")',
  dashboard: '[data-testid="admin-dashboard"]',
}

const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL ?? 'superadmin@test.local',
  password: process.env.TEST_ADMIN_PASSWORD ?? 'TestPassword123!',
}

// ── Given ──────────────────────────────────────────────────────────
Given('I am on the login page', async function (this: CustomWorld) {
  await this.page.goto('/auth/login')
  await this.page.waitForSelector(SEL.signInButton)
})

Given('I am already logged in as super admin', async function (this: CustomWorld) {
  await this.page.goto('/auth/login')
  await this.page.fill(SEL.emailInput, TEST_ADMIN.email)
  await this.page.fill(SEL.passwordInput, TEST_ADMIN.password)
  await this.page.click(SEL.signInButton)
  await this.page.waitForURL('**/admin/dashboard', { timeout: 10000 })
})

Given('I am not logged in', async function (this: CustomWorld) {
  await this.context.clearCookies()
  await this.page.evaluate(() => sessionStorage.clear())
})

// ── When ───────────────────────────────────────────────────────────
When('I enter valid admin email and password', async function (this: CustomWorld) {
  await this.page.fill(SEL.emailInput, TEST_ADMIN.email)
  await this.page.fill(SEL.passwordInput, TEST_ADMIN.password)
})

When('I enter valid admin email and an incorrect password', async function (this: CustomWorld) {
  await this.page.fill(SEL.emailInput, TEST_ADMIN.email)
  await this.page.fill(SEL.passwordInput, 'WrongPassword999!')
})

When('I enter a non-existent email and any password', async function (this: CustomWorld) {
  await this.page.fill(SEL.emailInput, 'nobody@test.local')
  await this.page.fill(SEL.passwordInput, 'AnyPassword123!')
})

When('I click the login button', async function (this: CustomWorld) {
  await this.page.click(SEL.signInButton)
  await this.page.waitForLoadState('networkidle')
})

When('I enter a valid MFA code', async function (this: CustomWorld) {
  await this.page.fill(SEL.mfaInput, process.env.TEST_MFA_CODE ?? '000000')
  await this.page.click(SEL.verifyButton)
  await this.page.waitForLoadState('networkidle')
})

When('I enter an invalid MFA code', async function (this: CustomWorld) {
  await this.page.fill(SEL.mfaInput, '999999')
  await this.page.click(SEL.verifyButton)
  await this.page.waitForLoadState('networkidle')
})

When('I submit the form without filling any fields', async function (this: CustomWorld) {
  await this.page.click(SEL.signInButton)
})

When('I enter an invalid email format', async function (this: CustomWorld) {
  await this.page.fill(SEL.emailInput, 'notanemail')
  await this.page.fill(SEL.passwordInput, 'ValidPassword123!')
  await this.page.click(SEL.signInButton)
})

When('I navigate to the admin dashboard directly', async function (this: CustomWorld) {
  await this.page.goto('/admin/dashboard')
})

When('I navigate to the login page', async function (this: CustomWorld) {
  await this.page.goto('/auth/login')
})

When('I refresh the page', async function (this: CustomWorld) {
  await this.page.reload()
  await this.page.waitForLoadState('networkidle')
})

When('I click back on the MFA screen', async function (this: CustomWorld) {
  await this.page.click(SEL.backButton)
})

// ── Then ───────────────────────────────────────────────────────────
Then('I should see the login page', async function (this: CustomWorld) {
  await expect(this.page.locator(SEL.signInButton)).toBeVisible()
})

Then('I should see the logo', async function (this: CustomWorld) {
  await expect(this.page.locator(SEL.logo)).toBeVisible()
})

Then('I should see the email and password fields', async function (this: CustomWorld) {
  await expect(this.page.locator(SEL.emailInput)).toBeVisible()
  await expect(this.page.locator(SEL.passwordInput)).toBeVisible()
})

Then('I should see the forgot password link', async function (this: CustomWorld) {
  await expect(this.page.locator(SEL.forgotLink)).toBeVisible()
})

Then('I should be prompted for MFA verification', async function (this: CustomWorld) {
  await expect(this.page.locator(SEL.mfaInput)).toBeVisible({ timeout: 5000 })
})

Then('I should be redirected to the admin dashboard', async function (this: CustomWorld) {
  await this.page.waitForURL('**/admin/dashboard', { timeout: 10000 })
})

Then('I should still be on the admin dashboard', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/admin\/dashboard/)
})

Then('I should see an invalid credentials error', async function (this: CustomWorld) {
  await expect(this.page.locator(SEL.errorAlert)).toBeVisible({ timeout: 5000 })
})

Then('I should remain on the login page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/auth\/login/)
})

Then('I should see an email validation error', async function (this: CustomWorld) {
  await expect(this.page.getByText('Email is required')).toBeVisible()
})

Then('I should see a password validation error', async function (this: CustomWorld) {
  await expect(this.page.getByText('Password is required')).toBeVisible()
})

Then('I should see an invalid email format error', async function (this: CustomWorld) {
  await expect(this.page.getByText(/valid email/i)).toBeVisible()
})

Then('I should see an account locked message', async function (this: CustomWorld) {
  await expect(this.page.locator(SEL.errorAlert)).toContainText(/lock|too many/i)
})

Then('the login button should be disabled', async function (this: CustomWorld) {
  await expect(this.page.locator(SEL.signInButton)).toBeDisabled()
})

Then('I should see an invalid MFA error', async function (this: CustomWorld) {
  await expect(this.page.locator(SEL.errorAlert)).toBeVisible({ timeout: 5000 })
})

Then('I should remain on the MFA verification page', async function (this: CustomWorld) {
  await expect(this.page.locator(SEL.mfaInput)).toBeVisible()
})

Then('I should be back on the login page', async function (this: CustomWorld) {
  await expect(this.page.locator(SEL.signInButton)).toBeVisible()
  await expect(this.page.locator(SEL.mfaInput)).not.toBeVisible()
})

Then('I should be redirected to the login page', async function (this: CustomWorld) {
  await this.page.waitForURL('**/auth/login', { timeout: 10000 })
})

Then('I should be redirected to the dashboard', async function (this: CustomWorld) {
  await this.page.waitForURL('**/admin/dashboard', { timeout: 10000 })
})
