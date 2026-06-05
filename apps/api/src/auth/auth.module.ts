// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MfaService } from './mfa.service';
import { MfaController } from './mfa.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MfaPartialGuard } from './guards/mfa-partial.guard';
import { DatabaseModule } from '../database/database.module';
import { MailModule } from './mail/mail.module';
import { CommonModule } from '../common/common.module';
@Module({
  imports: [
    DatabaseModule,
    MailModule,
    CommonModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN') ?? '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController, MfaController],
  providers: [
    AuthService,
    MfaService,
    JwtStrategy,
    JwtAuthGuard,
    MfaPartialGuard,
  ],
  exports: [AuthService, MfaService, JwtAuthGuard, MfaPartialGuard],
})
export class AuthModule {}
