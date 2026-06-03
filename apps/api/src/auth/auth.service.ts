// apps/api/src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { UserRole, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

// ── Constants ──────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ── Types ──────────────────────────────────────────────────────────
export type SafeUser = Omit<User, 'mfaSecret' | 'password'>;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  mfaToken?: string;
  mfaRequired?: boolean;
}

interface JwtPayload {
  sub: string;
  role: UserRole;
  type: 'access' | 'refresh';
  jti: unknown;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── validateCredentials ─────────────────────────────────────────
  async validateCredentials(
    email: string,
    password: string,
  ): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Use same error for non-existent email and wrong password
    // to prevent user enumeration (TC-005)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked (TC-009)
    if (user.lockedUntil) {
      if (user.lockedUntil > new Date()) {
        throw new ForbiddenException(
          'Account is locked due to too many failed attempts. Please try again later.',
        );
      }

      // Lock has expired — auto-unlock
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lockedUntil: null,
          failedLoginAttempts: 0,
        },
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts and update lastLoginAt on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Strip sensitive fields before returning (TC-001)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, mfaSecret: __, ...safeUser } = user;
    return safeUser;
  }

  // ── generateTokens ──────────────────────────────────────────────
  async generateTokens(userId: string, role: UserRole): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        {
          sub: userId,
          role,
          type: 'access',
          jti: randomUUID(),
        } satisfies JwtPayload,
        {
          secret: this.config.get<string>('JWT_SECRET'),
          expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '15m',
        },
      ),
      this.jwt.signAsync(
        {
          sub: userId,
          role,
          type: 'refresh',
          jti: randomUUID(),
        } satisfies JwtPayload,
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
        },
      ),
    ]);

    // Persist refresh token in DB for rotation tracking
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async generateMfaPartialToken(
    userId: string,
    role: UserRole,
  ): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, role, type: 'mfa_partial' },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: '5m', // short-lived — only for MFA step
      },
    );
  }

  // ── refreshTokens ───────────────────────────────────────────────
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    // Validate token exists, is not revoked, and not expired
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Issue new token pair
    return this.generateTokens(storedToken.userId, storedToken.user.role);
  }

  // ── logout ──────────────────────────────────────────────────────
  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    this.logger.log(`User ${userId} logged out — all tokens revoked`);
  }

  // ── Private helpers ─────────────────────────────────────────────
  private async handleFailedLogin(user: User): Promise<void> {
    const newFailedAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: { increment: 1 },
        ...(shouldLock && {
          lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
        }),
      },
    });

    if (shouldLock) {
      this.logger.warn(
        `Account locked for user ${user.email} after ${MAX_FAILED_ATTEMPTS} failed attempts`,
      );
    }
  }
}
