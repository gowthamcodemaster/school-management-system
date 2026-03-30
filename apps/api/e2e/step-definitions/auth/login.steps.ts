// apps/api/e2e/step-definitions/auth/login.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import expect from 'expect';
import { ApiWorld } from '../../support/world';
import * as jwt from 'jsonwebtoken';

// ── Types ──────────────────────────────────────────────────────────
interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

// ── Test credentials ───────────────────────────────────────────────
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL ?? 'superadmin@test.local',
  password: process.env.TEST_ADMIN_PASSWORD ?? 'TestPassword123!',
};

// ── Given steps ────────────────────────────────────────────────────
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
  'I POST to {string} with missing credentials',
  async function (this: ApiWorld, path: string) {
    this.response = await this.request.post(path).send({});
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
      process.env.JWT_SECRET ?? 'test-secret',
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
      { sub: 'test-user-id', role: 'SUPER_ADMIN' },
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

Then('the response should contain a refresh token', function (this: ApiWorld) {
  const body = this.response?.body as AuthResponse;
  expect(body.refreshToken).toBeDefined();
  expect(typeof body.refreshToken).toBe('string');
});

Then('the access token should be a valid JWT', function (this: ApiWorld) {
  const body = this.response?.body as AuthResponse;
  const token = body.accessToken ?? '';
  const parts = token.split('.');
  expect(parts.length).toBe(3);
});

Then('the response should contain an error message', function (this: ApiWorld) {
  const body = this.response?.body as AuthResponse;
  expect(body.message).toBeDefined();
});

Then(
  'the response should contain an account locked message',
  function (this: ApiWorld) {
    const body = this.response?.body as AuthResponse;
    expect(body.message?.toLowerCase()).toMatch(/lock|too many|attempt/);
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

Then('my access token should no longer work', async function (this: ApiWorld) {
  const res = await this.request
    .get('/admin/profile')
    .set('Authorization', `Bearer ${this.authToken ?? ''}`);
  expect(res.status).toBe(401);
});
