// LoginUser — docs/12_testing_strategy.md §3's `auth` row scenarios.
import { describe, expect, it, vi } from 'vitest';
import { LoginUser } from '../../../src/modules/auth/application/login-user.use-case';
import { UnauthorizedError } from '../../../src/core/exceptions';
import type { AuthUser } from '../../../src/modules/auth/domain/auth-user';
import type {
  IAuthUserRepository,
  IPasswordHasher,
} from '../../../src/modules/auth/application/ports';

const baseUser: AuthUser = {
  id: 'u1',
  email: 'user@example.com',
  phone: null,
  passwordHash: '$2a$12$hash',
  userType: 'CUSTOMER',
  roleId: 'role-customer',
  status: 'ACTIVE',
  mfaEnabled: false,
  mfaSecret: null,
  failedLoginAttempts: 0,
  lockedUntil: null,
  passwordHistory: [],
};

function build(user: AuthUser | null, passwordMatches = true) {
  const users = {
    findByEmail: vi.fn(async () => user),
    updateLockout: vi.fn(async () => undefined),
    recordSuccessfulLogin: vi.fn(async () => undefined),
  } as unknown as IAuthUserRepository;
  const hasher = { verify: vi.fn(async () => passwordMatches) } as unknown as IPasswordHasher;
  return { useCase: new LoginUser(users, hasher), users };
}

describe('LoginUser', () => {
  it('authenticates a CUSTOMER without an MFA challenge (docs/09 §2.8)', async () => {
    const { useCase } = build(baseUser);
    const outcome = await useCase.execute({ email: baseUser.email, password: 'correct-password' });
    expect(outcome.status).toBe('AUTHENTICATED');
  });

  it('requires MFA ENROLMENT for a STAFF account that has not enrolled', async () => {
    const { useCase } = build({ ...baseUser, userType: 'STAFF', mfaEnabled: false });
    const outcome = await useCase.execute({ email: baseUser.email, password: 'correct-password' });
    expect(outcome.status).toBe('MFA_ENROLMENT_REQUIRED');
  });

  it('requires an MFA CODE for an enrolled ADMIN account', async () => {
    const { useCase } = build({
      ...baseUser,
      userType: 'ADMIN',
      mfaEnabled: true,
      mfaSecret: 'SECRET',
    });
    const outcome = await useCase.execute({ email: baseUser.email, password: 'correct-password' });
    expect(outcome.status).toBe('MFA_REQUIRED');
  });

  it('SECURITY: gives an identical error for unknown account and wrong password (no enumeration)', async () => {
    // docs/09 §10's `auth` row: "Invalid credentials rejected without user-enumeration hint".
    const unknownAccount = build(null);
    const wrongPassword = build(baseUser, false);

    const first = await unknownAccount.useCase
      .execute({ email: 'nobody@example.com', password: 'x' })
      .catch((e: unknown) => e as UnauthorizedError);
    const second = await wrongPassword.useCase
      .execute({ email: baseUser.email, password: 'wrong' })
      .catch((e: unknown) => e as UnauthorizedError);

    expect(first).toBeInstanceOf(UnauthorizedError);
    expect(second).toBeInstanceOf(UnauthorizedError);
    expect(first.message).toBe(second.message);
  });

  it('SECURITY: a locked-out account is indistinguishable from a wrong password', async () => {
    const locked = build({ ...baseUser, lockedUntil: new Date(Date.now() + 60_000) });
    await expect(
      locked.useCase.execute({ email: baseUser.email, password: 'correct-password' }),
    ).rejects.toThrowError('Invalid email or password');
  });

  it('records a failed attempt so lockout can accumulate', async () => {
    const { useCase, users } = build(baseUser, false);
    await useCase.execute({ email: baseUser.email, password: 'wrong' }).catch(() => undefined);
    expect(users.updateLockout).toHaveBeenCalledWith('u1', 1, null);
  });

  it('rejects a SUSPENDED account', async () => {
    const { useCase } = build({ ...baseUser, status: 'SUSPENDED' });
    await expect(
      useCase.execute({ email: baseUser.email, password: 'correct-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
