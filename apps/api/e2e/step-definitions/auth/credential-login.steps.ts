// apps/api/e2e/step-definitions/auth/credential-login.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import expect from 'expect';
import * as jwt from 'jsonwebtoken';
import { ApiWorld } from '../../support/world';

// ── Types ──────────────────────────────────────────────────────────
interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  user?: Record<string, unknown>;
}

// ── Test credentials ───────────────────────────────────────────────
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL ?? 'superadmin@test.local',
  password: process.env.TEST_ADMIN_PASSWORD ?? 'TestPassword123!',
};

// ── Given steps ────────────────────────────────────────────────────
Given(
  'the database is clean and seeded with a super admin',
  async function (this: ApiWorld) {
    // Handled by hooks.ts Before hook — no action needed here
  },
);

Given(
  'the super admin has {int} failed login attempts recorded',
  async function (this: ApiWorld, attempts: number) {
    await this.prisma.user.update({
      where: { email: TEST_ADMIN.email },
      data: { failedLoginAttempts: attempts },
    });
  },
);

Given('I am logged in as super admin via API', async function (this: ApiWorld) {
  const res = await this.request
    .post('/auth/login')
    .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

  const body = res.body as AuthResponse;
  this.authToken = body.accessToken;
  this.refreshToken = body.refreshToken;
});

// ── When steps ─────────────────────────────────────────────────────
When(
  'I POST to {string} with valid admin credentials',
  async function (this: ApiWorld, path: string) {
    this.response = await this.request
      .post(path)
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });
  },
);

When(
  'I POST to {string} with valid admin credentials twice simultaneously',
  async function (this: ApiWorld, path: string) {
    const [res1, res2] = await Promise.all([
      this.request
        .post(path)
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password }),
      this.request
        .post(path)
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password }),
    ]);
    // Store both responses for assertion
    this.response = res1;
    this.response2 = res2;
  },
);

When(
  'I POST to {string} with an incorrect password',
  async function (this: ApiWorld, path: string) {
    this.response = await this.request
      .post(path)
      .send({ email: TEST_ADMIN.email, password: 'WrongPassword999!' });
  },
);

When(
  'I POST to {string} with a non-existent email',
  async function (this: ApiWorld, path: string) {
    this.response = await this.request
      .post(path)
      .send({ email: 'nobody@test.local', password: 'AnyPassword123!' });
  },
);

When(
  'I POST to {string} with missing email field',
  async function (this: ApiWorld, path: string) {
    this.response = await this.request
      .post(path)
      .send({ password: TEST_ADMIN.password });
  },
);

When(
  'I POST to {string} with missing password field',
  async function (this: ApiWorld, path: string) {
    this.response = await this.request
      .post(path)
      .send({ email: TEST_ADMIN.email });
  },
);

When(
  'I POST to {string} with an invalid email format',
  async function (this: ApiWorld, path: string) {
    this.response = await this.request
      .post(path)
      .send({ email: 'notanemail', password: TEST_ADMIN.password });
  },
);

When(
  'I POST to {string} with an incorrect password {int} times',
  async function (this: ApiWorld, path: string, times: number) {
    for (let i = 0; i < times; i++) {
      this.response = await this.request
        .post(path)
        .send({ email: TEST_ADMIN.email, password: 'WrongPassword999!' });
    }
  },
);

When(
  'I POST to {string} with SQL injection as email',
  async function (this: ApiWorld, path: string) {
    this.response = await this.request
      .post(path)
      .send({ email: "' OR 1=1 --", password: TEST_ADMIN.password });
  },
);

When(
  'I POST to {string} with XSS payload as email',
  async function (this: ApiWorld, path: string) {
    this.response = await this.request.post(path).send({
      email: '<script>alert(1)</script>',
      password: TEST_ADMIN.password,
    });
  },
);

When(
  'I POST to {string} with my refresh token',
  async function (this: ApiWorld, path: string) {
    this.response = await this.request
      .post(path)
      .send({ refreshToken: this.refreshToken });
  },
);

When(
  'I POST to {string} with an invalid refresh token',
  async function (this: ApiWorld, path: string) {
    this.response = await this.request
      .post(path)
      .send({ refreshToken: 'invalid.token.here' });
  },
);

When(
  'I POST to {string} with an expired refresh token',
  async function (this: ApiWorld, path: string) {
    const expiredToken = jwt.sign(
      { sub: 'test-user-id', type: 'refresh' },
      process.env.JWT_REFRESH_SECRET ?? 'test-secret',
      { expiresIn: -3600 },
    );
    this.response = await this.request
      .post(path)
      .send({ refreshToken: expiredToken });
  },
);

When('I POST to {string}', async function (this: ApiWorld, path: string) {
  this.response = await this.request
    .post(path)
    .set('Authorization', `Bearer ${this.authToken ?? ''}`);
});

When(
  'I GET {string} with my access token',
  async function (this: ApiWorld, path: string) {
    this.response = await this.request
      .get(path)
      .set('Authorization', `Bearer ${this.authToken ?? ''}`);
  },
);

When(
  'I GET {string} without a token',
  async function (this: ApiWorld, path: string) {
    this.response = await this.request.get(path);
  },
);

