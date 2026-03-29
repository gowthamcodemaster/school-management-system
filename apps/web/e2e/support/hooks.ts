// apps/web/e2e/support/hooks.ts
import { Before, After, AfterStep, Status, BeforeAll, AfterAll } from '@cucumber/cucumber'
import { CustomWorld } from './world'

// ── Suite level ────────────────────────────────────────────────────
BeforeAll(async function () {
  // Global setup before all scenarios
  // e.g. seed test database, start mock servers
  console.log('🚀 Starting E2E test suite...')
})

AfterAll(async function () {
  console.log('✅ E2E test suite complete')
})

// ── Scenario level ─────────────────────────────────────────────────
Before(async function (this: CustomWorld) {
  await this.init()
})

After(async function (this: CustomWorld, scenario) {
  // Take screenshot on failure
  if (scenario.result?.status === Status.FAILED) {
    const screenshot = await this.page?.screenshot({
      fullPage: true,
    })

    if (screenshot) {
      await this.attach(screenshot, 'image/png')
    }

    // Attach page HTML for debugging
    const html = await this.page?.content()
    if (html) {
      await this.attach(html, 'text/html')
    }
  }

  await this.destroy()
})

// ── Step level ─────────────────────────────────────────────────────
AfterStep(async function (this: CustomWorld) {
  // Take screenshot after each step when debugging
  if (process.env.DEBUG_SCREENSHOTS === 'true') {
    const screenshot = await this.page?.screenshot()
    if (screenshot) {
      await this.attach(screenshot, 'image/png')
    }
  }
})
