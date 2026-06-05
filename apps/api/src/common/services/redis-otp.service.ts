// apps/api/src/common/services/redis-otp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as bcrypt from 'bcryptjs';

const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes
const USED_CODE_TTL_SECONDS = 60; // 1 TOTP window + buffer

@Injectable()
export class RedisOtpService {
  private readonly logger = new Logger(RedisOtpService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  // ── Email OTP ──────────────────────────────────────────────────

  async storeEmailOtp(userId: string, otp: string): Promise<void> {
    const hashed = await bcrypt.hash(otp, 10);
    const key = `otp:email:${userId}`;
    await this.redis.setex(key, OTP_EXPIRY_SECONDS, hashed);
    this.logger.debug(`Email OTP stored for user ${userId}`);
  }

  async verifyEmailOtp(userId: string, otp: string): Promise<boolean> {
    const key = `otp:email:${userId}`;
    const hashed = await this.redis.get(key);

    if (!hashed) return false; // expired or never set

    const isValid = await bcrypt.compare(otp, hashed);

    if (isValid) {
      // Delete OTP after successful use — TC-023 equivalent for email
      await this.redis.del(key);
    }

    return isValid;
  }

  async deleteEmailOtp(userId: string): Promise<void> {
    await this.redis.del(`otp:email:${userId}`);
  }

  // ── TOTP Replay Prevention ─────────────────────────────────────

  async markTotpCodeUsed(userId: string, code: string): Promise<boolean> {
    const key = `otp:totp:used:${userId}:${code}`;

    // Atomic SET NX — only succeeds if key doesn't exist
    // Prevents race condition on concurrent requests
    const result = await this.redis.set(
      key,
      '1',
      'EX',
      USED_CODE_TTL_SECONDS,
      'NX', // only set if not exists
    );

    // result is 'OK' if set, null if already existed
    return result === 'OK';
  }

  // ── MFA Failed Attempts ────────────────────────────────────────

  async incrementMfaAttempts(userId: string): Promise<number> {
    const key = `mfa:attempts:${userId}`;
    const count = await this.redis.incr(key);

    // Set TTL on first attempt — resets after 15 minutes
    if (count === 1) {
      await this.redis.expire(key, 15 * 60);
    }

    return count;
  }

  async resetMfaAttempts(userId: string): Promise<void> {
    await this.redis.del(`mfa:attempts:${userId}`);
  }

  async getMfaAttempts(userId: string): Promise<number> {
    const count = await this.redis.get(`mfa:attempts:${userId}`);
    return count ? parseInt(count, 10) : 0;
  }

  // ── OTP Cooldown ───────────────────────────────────────────────

  async setOtpCooldown(userId: string, cooldownSeconds = 60): Promise<void> {
    await this.redis.setex(`otp:cooldown:${userId}`, cooldownSeconds, '1');
  }

  async isOtpOnCooldown(
    userId: string,
  ): Promise<{ onCooldown: boolean; remainingSeconds: number }> {
    const ttl = await this.redis.ttl(`otp:cooldown:${userId}`);
    return {
      onCooldown: ttl > 0,
      remainingSeconds: Math.max(ttl, 0),
    };
  }
}
