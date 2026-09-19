import { describe, expect, it, vi } from 'vitest';
import { AuthenticateWithGoogle } from '../../../src/modules/auth/application/social-auth.use-cases';
import type { AuthUser } from '../../../src/modules/auth/domain/auth-user';
import type {
  IAuthUserRepository,
  IGoogleAuthService,
} from '../../../src/modules/auth/application/ports';

const existingUser: AuthUser = {
  id: 'u-google-1',
  email: 'tester@example.com',
  phone: null,
  passwordHash: null,
  userType: 'CUSTOMER',
  roleId: 'role-customer',
  status: 'ACTIVE',
  mfaEnabled: false,
  mfaSecret: null,
  failedLoginAttempts: 0,
  lockedUntil: null,
  passwordHistory: [],
};

function buildContext(user: AuthUser | null = null) {
  const users: Partial<IAuthUserRepository> = {
    findByEmail: vi.fn(async () => user),
    create: vi.fn(async (input) => ({
      id: 'new-user-id',
      email: input.email,
      phone: input.phone,
      passwordHash: input.passwordHash,
      userType: input.userType,
      roleId: input.roleId,
      status: input.status,
      mfaEnabled: false,
      mfaSecret: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordHistory: [],
    })),
    recordSuccessfulLogin: vi.fn(async () => undefined),
  };

  const googleAuth: IGoogleAuthService = {
    verifyIdToken: vi.fn(async (_idToken: string) => ({
      email: 'tester@example.com',
      sub: 'google-sub-123',
      name: 'Google Tester',
    })),
    verifyAccessToken: vi.fn(async (_accessToken: string) => ({
      email: 'tester@example.com',
      sub: 'google-sub-123',
      name: 'Google Tester',
    })),
  };

  const resolveCustomerRoleId = vi.fn(async () => 'role-customer');

  const useCase = new AuthenticateWithGoogle(
    users as IAuthUserRepository,
    googleAuth,
    resolveCustomerRoleId,
  );

  return { useCase, users, googleAuth, resolveCustomerRoleId };
}

describe('AuthenticateWithGoogle Use Case', () => {
  it('authenticates an existing customer via idToken', async () => {
    const { useCase, users, googleAuth } = buildContext(existingUser);

    const outcome = await useCase.execute({ idToken: 'valid-id-token' });

    expect(outcome.status).toBe('AUTHENTICATED');
    expect(outcome.userId).toBe('u-google-1');
    expect(googleAuth.verifyIdToken).toHaveBeenCalledWith('valid-id-token');
    expect(users.recordSuccessfulLogin).toHaveBeenCalledWith('u-google-1');
  });

  it('authenticates an existing customer via accessToken', async () => {
    const { useCase, users, googleAuth } = buildContext(existingUser);

    const outcome = await useCase.execute({ accessToken: 'valid-access-token' });

    expect(outcome.status).toBe('AUTHENTICATED');
    expect(outcome.userId).toBe('u-google-1');
    expect(googleAuth.verifyAccessToken).toHaveBeenCalledWith('valid-access-token');
    expect(users.recordSuccessfulLogin).toHaveBeenCalledWith('u-google-1');
  });

  it('auto-registers a new customer when user does not exist yet', async () => {
    const { useCase, users, resolveCustomerRoleId } = buildContext(null);

    const outcome = await useCase.execute({ idToken: 'new-user-token' });

    expect(outcome.status).toBe('AUTHENTICATED');
    expect(outcome.userId).toBe('new-user-id');
    expect(resolveCustomerRoleId).toHaveBeenCalled();
    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'tester@example.com',
        userType: 'CUSTOMER',
        authProviders: ['GOOGLE'],
      }),
    );
  });
});
