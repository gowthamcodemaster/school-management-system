import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../database/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import { RedisOtpService } from '../common/services/redis-otp.service';
import { AuthService, TokenPair } from './auth.service';
import { MfaMethod } from '@prisma/client';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { randomInt } from 'crypto';
import {
  MAIL_QUEUE,
  SEND_OTP_JOB,
  type SendOtpJobData,
} from './mail/mail.processor';

const MAX_MFA_ATTEMPTS = 3;

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
    private readonly encryption: EncryptionService,
    private readonly redisOtp: RedisOtpService,
    private readonly authService: AuthService,
    @InjectQueue(MAIL_QUEUE)
    private readonly mailQueue: Queue<SendOtpJobData>,
  ) {}

  async generateTotpSetup(
    userId: string,
  ): Promise<{ secret: string; qrCode: string }> {
    const start = Date.now();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const secret = generateSecret();
    const issuer = this.config.get<string>('MFA_ISSUER') ?? 'VidyaDhara';
    const otpauthUrl = generateURI({ issuer, label: user.email, secret });

    const qrCode = await QRCode.toDataURL(otpauthUrl);
    const encryptedSecret = this.encryption.encrypt(secret);

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: encryptedSecret },
    });

    this.logger.debug(`generateTotpSetup: ${Date.now() - start}ms`);
    return { secret, qrCode };
  }

  async verifyTotpSetup(userId: string, code: string): Promise<void> {
    const start = Date.now();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) {
      throw new BadRequestException(
        'MFA setup not initiated. Please generate a QR code first.',
      );
    }

    const secret = this.encryption.decrypt(user.mfaSecret);
    if (!this.verifyTotpCode(secret, code)) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaMethod: MfaMethod.TOTP },
    });

    this.logger.log(
      `MFA enabled for user ${userId} in ${Date.now() - start}ms`,
    );
  }

  async verifyMfaCode(
    mfaToken: string,
    code: string,
    method: MfaMethod,
  ): Promise<TokenPair> {
    const start = Date.now();

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
    if (!user) throw new UnauthorizedException('User not found');

    const attempts = await this.redisOtp.getMfaAttempts(user.id);
    if (attempts >= MAX_MFA_ATTEMPTS) {
      throw new UnauthorizedException(
        'Too many failed attempts. Please log in again.',
      );
    }

    try {
      if (method === MfaMethod.TOTP) {
        await this.verifyTotpLogin(user, code);
      } else {
        await this.verifyEmailOtpLogin(user.id, code);
      }
    } catch (error) {
      await this.redisOtp.incrementMfaAttempts(user.id);
      throw error;
    }

    await this.redisOtp.resetMfaAttempts(user.id);
    const tokens = await this.authService.generateTokens(user.id, user.role);
    this.logger.debug(`verifyMfaCode (${method}): ${Date.now() - start}ms`);
    return tokens;
  }

  async sendEmailOtp(mfaToken: string): Promise<void> {
    const start = Date.now();

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
    if (!user) throw new UnauthorizedException('User not found');

    const { onCooldown, remainingSeconds } =
      await this.redisOtp.isOtpOnCooldown(user.id);
    if (onCooldown) {
      throw new BadRequestException(
        `Please wait ${remainingSeconds} seconds before requesting a new code`,
      );
    }

    const otpCode = randomInt(100000, 999999).toString();
    await this.redisOtp.storeEmailOtp(user.id, otpCode);
    await this.redisOtp.setOtpCooldown(user.id);

    await this.mailQueue.add(
      SEND_OTP_JOB,
      { email: user.email, code: otpCode },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.debug(
      `Email OTP queued for ${user.email} in ${Date.now() - start}ms`,
    );
  }

  async disableMfa(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null, mfaMethod: null },
    });
    await this.redisOtp.resetMfaAttempts(userId);
    await this.redisOtp.deleteEmailOtp(userId);
    this.logger.log(`MFA disabled for user ${userId}`);
  }

  protected verifyTotpCode(secret: string, code: string): boolean {
    return verifySync({ token: code, secret }).valid;
  }

  private async verifyTotpLogin(
    user: { id: string; mfaSecret: string | null },
    code: string,
  ): Promise<void> {
    if (!user.mfaSecret) throw new UnauthorizedException('MFA not configured');

    const secret = this.encryption.decrypt(user.mfaSecret);
    const notReplayed = await this.redisOtp.markTotpCodeUsed(user.id, code);
    if (!notReplayed)
      throw new UnauthorizedException('Code has already been used');

    if (!this.verifyTotpCode(secret, code)) {
      throw new UnauthorizedException('Invalid verification code');
    }
  }

  private async verifyEmailOtpLogin(
    userId: string,
    code: string,
  ): Promise<void> {
    const isValid = await this.redisOtp.verifyEmailOtp(userId, code);
    if (!isValid)
      throw new UnauthorizedException('Invalid or expired verification code');
  }
}
