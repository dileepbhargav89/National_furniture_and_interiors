import { describe, expect, it, vi } from 'vitest';
import { SetupMfa, VerifyMfa } from '../../../src/modules/auth/application/mfa.use-cases';
import { ConflictError, UnauthorizedError } from '../../../src/core/exceptions';
import type {
  IAuthUserRepository,
  ITotpService,
} from '../../../src/modules/auth/application/ports';
import type { AuthUser } from '../../../src/modules/auth/domain/auth-user';

const baseUser: AuthUser = {
  id: 'u1',
  email: 'user@example.com',
  phone: null,
  passwordHash: '$2a$12$hash',
  userType: 'STAFF',
  roleId: 'role-staff',
  status: 'ACTIVE',
  mfaEnabled: false,
  mfaSecret: null,
  failedLoginAttempts: 0,
  lockedUntil: null,
  passwordHistory: [],
};

function buildSetup(user: AuthUser | null) {
  const users = {
    findById: vi.fn(async () => user),
    setMfaSecret: vi.fn(async () => undefined),
  } as unknown as IAuthUserRepository;

  const totp = {
    generateSecret: vi.fn(() => 'NEW_SECRET'),
    buildOtpAuthUrl: vi.fn((secret, email) => `otpauth://totp/Test:${email}?secret=${secret}`),
  } as unknown as ITotpService;

  return { useCase: new SetupMfa(users, totp), users, totp };
}

function buildVerify(user: AuthUser | null, totpValid = true) {
  const users = {
    findById: vi.fn(async () => user),
    enableMfa: vi.fn(async () => undefined),
  } as unknown as IAuthUserRepository;

  const totp = {
    verify: vi.fn(() => totpValid),
  } as unknown as ITotpService;

  return { useCase: new VerifyMfa(users, totp), users, totp };
}

describe('MFA Use Cases', () => {
  describe('SetupMfa', () => {
    it('generates a secret and returns an auth URL for a STAFF user', async () => {
      const { useCase, users } = buildSetup(baseUser);
      const result = await useCase.execute('u1');

      expect(users.setMfaSecret).toHaveBeenCalledWith('u1', 'NEW_SECRET');
      expect(result.otpAuthUrl).toContain('NEW_SECRET');
      expect(result.otpAuthUrl).toContain('user@example.com');
    });

    it('rejects CUSTOMER accounts because MFA is privileged-only', async () => {
      const { useCase } = buildSetup({ ...baseUser, userType: 'CUSTOMER' });
      await expect(useCase.execute('u1')).rejects.toThrowError(ConflictError);
    });

    it('rejects if MFA is already enrolled', async () => {
      const { useCase } = buildSetup({ ...baseUser, mfaEnabled: true });
      await expect(useCase.execute('u1')).rejects.toThrowError(ConflictError);
    });

    it('rejects unknown users with UnauthorizedError', async () => {
      const { useCase } = buildSetup(null);
      await expect(useCase.execute('u1')).rejects.toThrowError(UnauthorizedError);
    });
  });

  describe('VerifyMfa', () => {
    it('verifies code and enables MFA if not yet enabled (completes enrolment)', async () => {
      const user = { ...baseUser, mfaSecret: 'SECRET', mfaEnabled: false };
      const { useCase, users } = buildVerify(user, true);

      const result = await useCase.execute({ userId: 'u1', code: '123456' });

      expect(users.enableMfa).toHaveBeenCalledWith('u1');
      expect(result).toEqual({ userId: 'u1', roleId: 'role-staff' });
    });

    it('verifies code but does not call enableMfa if already enabled', async () => {
      const user = { ...baseUser, mfaSecret: 'SECRET', mfaEnabled: true };
      const { useCase, users } = buildVerify(user, true);

      await useCase.execute({ userId: 'u1', code: '123456' });
      expect(users.enableMfa).not.toHaveBeenCalled();
    });

    it('rejects if TOTP verification fails', async () => {
      const user = { ...baseUser, mfaSecret: 'SECRET', mfaEnabled: true };
      const { useCase } = buildVerify(user, false); // invalid code

      await expect(useCase.execute({ userId: 'u1', code: '000000' })).rejects.toThrowError(
        UnauthorizedError,
      );
    });

    it('rejects if user has no MFA secret', async () => {
      const user = { ...baseUser, mfaSecret: null };
      const { useCase } = buildVerify(user, true);

      await expect(useCase.execute({ userId: 'u1', code: '123456' })).rejects.toThrowError(
        UnauthorizedError,
      );
    });

    it('rejects unknown users', async () => {
      const { useCase } = buildVerify(null, true);
      await expect(useCase.execute({ userId: 'u1', code: '123456' })).rejects.toThrowError(
        UnauthorizedError,
      );
    });
  });
});
