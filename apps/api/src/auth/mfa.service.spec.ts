// apps/api/src/auth/mfa.service.spec.ts
jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'MOCKSECRETBASE32ABCD'),
  generateURI: jest.fn(() => 'otpauth://totp/test?secret=MOCKSECRETBASE32ABCD'),
  verifySync: jest.fn(() => ({ valid: true })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { MfaService } from './mfa.service';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MfaMethod, UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { EncryptionService } from '@/common/services/encryption.service';
import { RedisOtpService } from '@/common/services/redis-otp.service';
import { MAIL_QUEUE } from './mail/mail.processor';

// ── Mocks ──────────────────────────────────────────────────────────
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      MFA_ISSUER: 'VidyaDhara',
      MFA_OTP_EXPIRY_MINS: '10',
    };
    // eslint-disable-next-line security/detect-object-injection
    return config[key];
  }),
};

const mockAuthService = {
  generateTokens: jest.fn(),
};

const mockEncryptionService = {
  encrypt: jest.fn(),
  decrypt: jest.fn(),
};

const mockRedisOtpService = {
  storeEmailOtp: jest.fn(),
  deleteEmailOtp: jest.fn(),
  verifyEmailOtp: jest.fn(),
  getMfaAttempts: jest.fn(),
  incrementMfaAttempts: jest.fn(),
  resetMfaAttempts: jest.fn(),
  isOtpOnCooldown: jest.fn(),
  setOtpCooldown: jest.fn(),
  markTotpCodeUsed: jest.fn(),
};

const mockMailQueue = {
  add: jest.fn(),
};

// ── Fixtures ───────────────────────────────────────────────────────
const mockUser = {
  id: 'user-cuid-001',
  email: 'superadmin@vidyadhara.com',
  role: UserRole.SUPER_ADMIN,
  firstName: 'Super',
  lastName: 'Admin',
  isActive: true,
  mfaEnabled: false,
  mfaSecret: null,
  mfaMethod: null,
};

const mockUserWithTotp = {
  ...mockUser,
  mfaEnabled: true,
  mfaSecret: 'JBSWY3DPEHPK3PXP', // base32 test secret
  mfaMethod: MfaMethod.TOTP,
};

