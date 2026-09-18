import { describe, expect, it, vi } from 'vitest';
import { ForgotPassword } from '../../../src/modules/auth/application/forgot-password.use-case';
import { ResetPassword } from '../../../src/modules/auth/application/reset-password.use-case';
import { ValidationError } from '../../../src/core/exceptions';
import type { AuthUser } from '../../../src/modules/auth/domain/auth-user';
import type {
  IAuthUserRepository,
  IPasswordHasher,
  IRefreshTokenRepository,
} from '../../../src/modules/auth/application/ports';

const baseUser: AuthUser = {
  id: 'u-101',
  email: 'patron@example.com',
  phone: '+919876543210',
  passwordHash: '$2a$12$currentHashValue',
  userType: 'CUSTOMER',
  roleId: 'role-customer',
  status: 'ACTIVE',
  mfaEnabled: false,
  mfaSecret: null,
  failedLoginAttempts: 0,
  lockedUntil: null,
  passwordHistory: ['$2a$12$oldHash1', '$2a$12$oldHash2'],
  passwordResetToken: 'valid-test-token-12345',
  passwordResetExpiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour in future
};

describe('ForgotPassword UseCase', () => {
  it('SECURITY: preserves non-enumeration for non-existent email addresses', async () => {
    const mockUsers = {
      findByEmail: vi.fn(async () => null),
      setPasswordResetToken: vi.fn(async () => undefined),
    } as unknown as IAuthUserRepository;

    const useCase = new ForgotPassword(mockUsers);
    const result = await useCase.execute({ email: 'nonexistent@example.com' });

    expect(result.success).toBe(true);
    expect(result.message).toContain('If an account exists');
    expect(mockUsers.setPasswordResetToken).not.toHaveBeenCalled();
  });

  it('SECURITY: does not issue reset token if account status is SUSPENDED or INACTIVE', async () => {
    const mockUsers = {
      findByEmail: vi.fn(async () => ({ ...baseUser, status: 'SUSPENDED' as const })),
      setPasswordResetToken: vi.fn(async () => undefined),
    } as unknown as IAuthUserRepository;

    const useCase = new ForgotPassword(mockUsers);
    const result = await useCase.execute({ email: baseUser.email });

    expect(result.success).toBe(true);
    expect(result.message).toContain('If an account exists');
    expect(mockUsers.setPasswordResetToken).not.toHaveBeenCalled();
  });

  it('generates cryptographic reset token with 1-hour expiry for valid account', async () => {
    let savedToken = '';
    let savedExpiresAt: Date | undefined;

    const mockUsers = {
      findByEmail: vi.fn(async () => baseUser),
      setPasswordResetToken: vi.fn(async (_id: string, token: string, expiresAt: Date) => {
        savedToken = token;
        savedExpiresAt = expiresAt;
      }),
    } as unknown as IAuthUserRepository;

    const mockEmailService = {
      sendEmail: vi.fn(async () => undefined),
    };

    const useCase = new ForgotPassword(mockUsers, mockEmailService);
    const result = await useCase.execute({ email: baseUser.email });

    expect(result.success).toBe(true);
    expect(mockUsers.setPasswordResetToken).toHaveBeenCalledWith(
      baseUser.id,
      expect.any(String),
      expect.any(Date),
    );
    expect(savedToken).toHaveLength(64); // 32 bytes hex
    expect(savedExpiresAt!.getTime()).toBeGreaterThan(Date.now());
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
  });
});

describe('ResetPassword UseCase', () => {
  it('rejects invalid or expired token with ValidationError', async () => {
    const mockUsers = {
      findByPasswordResetToken: vi.fn(async () => null),
    } as unknown as IAuthUserRepository;

    const mockHasher = {
      verify: vi.fn(async () => false),
      hash: vi.fn(async (p: string) => `hash_${p}`),
    } as unknown as IPasswordHasher;

    const useCase = new ResetPassword(mockUsers, mockHasher);

    await expect(
      useCase.execute({ token: 'invalid-token', newPassword: 'ValidPassword123!' }),
    ).rejects.toThrow(ValidationError);
  });

  it('enforces password complexity policy (minimum 10 characters)', async () => {
    const mockUsers = {
      findByPasswordResetToken: vi.fn(async () => baseUser),
    } as unknown as IAuthUserRepository;

    const mockHasher = {
      verify: vi.fn(async () => false),
      hash: vi.fn(async (p: string) => `hash_${p}`),
    } as unknown as IPasswordHasher;

    const useCase = new ResetPassword(mockUsers, mockHasher);

    await expect(
      useCase.execute({ token: 'valid-test-token-12345', newPassword: 'Short1!' }),
    ).rejects.toThrow(ValidationError);
  });

  it('blocks reuse of recent passwords from password history', async () => {
    const mockUsers = {
      findByPasswordResetToken: vi.fn(async () => baseUser),
    } as unknown as IAuthUserRepository;

    const mockHasher = {
      verify: vi.fn(async (_pw: string, hash: string) => hash === '$2a$12$oldHash1'),
      hash: vi.fn(async (p: string) => `hash_${p}`),
    } as unknown as IPasswordHasher;

    const useCase = new ResetPassword(mockUsers, mockHasher);

    await expect(
      useCase.execute({ token: 'valid-test-token-12345', newPassword: 'OldPassword123!' }),
    ).rejects.toThrow(/recent passwords/);
  });

  it('successfully resets password, updates history, and revokes sessions', async () => {
    let updatedHistory: string[] = [];
    let updatedHash = '';

    const mockUsers = {
      findByPasswordResetToken: vi.fn(async () => baseUser),
      resetPassword: vi.fn(async (_id: string, hash: string, history: string[]) => {
        updatedHash = hash;
        updatedHistory = history;
      }),
    } as unknown as IAuthUserRepository;

    const mockHasher = {
      verify: vi.fn(async () => false),
      hash: vi.fn(async (p: string) => `new_hash_${p}`),
    } as unknown as IPasswordHasher;

    const mockSessions = {
      revokeAllForUser: vi.fn(async () => undefined),
    } as unknown as IRefreshTokenRepository;

    const useCase = new ResetPassword(mockUsers, mockHasher, mockSessions);
    const result = await useCase.execute({
      token: 'valid-test-token-12345',
      newPassword: 'BrandNewSecurePassword123!',
    });

    expect(result.success).toBe(true);
    expect(mockUsers.resetPassword).toHaveBeenCalledWith(
      baseUser.id,
      'new_hash_BrandNewSecurePassword123!',
      expect.any(Array),
    );
    expect(updatedHash).toBe('new_hash_BrandNewSecurePassword123!');
    expect(updatedHistory[0]).toBe(baseUser.passwordHash); // Previous password rotated into history
    expect(mockSessions.revokeAllForUser).toHaveBeenCalledWith(baseUser.id);
  });
});
