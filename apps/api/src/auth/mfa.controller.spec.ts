// apps/api/src/auth/mfa.controller.spec.ts
jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'MOCKSECRETBASE32ABCD'),
  generateURI: jest.fn(() => 'otpauth://totp/test?secret=MOCKSECRETBASE32ABCD'),
  verifySync: jest.fn(() => ({ valid: true })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';
import { MfaMethod, UserRole } from '@prisma/client';
import { MfaSetupVerifyDto } from './dto/mfa-setup-verify.dto';
import { MfaVerifyDto } from './dto/mfa-verify.dto';
import { MfaSendOtpDto } from './dto/mfa-send-otp.dto';
import { MfaPartialGuard } from './guards/mfa-partial.guard';

// ── Mocks ──────────────────────────────────────────────────────────
const mockMfaService = {
  generateTotpSetup: jest.fn(),
  verifyTotpSetup: jest.fn(),
  verifyMfaCode: jest.fn(),
  sendEmailOtp: jest.fn(),
  disableMfa: jest.fn(),
} as unknown as jest.Mocked<MfaService>;

const mockRequest = {
  user: {
    id: 'user-cuid-001',
    role: UserRole.SUPER_ADMIN,
  },
};

const mockMfaPartialGuard = {
  canActivate: jest.fn(),
};

describe('MfaController', () => {
  let controller: MfaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MfaController],
      providers: [{ provide: MfaService, useValue: mockMfaService }],
    })
      .overrideGuard(MfaPartialGuard)
      .useValue(mockMfaPartialGuard)
      .compile();

    controller = module.get<MfaController>(MfaController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── GET /auth/mfa/setup ────────────────────────────────────────
  describe('GET /auth/mfa/setup', () => {
    it('TC-016: should return QR code and secret for TOTP setup', async () => {
      const mockSetup = {
        secret: 'JBSWY3DPEHPK3PXP',
        qrCode: 'data:image/png;base64,abc123',
      };
      mockMfaService.generateTotpSetup.mockResolvedValue(mockSetup);

      const result = await controller.setupTotp(mockRequest as never);

      expect(result).toEqual(mockSetup);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMfaService.generateTotpSetup).toHaveBeenCalledWith(
        mockRequest.user.id,
      );
    });
  });

  // ── POST /auth/mfa/setup/verify ────────────────────────────────
  describe('POST /auth/mfa/setup/verify', () => {
    it('TC-016: should enable MFA when valid code submitted', async () => {
      mockMfaService.verifyTotpSetup.mockResolvedValue(undefined);

      const dto: MfaSetupVerifyDto = { code: '123456' };
      await controller.verifyTotpSetup(mockRequest as never, dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMfaService.verifyTotpSetup).toHaveBeenCalledWith(
        mockRequest.user.id,
        dto.code,
      );
    });

    it('TC-017: should propagate BadRequestException for invalid code', async () => {
      const { BadRequestException } = await import('@nestjs/common');
      mockMfaService.verifyTotpSetup.mockRejectedValue(
        new BadRequestException('Invalid code'),
      );

      const dto: MfaSetupVerifyDto = { code: '999999' };
      await expect(
        controller.verifyTotpSetup(mockRequest as never, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── POST /auth/mfa/verify ──────────────────────────────────────
  describe('POST /auth/mfa/verify', () => {
    it('TC-012: should return tokens for valid TOTP verification', async () => {
      const mockTokens = {
        accessToken: 'full-access-token',
        refreshToken: 'full-refresh-token',
      };
      mockMfaService.verifyMfaCode.mockResolvedValue(mockTokens);

      const dto: MfaVerifyDto = {
        code: '123456',
        mfaToken: 'partial-token',
        method: MfaMethod.TOTP,
      };

      const result = await controller.verifyMfa(dto);

      expect(result).toEqual(mockTokens);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMfaService.verifyMfaCode).toHaveBeenCalledWith(
        dto.mfaToken,
        dto.code,
        dto.method,
      );
    });

    it('TC-013: should return tokens for valid Email OTP verification', async () => {
      const mockTokens = {
        accessToken: 'full-access-token',
        refreshToken: 'full-refresh-token',
      };
      mockMfaService.verifyMfaCode.mockResolvedValue(mockTokens);

      const dto: MfaVerifyDto = {
        code: '654321',
        mfaToken: 'partial-token',
        method: MfaMethod.EMAIL_OTP,
      };

      const result = await controller.verifyMfa(dto);
      expect(result.accessToken).toBeDefined();
    });

    it('TC-017: should propagate UnauthorizedException for invalid code', async () => {
      const { UnauthorizedException } = await import('@nestjs/common');
      mockMfaService.verifyMfaCode.mockRejectedValue(
        new UnauthorizedException('Invalid code'),
      );

      const dto: MfaVerifyDto = {
        code: '999999',
        mfaToken: 'partial-token',
        method: MfaMethod.TOTP,
      };

      await expect(controller.verifyMfa(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── POST /auth/mfa/send-otp ────────────────────────────────────
  describe('POST /auth/mfa/send-otp', () => {
    it('TC-015: should send email OTP successfully', async () => {
      mockMfaService.sendEmailOtp.mockResolvedValue(undefined);

      const dto: MfaSendOtpDto = { mfaToken: 'partial-token' };
      await controller.sendOtp(dto);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMfaService.sendEmailOtp).toHaveBeenCalledWith(dto.mfaToken);
    });

    it('TC-022: should propagate BadRequestException when OTP sent too soon', async () => {
      const { BadRequestException } = await import('@nestjs/common');
      mockMfaService.sendEmailOtp.mockRejectedValue(
        new BadRequestException('Please wait before requesting a new code'),
      );

      const dto: MfaSendOtpDto = { mfaToken: 'partial-token' };
      await expect(controller.sendOtp(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── DELETE /auth/mfa ───────────────────────────────────────────
  describe('DELETE /auth/mfa', () => {
    it('should disable MFA for authenticated user', async () => {
      mockMfaService.disableMfa.mockResolvedValue(undefined);

      await controller.disableMfa(mockRequest as never);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockMfaService.disableMfa).toHaveBeenCalledWith(
        mockRequest.user.id,
      );
    });
  });
});
