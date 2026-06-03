// apps/api/src/auth/mfa.controller.ts placeholder
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MfaService } from './mfa.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { MfaSetupVerifyDto } from './dto/mfa-setup-verify.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { MfaSendOtpDto } from './dto/mfa-send-otp.dto';
import { Request } from 'express';

@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Get('setup')
  @UseGuards(JwtAuthGuard)
  async setupTotp(@Req() req: Request & { user: { id: string } }) {
    return this.mfaService.generateTotpSetup(req.user.id);
  }

  @Post('setup/verify')
  @UseGuards(JwtAuthGuard)
  async verifyTotpSetup(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: MfaSetupVerifyDto,
  ) {
    return this.mfaService.verifyTotpSetup(req.user.id, dto.code);
  }

  @Post('verify')
  async verifyMfa(@Body() dto: MfaVerifyDto) {
    return this.mfaService.verifyMfaCode(dto.mfaToken, dto.code, dto.method);
  }

  @Post('send-otp')
  async sendOtp(@Body() dto: MfaSendOtpDto) {
    return this.mfaService.sendEmailOtp(dto.mfaToken);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async disableMfa(@Req() req: Request & { user: { id: string } }) {
    return this.mfaService.disableMfa(req.user.id);
  }
}