describe('MfaService', () => {
  let service: MfaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EncryptionService, useValue: mockEncryptionService },
        { provide: RedisOtpService, useValue: mockRedisOtpService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: getQueueToken(MAIL_QUEUE), useValue: mockMailQueue },
      ],
    }).compile();

    service = module.get<MfaService>(MfaService);
    jest.clearAllMocks();
    mockAuthService.generateTokens.mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
    mockEncryptionService.encrypt.mockReturnValue('encrypted-secret');
    mockEncryptionService.decrypt.mockReturnValue('decrypted-secret');
    mockRedisOtpService.getMfaAttempts.mockResolvedValue(0);
    mockRedisOtpService.markTotpCodeUsed.mockResolvedValue(true);
    mockRedisOtpService.resetMfaAttempts.mockResolvedValue(undefined);
    mockRedisOtpService.incrementMfaAttempts.mockResolvedValue(undefined);
    mockRedisOtpService.isOtpOnCooldown.mockResolvedValue({
      onCooldown: false,
      remainingSeconds: 0,
    });
    mockRedisOtpService.storeEmailOtp.mockResolvedValue(undefined);
    mockRedisOtpService.setOtpCooldown.mockResolvedValue(undefined);
    mockRedisOtpService.deleteEmailOtp.mockResolvedValue(undefined);
    mockMailQueue.add.mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── generateTotpSetup ──────────────────────────────────────────
  describe('generateTotpSetup', () => {
    it('TC-016: should generate a TOTP secret and QR code for a user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        mfaSecret: 'GENERATED_SECRET',
      });

      const result = await service.generateTotpSetup(mockUser.id);

      expect(result.secret).toBeDefined();
      expect(result.qrCode).toBeDefined();
      expect(result.qrCode).toContain('data:image/png;base64');
    });

    it('TC-016: should store the TOTP secret in the database', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      await service.generateTotpSetup(mockUser.id);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            mfaSecret: expect.any(String),
          }),
        }),
      );
    });

    it('should throw if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.generateTotpSetup('nonexistent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── verifyTotpSetup ────────────────────────────────────────────
  describe('verifyTotpSetup', () => {
    it('TC-016: should enable MFA when valid TOTP code is provided', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithTotp);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUserWithTotp,
        mfaEnabled: true,
        mfaMethod: MfaMethod.TOTP,
      });

      jest
        .spyOn(
          service as unknown as { verifyTotpCode: () => boolean },
          'verifyTotpCode',
        )
        .mockReturnValue(true);

      await service.verifyTotpSetup(mockUser.id, '123456');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            mfaEnabled: true,
            mfaMethod: MfaMethod.TOTP,
          }),
        }),
      );
    });

    it('TC-017: should throw BadRequestException for invalid TOTP code during setup', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithTotp);
      jest
        .spyOn(
          service as unknown as { verifyTotpCode: () => boolean },
          'verifyTotpCode',
        )
        .mockReturnValue(false);

      await expect(
        service.verifyTotpSetup(mockUser.id, '999999'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if user has no MFA secret', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser); // no mfaSecret

      await expect(
        service.verifyTotpSetup(mockUser.id, '123456'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── verifyMfaCode ──────────────────────────────────────────────
  describe('verifyMfaCode', () => {
    it('TC-012: should return full tokens for valid TOTP code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithTotp);
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'mfa_partial',
      });
      jest
        .spyOn(
          service as unknown as { verifyTotpCode: () => boolean },
          'verifyTotpCode',
        )
        .mockReturnValue(true);

      const result = await service.verifyMfaCode(
        'partial-mfa-token',
        '123456',
        MfaMethod.TOTP,
      );

      expect(result.accessToken).toBeDefined();
    });

    it('TC-017: should throw UnauthorizedException for invalid TOTP code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithTotp);
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'mfa_partial',
      });
      jest
        .spyOn(
          service as unknown as { verifyTotpCode: () => boolean },
          'verifyTotpCode',
        )
        .mockReturnValue(false);

      await expect(
        service.verifyMfaCode('partial-mfa-token', '999999', MfaMethod.TOTP),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('TC-023: should throw UnauthorizedException for replayed TOTP code', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithTotp);
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'mfa_partial',
      });
      mockRedisOtpService.markTotpCodeUsed.mockResolvedValue(false); // already used

      await expect(
        service.verifyMfaCode('partial-mfa-token', '123456', MfaMethod.TOTP),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid mfa partial token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.verifyMfaCode('invalid-token', '123456', MfaMethod.TOTP),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong token type', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'access', // wrong type — should be mfa_partial
      });

      await expect(
        service.verifyMfaCode('access-token', '123456', MfaMethod.TOTP),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── sendEmailOtp ───────────────────────────────────────────────
  describe('sendEmailOtp', () => {
    it('TC-013: should send email OTP to user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'mfa_partial',
      });

      await service.sendEmailOtp('partial-mfa-token');

      expect(mockMailQueue.add).toHaveBeenCalledWith(
        'send-otp',
        expect.objectContaining({ email: mockUser.email }),
        expect.any(Object),
      );
    });

    it('TC-022: should not send OTP before cooldown period', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'mfa_partial',
      });
      mockRedisOtpService.isOtpOnCooldown.mockResolvedValue({
        onCooldown: true,
        remainingSeconds: 30,
      });

      await expect(service.sendEmailOtp('partial-mfa-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('TC-020: should store new OTP in Redis when sent', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'mfa_partial',
      });

      await service.sendEmailOtp('partial-mfa-token');

      expect(mockRedisOtpService.storeEmailOtp).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
      );
    });

    it('TC-021: should terminate session after 3 failed MFA attempts', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithTotp);
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'mfa_partial',
      });
      mockRedisOtpService.getMfaAttempts.mockResolvedValue(3); // already at max
      jest
        .spyOn(
          service as unknown as { verifyTotpCode: () => boolean },
          'verifyTotpCode',
        )
        .mockReturnValue(false);

      await expect(
        service.verifyMfaCode('partial-mfa-token', '999999', MfaMethod.TOTP),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── verifyEmailOtp ─────────────────────────────────────────────
  describe('verifyEmailOtp', () => {
    it('TC-013: should return tokens for valid email OTP', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'mfa_partial',
      });
      mockRedisOtpService.verifyEmailOtp.mockResolvedValue(true);

      const result = await service.verifyMfaCode(
        'partial-mfa-token',
        '654321',
        MfaMethod.EMAIL_OTP,
      );

      expect(result.accessToken).toBeDefined();
    });

    it('TC-019: should throw UnauthorizedException for invalid email OTP', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'mfa_partial',
      });
      mockRedisOtpService.verifyEmailOtp.mockResolvedValue(false);

      await expect(
        service.verifyMfaCode(
          'partial-mfa-token',
          '000000',
          MfaMethod.EMAIL_OTP,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('TC-020: should throw UnauthorizedException for expired email OTP', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: mockUser.id,
        type: 'mfa_partial',
      });
      mockRedisOtpService.verifyEmailOtp.mockResolvedValue(false); // expired/invalid

      await expect(
        service.verifyMfaCode(
          'partial-mfa-token',
          '654321',
          MfaMethod.EMAIL_OTP,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── disableMfa ─────────────────────────────────────────────────
  describe('disableMfa', () => {
    it('should disable MFA for a user', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUserWithTotp,
        mfaEnabled: false,
        mfaSecret: null,
        mfaMethod: null,
      });

      await service.disableMfa(mockUser.id);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            mfaEnabled: false,
            mfaSecret: null,
            mfaMethod: null,
          }),
        }),
      );
    });
  });
});
