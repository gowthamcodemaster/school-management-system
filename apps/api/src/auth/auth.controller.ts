// apps/api/src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
// import { getCookieOptions } from '@/config/cookie.config';

// ── Cookie config ──────────────────────────────────────────────────
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/auth',
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  // ── POST /auth/login ───────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Super Admin login with credentials' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Account locked' })
  async login(@Body() loginDto: LoginDto, @Res() res: Response): Promise<void> {
    const user = await this.authService.validateCredentials(
      loginDto.email,
      loginDto.password,
    );

    // If MFA is enabled, return partial token + mfaRequired flag
    if (user.mfaEnabled) {
      const mfaToken = await this.authService.generateMfaPartialToken(
        user.id,
        user.role,
      );
      res.json({
        mfaRequired: true,
        mfaMethod: user.mfaMethod,
        mfaToken, // short-lived token for MFA step
      });
      return;
    }

    // No MFA — issue full tokens
    const tokens = await this.authService.generateTokens(user.id, user.role);
    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    res.json({
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  }

  // ── POST /auth/refresh ─────────────────────────────────────────
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res() res: Response,
  ): Promise<void> {
    const tokens = await this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
    );

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken: tokens.accessToken });
  }

  // ── POST /auth/logout ──────────────────────────────────────────
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and revoke all tokens' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Req() req: Request & { user: { id: string } },
    @Res() res: Response,
  ): Promise<void> {
    await this.authService.logout(req.user.id);
    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/auth' });
    res.json({ message: 'Logged out successfully' });
  }
}
