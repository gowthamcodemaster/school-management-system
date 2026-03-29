// apps/web/e2e/support/world.ts
import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber'
import { Browser, BrowserContext, Page, chromium } from 'playwright'

export class CustomWorld extends World {
  browser!: Browser
  context!: BrowserContext
  page!: Page
  baseUrl: string

  constructor(options: IWorldOptions) {
    super(options)
    this.baseUrl = options.parameters?.baseUrl || process.env.BASE_URL || 'http://localhost:3000'
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    })

    this.context = await this.browser.newContext({
      baseURL: this.baseUrl,
      locale: 'en-US',
      timezoneId: 'Asia/Kolkata',
      viewport: { width: 1280, height: 720 },
    })

    this.page = await this.context.newPage()
  }

  async destroy(): Promise<void> {
    await this.page?.close()
    await this.context?.close()
    await this.browser?.close()
  }
}

setWorldConstructor(CustomWorld)
