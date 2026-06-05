// apps/api/src/common/common.module.ts
import { Module } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { RedisOtpService } from './services/redis-otp.service';

@Module({
  providers: [EncryptionService, RedisOtpService],
  exports: [EncryptionService, RedisOtpService],
})
export class CommonModule {}