When(
  'I GET {string} with an expired token',
  async function (this: ApiWorld, path: string) {
    const expiredToken = jwt.sign(
      { sub: 'test-user-id', role: 'SUPER_ADMIN', type: 'access' },
      process.env.JWT_SECRET ?? 'test-secret',
      { expiresIn: -3600 },
    );
    this.response = await this.request
      .get(path)
      .set('Authorization', `Bearer ${expiredToken}`);
  },
);

When('I GET {string}', async function (this: ApiWorld, path: string) {
  this.response = await this.request.get(path);
});

// ── Then steps ─────────────────────────────────────────────────────
Then(
  'the response status should be {int}',
  function (this: ApiWorld, status: number) {
    expect(this.response?.status).toBe(status);
  },
);

Then('the response should contain an access token', function (this: ApiWorld) {
  const body = this.response?.body as AuthResponse;
  expect(body.accessToken).toBeDefined();
  expect(typeof body.accessToken).toBe('string');
});

Then(
  'the response should contain a refresh token cookie',
  function (this: ApiWorld) {
    const cookies = this.response?.headers['set-cookie'] as
      | string[]
      | undefined;
    const refreshCookie = cookies?.find((c) => c.startsWith('refresh_token='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('SameSite=Strict');
  },
);

Then('the access token should be a valid JWT', function (this: ApiWorld) {
  const body = this.response?.body as AuthResponse;
  const token = body.accessToken ?? '';
  const parts = token.split('.');
  expect(parts.length).toBe(3);
});

Then(
  'the response should contain user details without password',
  function (this: ApiWorld) {
    const body = this.response?.body as AuthResponse;
    expect(body.user).toBeDefined();
    expect(body.user?.password).toBeUndefined();
    expect(body.user?.email).toBe(TEST_ADMIN.email);
  },
);

Then(
  'both responses should return {int}',
  function (this: ApiWorld, status: number) {
    expect(this.response?.status).toBe(status);
    expect(this.response2?.status).toBe(status);
  },
);

Then(
  'each response should contain a unique access token',
  function (this: ApiWorld) {
    const body1 = this.response?.body as AuthResponse;
    const body2 = this.response2?.body as AuthResponse;
    expect(body1.accessToken).toBeDefined();
    expect(body2.accessToken).toBeDefined();
    expect(body1.accessToken).not.toBe(body2.accessToken);
  },
);

Then(
  'the super admin failed login attempts should be reset to {int}',
  async function (this: ApiWorld, count: number) {
    const user = await this.prisma.user.findUnique({
      where: { email: TEST_ADMIN.email },
    });
    expect(user?.failedLoginAttempts).toBe(count);
  },
);

Then('the response should contain an error message', function (this: ApiWorld) {
  const body = this.response?.body as AuthResponse;
  expect(body.message).toBeDefined();
});

Then(
  'the failed login attempts should be incremented',
  async function (this: ApiWorld) {
    const user = await this.prisma.user.findUnique({
      where: { email: TEST_ADMIN.email },
    });
    expect(user?.failedLoginAttempts).toBeGreaterThan(0);
  },
);

Then(
  'the error message should be identical to a wrong password error',
  async function (this: ApiWorld) {
    const nonExistentBody = this.response?.body as AuthResponse;

    const wrongPassRes = await this.request
      .post('/auth/login')
      .send({ email: TEST_ADMIN.email, password: 'WrongPassword999!' });
    const wrongPassBody = wrongPassRes.body as AuthResponse;

    expect(nonExistentBody.message).toBe(wrongPassBody.message);
  },
);

Then(
  'the response should contain an account locked message',
  function (this: ApiWorld) {
    const body = this.response?.body as AuthResponse;
    expect(body.message?.toLowerCase()).toMatch(/lock|too many|attempt/);
  },
);

Then(
  'further login attempts should return {int}',
  async function (this: ApiWorld, status: number) {
    const res = await this.request
      .post('/auth/login')
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });
    expect(res.status).toBe(status);
  },
);

Then(
  'no database error should be exposed in the response',
  function (this: ApiWorld) {
    const body = this.response?.body as AuthResponse;
    const bodyStr = JSON.stringify(body).toLowerCase();
    expect(bodyStr).not.toContain('sql');
    expect(bodyStr).not.toContain('postgres');
    expect(bodyStr).not.toContain('prisma');
    expect(bodyStr).not.toContain('database');
  },
);

Then(
  'the response should not reflect the script back',
  function (this: ApiWorld) {
    const bodyStr = JSON.stringify(this.response?.body).toLowerCase();
    expect(bodyStr).not.toContain('<script>');
  },
);

Then(
  'the response should contain a new access token',
  function (this: ApiWorld) {
    const body = this.response?.body as AuthResponse;
    expect(body.accessToken).toBeDefined();
    expect(body.accessToken).not.toBe(this.authToken);
  },
);

Then(
  'the old refresh token should be revoked',
  async function (this: ApiWorld) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: this.refreshToken ?? '' },
    });
    expect(storedToken?.isRevoked).toBe(true);
  },
);

Then(
  'my access token should no longer work on protected routes',
  async function (this: ApiWorld) {
    const res = await this.request
      .get('/admin/profile')
      .set('Authorization', `Bearer ${this.authToken ?? ''}`);
    expect(res.status).toBe(401);
  },
);
