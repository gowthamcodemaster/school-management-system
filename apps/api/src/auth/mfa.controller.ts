// apps/api/src/auth/mfa.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { MfaService } from './mfa.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MfaPartialGuard } from './guards/mfa-partial.guard';
import { MfaSetupVerifyDto } from './dto/mfa-setup-verify.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { MfaSendOtpDto } from './dto/mfa-send-otp.dto';

@ApiTags('MFA')
@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  // ── GET /auth/mfa/setup ────────────────────────────────────────
  @Get('setup')
  @UseGuards(MfaPartialGuard) // accepts mfa_partial token
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate TOTP secret and QR code for MFA enrollment',
  })
  @ApiResponse({ status: 200, description: 'QR code and secret returned' })
  async setupTotp(
    @Req() req: Request & { user: { id: string } },
  ): Promise<{ secret: string; qrCode: string }> {
    return this.mfaService.generateTotpSetup(req.user.id);
  }

  // ── POST /auth/mfa/setup/verify ────────────────────────────────
  @Post('setup/verify')
  @UseGuards(MfaPartialGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({ summary: 'Verify TOTP code to complete MFA enrollment' })
  @ApiResponse({ status: 200, description: 'MFA enabled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid code' })
  async verifyTotpSetup(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: MfaSetupVerifyDto,
  ): Promise<{ message: string }> {
    await this.mfaService.verifyTotpSetup(req.user.id, dto.code);
    return { message: 'MFA enabled successfully' };
  }

  // ── POST /auth/mfa/verify ──────────────────────────────────────
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @ApiOperation({ summary: 'Verify MFA code (TOTP or Email OTP) during login' })
  @ApiResponse({ status: 200, description: 'Full access token returned' })
  @ApiResponse({ status: 401, description: 'Invalid code or token' })
  async verifyMfa(@Body() dto: MfaVerifyDto) {
    return this.mfaService.verifyMfaCode(dto.mfaToken, dto.code, dto.method);
  }

  // ── POST /auth/mfa/send-otp ────────────────────────────────────
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 sends per minute
  @ApiOperation({ summary: 'Send Email OTP for verification' })
  @ApiResponse({ status: 200, description: 'OTP queued for delivery' })
  @ApiResponse({ status: 400, description: 'Cooldown in effect' })
  async sendOtp(@Body() dto: MfaSendOtpDto): Promise<void> {
    return this.mfaService.sendEmailOtp(dto.mfaToken);
  }

  // ── DELETE /auth/mfa ───────────────────────────────────────────
  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable MFA for authenticated user' })
  async disableMfa(
    @Req() req: Request & { user: { id: string } },
  ): Promise<void> {
    return this.mfaService.disableMfa(req.user.id);
  }
}
