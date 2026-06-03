// apps/api/src/auth/mfa.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { MailService } from './mail/mail.service';
import { MfaMethod } from '@prisma/client';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { randomInt } from 'crypto';
import { AuthService, TokenPair } from './auth.service';

// ── Constants ──────────────────────────────────────────────────────
const OTP_COOLDOWN_SECONDS = 60;
const OTP_EXPIRY_MINUTES = 10;

interface JwtMfaPayload {
  sub: string;
  type: string;
}

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly authService: AuthService,
  ) {}

  // ── generateTotpSetup ──────────────────────────────────────────
  async generateTotpSetup(
    userId: string,
  ): Promise<{ secret: string; qrCode: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate a new TOTP secret
    const secret = generateSecret();

    // Build the otpauth URI for Microsoft Authenticator
    const issuer = this.config.get<string>('MFA_ISSUER') ?? 'VidyaDhara';
    const otpauthUrl = generateURI({ issuer, label: user.email, secret });

    // Generate QR code as base64 PNG
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    // Store secret temporarily (not yet enabled — user must verify first)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return { secret, qrCode };
  }

  // ── verifyTotpSetup ────────────────────────────────────────────
  async verifyTotpSetup(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.mfaSecret) {
      throw new BadRequestException(
        'MFA setup not initiated. Please generate a QR code first.',
      );
    }

    const isValid = this.verifyTotpCode(user.mfaSecret, code);

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable MFA now that user has successfully scanned and verified
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: true,
        mfaMethod: MfaMethod.TOTP,
      },
    });

    this.logger.log(`MFA enabled for user ${userId}`);
  }

  // ── verifyMfaCode ──────────────────────────────────────────────
  async verifyMfaCode(
    mfaToken: string,
    code: string,
    method: MfaMethod,
  ): Promise<TokenPair> {
    // Verify the partial MFA token
    let payload: JwtMfaPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtMfaPayload>(mfaToken, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }

    if (payload.type !== 'mfa_partial') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (method === MfaMethod.TOTP) {
      await this.verifyTotpLogin(user, code);
    } else {
      await this.verifyEmailOtpLogin(user, code);
    }

    // Issue full token pair
    return this.authService.generateTokens(user.id, user.role);
  }

  // ── sendEmailOtp ───────────────────────────────────────────────
  async sendEmailOtp(mfaToken: string): Promise<void> {
    let payload: JwtMfaPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtMfaPayload>(mfaToken, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check cooldown — TC-022
    const userRecord = user as typeof user & {
      emailOtpSentAt?: Date | null;
    };
    if (userRecord.emailOtpSentAt) {
      const secondsSinceLast =
        (Date.now() - userRecord.emailOtpSentAt.getTime()) / 1000;
      if (secondsSinceLast < OTP_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLast);
        throw new BadRequestException(
          `Please wait ${remaining} seconds before requesting a new code`,
        );
      }
    }

    // Generate 6-digit OTP
    const otpCode = randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP — TC-020 (invalidates old OTP by overwriting)
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtpCode: otpCode,
        emailOtpSentAt: new Date(),
        emailOtpExpiry: expiry,
      } as Record<string, unknown>,
    });

    // Send email
    await this.mail.sendOtp(user.email, otpCode);
    this.logger.log(`Email OTP sent to ${user.email}`);
  }

  // ── disableMfa ─────────────────────────────────────────────────
  async disableMfa(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaMethod: null,
      },
    });
    this.logger.log(`MFA disabled for user ${userId}`);
  }

  // ── Private helpers ─────────────────────────────────────────────

  protected verifyTotpCode(secret: string, code: string): boolean {
    return verifySync({ token: code, secret }).valid;
  }

  private async verifyTotpLogin(
    user: {
      mfaFailedAttempts: number;
      id: string;
      mfaSecret: string | null;
      lastUsedMfaCode?: string | null;
    },
    code: string,
  ): Promise<void> {
    if (!user.mfaSecret) {
      throw new UnauthorizedException('MFA not configured');
    }

    // TC-023 — Replay attack prevention
    if (user.lastUsedMfaCode === code) {
      throw new UnauthorizedException('Code has already been used');
    }

    const isValid = this.verifyTotpCode(user.mfaSecret, code);

    if (!isValid) {
      const newFailCount = (user.mfaFailedAttempts ?? 0) + 1;

      // TC-021 — lockout after 3 fails

      if (newFailCount >= 3) {
        await this.prisma.user.update({
          where: { id: user.id },

          data: { mfaFailedAttempts: 0 } as Record<string, unknown>,
        });

        throw new UnauthorizedException(
          'Too many failed attempts. Please log in again.',
        );
      }

      await this.prisma.user.update({
        where: { id: user.id },

        data: { mfaFailedAttempts: newFailCount } as Record<string, unknown>,
      });

      throw new UnauthorizedException('Invalid verification code');
    }

    // Store used code to prevent replay + reset failed attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastUsedMfaCode: code,
        mfaFailedAttempts: 0, // ← add this
      } as Record<string, unknown>,
    });
  }

  private async verifyEmailOtpLogin(
    user: {
      id: string;
      emailOtpCode?: string | null;
      emailOtpExpiry?: Date | null;
    },
    code: string,
  ): Promise<void> {
    const userRecord = user as typeof user & {
      emailOtpCode?: string | null;
      emailOtpExpiry?: Date | null;
    };

    // TC-020 — Check expiry
    if (!userRecord.emailOtpExpiry || userRecord.emailOtpExpiry < new Date()) {
      throw new UnauthorizedException('Verification code has expired');
    }

    // TC-019 — Check code matches
    if (userRecord.emailOtpCode !== code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Invalidate OTP after use
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtpCode: null,
        emailOtpExpiry: null,
      } as Record<string, unknown>,
    });
  }
}
