// Add this at the very top, before any imports
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
// ── Mocks ──────────────────────────────────────────────────────────
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
} as unknown as jest.Mocked<PrismaService>;

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
} as unknown as jest.Mocked<JwtService>;

// ── Test user fixture ──────────────────────────────────────────────
const mockSuperAdmin = {
  id: 'user-cuid-001',
  email: 'superadmin@vidyadhara.com',
  password: '$2a$10$hashedpassword',
  role: UserRole.SUPER_ADMIN,
  firstName: 'Super',
  lastName: 'Admin',
  phone: null,
  isActive: true,
  failedLoginAttempts: 0,
  lockedUntil: null,
  lastLoginAt: null,
  passwordChangedAt: null,
  mfaEnabled: false,
  mfaSecret: null,
  mfaMethod: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: { get: jest.fn() } }, // mock ConfigService
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ── Service instantiation ────────────────────────────────────────
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── validateCredentials ──────────────────────────────────────────
  describe('validateCredentials', () => {
    it('TC-001: should return user when credentials are valid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockSuperAdmin);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateCredentials(
        'superadmin@vidyadhara.com',
        'ValidPassword123!',
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockSuperAdmin.id);
      expect((result as Record<string, unknown>).password).toBeUndefined();
    });

    it('TC-004: should throw UnauthorizedException for wrong password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockSuperAdmin);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockSuperAdmin,
        failedLoginAttempts: 1,
      });

      await expect(
        service.validateCredentials('superadmin@vidyadhara.com', 'WrongPass!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('TC-005: should throw UnauthorizedException for non-existent email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateCredentials('nobody@test.com', 'AnyPassword!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('TC-005: should return same error for wrong password and non-existent email (no enumeration)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      let nonExistentError: Error | undefined;
      try {
        await service.validateCredentials('nobody@test.com', 'AnyPass!');
      } catch (e) {
        nonExistentError = e as Error;
      }

      mockPrismaService.user.findUnique.mockResolvedValue(mockSuperAdmin);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      mockPrismaService.user.update.mockResolvedValue(mockSuperAdmin);

      let wrongPassError: Error | undefined;
      try {
        await service.validateCredentials(
          'superadmin@vidyadhara.com',
          'WrongPass!',
        );
      } catch (e) {
        wrongPassError = e as Error;
      }

      // Both errors should be identical — no way to distinguish via response
      expect(nonExistentError?.message).toBe(wrongPassError?.message);
    });

    it('TC-009: should throw ForbiddenException when account is locked', async () => {
      const lockedUser = {
        ...mockSuperAdmin,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // locked for 15 mins
      };
      mockPrismaService.user.findUnique.mockResolvedValue(lockedUser);

      await expect(
        service.validateCredentials('superadmin@vidyadhara.com', 'AnyPass!'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('TC-009: should increment failedLoginAttempts on wrong password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockSuperAdmin);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockSuperAdmin,
        failedLoginAttempts: 1,
      });

      try {
        await service.validateCredentials(
          'superadmin@vidyadhara.com',
          'WrongPass!',
        );
      } catch {
        /* expected */
      }

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: { increment: 1 },
          }),
        }),
      );
    });

    it('TC-009: should lock account after 5 failed attempts', async () => {
      const almostLockedUser = {
        ...mockSuperAdmin,
        failedLoginAttempts: 4,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(almostLockedUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      mockPrismaService.user.update.mockResolvedValue({
        ...almostLockedUser,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
      });

      try {
        await service.validateCredentials(
          'superadmin@vidyadhara.com',
          'WrongPass!',
        );
      } catch {
        /* expected */
      }

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lockedUntil: expect.any(Date),
          }),
        }),
      );
    });

    it('should reset failedLoginAttempts on successful login', async () => {
      const userWithPreviousFails = {
        ...mockSuperAdmin,
        failedLoginAttempts: 2,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(
        userWithPreviousFails,
      );
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockPrismaService.user.update.mockResolvedValue({
        ...userWithPreviousFails,
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      });

      await service.validateCredentials(
        'superadmin@vidyadhara.com',
        'ValidPass!',
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 0,
            lastLoginAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockSuperAdmin,
        isActive: false,
      });

      await expect(
        service.validateCredentials('superadmin@vidyadhara.com', 'ValidPass!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should auto-unlock account if lockedUntil has passed', async () => {
      const expiredLockUser = {
        ...mockSuperAdmin,
        failedLoginAttempts: 5,
        lockedUntil: new Date(Date.now() - 1000), // lock expired 1 second ago
      };
      mockPrismaService.user.findUnique.mockResolvedValue(expiredLockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockPrismaService.user.update.mockResolvedValue({
        ...expiredLockUser,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      });

      const result = await service.validateCredentials(
        'superadmin@vidyadhara.com',
        'ValidPass!',
      );

      expect(result).toBeDefined();
    });
  });

  // ── generateTokens ───────────────────────────────────────────────
  describe('generateTokens', () => {
    it('should return accessToken and refreshToken', async () => {
      mockJwtService.signAsync.mockResolvedValueOnce('access-token-mock');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token-mock');
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: '',
        createdAt: new Date(),
        userId: '',
        token: '',
        expiresAt: new Date('01-08-2026'),
        isRevoked: false,
      });

      const result = await service.generateTokens(
        mockSuperAdmin.id,
        mockSuperAdmin.role,
      );

      expect(result.accessToken).toBe('access-token-mock');
      expect(result.refreshToken).toBe('refresh-token-mock');
    });

    it('should persist refresh token in database', async () => {
      mockJwtService.signAsync.mockResolvedValueOnce('access-token-mock');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token-mock');
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: '',
        createdAt: new Date(),
        userId: '',
        token: '',
        expiresAt: new Date('01-08-2026'),
        isRevoked: false,
      });

      await service.generateTokens(mockSuperAdmin.id, mockSuperAdmin.role);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockSuperAdmin.id,
            token: 'refresh-token-mock',
          }),
        }),
      );
    });
  });

  // ── refreshTokens ────────────────────────────────────────────────
  describe('refreshTokens', () => {
    it('should return new tokens for valid refresh token', async () => {
      const mockStoredToken = {
        id: 'token-id-001',
        userId: mockSuperAdmin.id,
        createdAt: new Date(),
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        user: mockSuperAdmin,
      };
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        mockStoredToken,
      );
      mockPrismaService.refreshToken.update.mockResolvedValue({
        id: 'token-id-001',
        userId: mockSuperAdmin.id,
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
      });
      mockJwtService.signAsync.mockResolvedValueOnce('new-access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('new-refresh-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({
        userId: '',
        token: '',
        id: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
      });

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshTokens('invalid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for revoked refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        isRevoked: true,
        expiresAt: new Date(Date.now() + 1000),
        id: '',
        userId: '',
        token: '',
        createdAt: new Date(),
      });

      await expect(service.refreshTokens('revoked-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        isRevoked: false,
        expiresAt: new Date(Date.now() - 1000),
        id: '',
        userId: '',
        token: '',
        createdAt: new Date(),
      });

      await expect(service.refreshTokens('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should revoke old refresh token on rotation', async () => {
      const mockStoredToken = {
        id: 'token-id-001',
        userId: mockSuperAdmin.id,
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        user: mockSuperAdmin,
        createdAt: new Date(),
      };
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(
        mockStoredToken,
      );
      mockPrismaService.refreshToken.update.mockResolvedValue({
        userId: '',
        id: '',
        token: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
      });
      mockJwtService.signAsync.mockResolvedValue('new-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: '',
        userId: '',
        token: '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        createdAt: new Date(),
      });

      await service.refreshTokens('valid-refresh-token');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isRevoked: true },
        }),
      );
    });
  });

  // ── logout ───────────────────────────────────────────────────────
  describe('logout', () => {
    it('should revoke all refresh tokens for user', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      await service.logout(mockSuperAdmin.id);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockSuperAdmin.id },
      });
    });
  });
});
