// apps/api/e2e/support/hooks.ts
import { Before, After, BeforeAll, AfterAll, Status } from '@cucumber/cucumber';
import { ApiWorld } from './world';
import * as bcrypt from 'bcryptjs';

// ── Suite level ────────────────────────────────────────────────────
BeforeAll(function () {
  console.log('🚀 Starting API E2E test suite...');
  const requiredEnvVars = ['DATABASE_URL', 'REDIS_URL'];
  const missing = requiredEnvVars.filter((v) => !Object.hasOwn(process.env, v));
  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars for e2e tests: ${missing.join(', ')}\n` +
        'Make sure Docker Compose is running: docker compose up -d',
    );
  }
});

AfterAll(function () {
  console.log('✅ API E2E test suite complete');
});

// ── Scenario level ─────────────────────────────────────────────────
Before(async function (this: ApiWorld) {
  await this.init();
  await seedTestData(this);
});

After(async function (this: ApiWorld, scenario) {
  if (scenario.result?.status === Status.FAILED && this.response) {
    this.attach(
      JSON.stringify(this.response.body, null, 2),
      'application/json',
    );
  }
  await cleanTestData(this);
  await this.destroy();
});

// ── Test data helpers ──────────────────────────────────────────────
async function seedTestData(world: ApiWorld): Promise<void> {
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

  await world.prisma.user.upsert({
    where: { email: 'superadmin@test.local' },
    update: {},
    create: {
      firstName: 'Alok',
      lastName: 'Tiwari',
      email: 'superadmin@test.local',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
}

type DeletableModel = { deleteMany: () => Promise<unknown> };

async function cleanTestData(world: ApiWorld): Promise<void> {
  // Explicit list — no dynamic key access, no injection risk
  const models: DeletableModel[] = [
    world.prisma.user as unknown as DeletableModel,
    // Add world.prisma.refreshToken, world.prisma.auditLog
    // once those models exist in your Prisma schema
  ];

  for (const model of models) {
    await model.deleteMany();
  }
}
