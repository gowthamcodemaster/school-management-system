// apps/api/test/auth/credential-login.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

// ── Test credentials ───────────────────────────────────────────────
const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL ?? 'superadmin@test.local',
  password: process.env.TEST_ADMIN_PASSWORD ?? 'TestPassword123!',
};

// ── Helpers ────────────────────────────────────────────────────────
interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  user?: Record<string, unknown>;
}

describe('Auth — Credential Login (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // ── Setup ──────────────────────────────────────────────────────
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Seed / Clean per test ──────────────────────────────────────
  beforeEach(async () => {
    await cleanDatabase(prisma);
    await seedSuperAdmin(prisma);
  });

  afterEach(async () => {
    await cleanDatabase(prisma);
  });

  // ── Happy Path ─────────────────────────────────────────────────
  describe('POST /auth/login — Happy Path', () => {
    it('TC-001: should return 200 and access token on valid credentials', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      expect(res.status).toBe(200);
      const body = res.body as AuthResponse;
      expect(body.accessToken).toBeDefined();
      expect(typeof body.accessToken).toBe('string');
    });

    it('TC-001: should set HttpOnly refresh token cookie on valid login', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies?.find((c: string) =>
        c.startsWith('refresh_token='),
      );
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
    });

    it('TC-001: should return user details without password', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      const body = res.body as AuthResponse;
      expect(body.user).toBeDefined();
      expect(body.user?.password).toBeUndefined();
      expect(body.user?.email).toBe(TEST_ADMIN.email);
    });

    it('TC-001: access token should be a valid JWT', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      const body = res.body as AuthResponse;
      const parts = (body.accessToken ?? '').split('.');
      expect(parts.length).toBe(3);
    });

    it('should reset failed login attempts on successful login', async () => {
      await prisma.user.update({
        where: { email: TEST_ADMIN.email },
        data: { failedLoginAttempts: 3 },
      });

      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .post('/auth/login')
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      const user = await prisma.user.findUnique({
        where: { email: TEST_ADMIN.email },
      });
      expect(user?.failedLoginAttempts).toBe(0);
    });

    it('TC-002: should issue unique tokens for simultaneous requests', async () => {
      const [res1, res2] = await Promise.all([
        request(app.getHttpServer() as Parameters<typeof request>[0])
          .post('/auth/login')
          .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password }),
        request(app.getHttpServer() as Parameters<typeof request>[0])
          .post('/auth/login')
          .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password }),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect((res1.body as AuthResponse).accessToken).not.toBe(
        (res2.body as AuthResponse).accessToken,
      );
    });
  });

  // ── Negative Scenarios ─────────────────────────────────────────
  describe('POST /auth/login — Negative Scenarios', () => {
    it('TC-004: should return 401 for wrong password', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: TEST_ADMIN.email, password: 'WrongPassword999!' });

      expect(res.status).toBe(401);
      expect((res.body as AuthResponse).message).toBeDefined();
    });

    it('TC-004: should increment failed login attempts on wrong password', async () => {
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .post('/auth/login')
        .send({ email: TEST_ADMIN.email, password: 'WrongPassword999!' });

      const user = await prisma.user.findUnique({
        where: { email: TEST_ADMIN.email },
      });
      expect(user?.failedLoginAttempts).toBe(1);
    });

    it('TC-005: should return same error for non-existent email (no enumeration)', async () => {
      const wrongPassRes = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: TEST_ADMIN.email, password: 'WrongPassword999!' });

      const nonExistentRes = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: 'nobody@test.local', password: 'AnyPassword123!' });

      expect(wrongPassRes.status).toBe(401);
      expect(nonExistentRes.status).toBe(401);
      expect((wrongPassRes.body as AuthResponse).message).toBe(
        (nonExistentRes.body as AuthResponse).message,
      );
    });

    it('TC-006: should return 400 for missing email', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ password: TEST_ADMIN.password });

      expect(res.status).toBe(400);
    });

    it('TC-007: should return 400 for missing password', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: TEST_ADMIN.email });

      expect(res.status).toBe(400);
    });

    it('TC-008: should return 400 for invalid email format', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: 'notanemail', password: TEST_ADMIN.password });

      expect(res.status).toBe(400);
    });

    it('TC-009: should lock account after 5 failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer() as Parameters<typeof request>[0])
          .post('/auth/login')
          .send({ email: TEST_ADMIN.email, password: 'WrongPassword999!' });
      }

      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      expect(res.status).toBe(403);
      expect((res.body as AuthResponse).message?.toLowerCase()).toMatch(
        /lock|too many|attempt/,
      );
    });

    it('TC-010: should return 400 for SQL injection attempt', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: "' OR 1=1 --", password: TEST_ADMIN.password });

      expect(res.status).toBe(400);
      const bodyStr = JSON.stringify(res.body).toLowerCase();
      expect(bodyStr).not.toContain('sql');
      expect(bodyStr).not.toContain('postgres');
      expect(bodyStr).not.toContain('prisma');
    });

    it('TC-011: should return 400 for XSS payload', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({
          email: '<script>alert(1)</script>',
          password: TEST_ADMIN.password,
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).not.toContain('<script>');
    });
  });

  // ── Token Refresh ──────────────────────────────────────────────
  describe('POST /auth/refresh', () => {
    let authToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

      authToken = (res.body as AuthResponse).accessToken ?? '';
      // Extract refresh token from cookie instead of body
      const cookies = res.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies?.find((c: string) =>
        c.startsWith('refresh_token='),
      );
      refreshToken =
        refreshCookie?.split(';')[0]?.replace('refresh_token=', '') ?? '';
    });

    it('should return 200 and new access token for valid refresh token', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect((res.body as AuthResponse).accessToken).toBeDefined();
      expect((res.body as AuthResponse).accessToken).not.toBe(authToken);
    });

    it('should revoke old refresh token on rotation', async () => {
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .post('/auth/refresh')
        .send({ refreshToken });

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });
      expect(storedToken?.isRevoked).toBe(true);
    });

    it('should return 401 for invalid refresh token', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect(res.status).toBe(401);
    });

    it('should return 401 for expired refresh token', async () => {
      const expiredToken = jwt.sign(
        { sub: 'test-user-id', type: 'refresh' },
        process.env.JWT_REFRESH_SECRET ?? 'test-secret',
        { expiresIn: -3600 },
      );

      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/refresh')
        .send({ refreshToken: expiredToken });

      expect(res.status).toBe(401);
    });

    it('should return 401 for revoked refresh token after logout', async () => {
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(401);
    });
  });

  // ── Logout ─────────────────────────────────────────────────────
  // describe('POST /auth/logout', () => {
  //   it('should return 200 and revoke all tokens', async () => {
  //     const loginRes = await request(
  //       app.getHttpServer() as Parameters<typeof request>[0],
  //     )
  //       .post('/auth/login')
  //       .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

  //     const token = (loginRes.body as AuthResponse).accessToken ?? '';

  //     const res = await request(
  //       app.getHttpServer() as Parameters<typeof request>[0],
  //     )
  //       .post('/auth/logout')
  //       .set('Authorization', `Bearer ${token}`);

  //     expect(res.status).toBe(200);
  //   });

  //   it('should invalidate access token after logout', async () => {
  //     const loginRes = await request(
  //       app.getHttpServer() as Parameters<typeof request>[0],
  //     )
  //       .post('/auth/login')
  //       .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });

  //     const token = (loginRes.body as AuthResponse).accessToken ?? '';

  //     await request(app.getHttpServer() as Parameters<typeof request>[0])
  //       .post('/auth/logout')
  //       .set('Authorization', `Bearer ${token}`);

  //     const res = await request(
  //       app.getHttpServer() as Parameters<typeof request>[0],
  //     )
  //       .get('/admin/profile')
  //       .set('Authorization', `Bearer ${token}`);

  //     expect(res.status).toBe(401);
  //   });
  // });

  // // ── Protected Routes ───────────────────────────────────────────
  // describe('Protected Routes', () => {
  //   it('should return 401 for protected route without token', async () => {
  //     const res = await request(
  //       app.getHttpServer() as Parameters<typeof request>[0],
  //     ).get('/admin/profile');
  //     expect(res.status).toBe(401);
  //   });

  //   it('should return 401 for protected route with expired token', async () => {
  //     const expiredToken = jwt.sign(
  //       { sub: 'test-user-id', role: 'SUPER_ADMIN', type: 'access' },
  //       process.env.JWT_SECRET ?? 'test-secret',
  //       { expiresIn: -3600 },
  //     );

  //     const res = await request(
  //       app.getHttpServer() as Parameters<typeof request>[0],
  //     )
  //       .get('/admin/profile')
  //       .set('Authorization', `Bearer ${expiredToken}`);

  //     expect(res.status).toBe(401);
  //   });
  // });

  // ── Health Check ───────────────────────────────────────────────
  describe('GET /', () => {
    it('should return 200', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      ).get('/');
      expect(res.status).toBe(200);
    });
  });
});

// ── Database helpers ───────────────────────────────────────────────
async function seedSuperAdmin(prisma: PrismaService): Promise<void> {
  const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
  await prisma.user.upsert({
    where: { email: 'superadmin@test.local' },
    update: {},
    create: {
      email: 'superadmin@test.local',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
      firstName: 'Super',
      lastName: 'Admin',
    },
  });
}

async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}
