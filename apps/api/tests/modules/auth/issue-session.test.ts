import { describe, expect, it, vi } from 'vitest';
import {
  IssueSession,
  MAX_CONCURRENT_SESSIONS,
} from '../../../src/modules/auth/application/issue-session.use-case';
import { UnauthorizedError } from '../../../src/core/exceptions';
import type {
  IAuthUserRepository,
  IPermissionResolver,
  IRefreshTokenRepository,
  ITokenService,
} from '../../../src/modules/auth/application/ports';
import type { AuthUser } from '../../../src/modules/auth/domain/auth-user';

const baseUser: AuthUser = {
  id: 'u1',
  email: 'admin@example.com',
  phone: null,
  passwordHash: '$2a$12$hash',
  userType: 'SUPER_ADMIN',
  roleId: 'role-superadmin',
  status: 'ACTIVE',
  mfaEnabled: true,
  mfaSecret: 'SECRET',
  failedLoginAttempts: 0,
  lockedUntil: null,
  passwordHistory: [],
};

const mockDeviceInfo = { userAgent: 'test-agent', ip: '127.0.0.1' };
const mockExpiresAt = new Date(Date.now() + 86400000);

function build(user: AuthUser | null, activeSessions = 0) {
  const users = {
    findById: vi.fn(async () => user),
    recordSuccessfulLogin: vi.fn(async () => undefined),
  } as unknown as IAuthUserRepository;

  const refreshTokens = {
    countActiveForUser: vi.fn(async () => activeSessions),
    revokeOldestForUser: vi.fn(async () => undefined),
    store: vi.fn(async () => undefined),
  } as unknown as IRefreshTokenRepository;

  const tokens = {
    issueAccessToken: vi.fn(() => 'access-token'),
    issueRefreshToken: vi.fn(() => ({
      token: 'refresh-token',
      hash: 'refresh-hash',
      expiresAt: mockExpiresAt,
    })),
  } as unknown as ITokenService;

  const permissions = {
    resolvePermissionKeys: vi.fn(async () => ['users.write', 'admin.read']),
  } as unknown as IPermissionResolver;

  return {
    useCase: new IssueSession(users, refreshTokens, tokens, permissions),
    users,
    refreshTokens,
    tokens,
    permissions,
  };
}

describe('IssueSession', () => {
  it('issues session tokens and records login for a valid user', async () => {
    const { useCase, users, refreshTokens, tokens, permissions } = build(baseUser);

    const result = await useCase.execute({
      userId: 'u1',
      roleName: 'SUPER_ADMIN',
      deviceInfo: mockDeviceInfo,
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.refreshTokenExpiresAt).toEqual(mockExpiresAt);

    expect(permissions.resolvePermissionKeys).toHaveBeenCalledWith('role-superadmin');
    expect(tokens.issueAccessToken).toHaveBeenCalledWith({
      sub: 'u1',
      userType: 'SUPER_ADMIN',
      roleId: 'role-superadmin',
      permissions: ['users.write', 'admin.read'],
    });
    expect(refreshTokens.store).toHaveBeenCalledWith({
      userId: 'u1',
      tokenHash: 'refresh-hash',
      expiresAt: mockExpiresAt,
      deviceInfo: mockDeviceInfo,
    });
    expect(users.recordSuccessfulLogin).toHaveBeenCalledWith('u1');
  });

  it('revokes the oldest session if MAX_CONCURRENT_SESSIONS is reached for capped roles (SUPER_ADMIN)', async () => {
    const { useCase, refreshTokens } = build(baseUser, MAX_CONCURRENT_SESSIONS);

    await useCase.execute({
      userId: 'u1',
      roleName: 'SUPER_ADMIN', // capped role
      deviceInfo: mockDeviceInfo,
    });

    expect(refreshTokens.countActiveForUser).toHaveBeenCalledWith('u1');
    expect(refreshTokens.revokeOldestForUser).toHaveBeenCalledWith('u1');
  });

  it('does NOT enforce concurrent session caps for non-capped roles (CUSTOMER)', async () => {
    const { useCase, refreshTokens } = build(
      { ...baseUser, userType: 'CUSTOMER' },
      MAX_CONCURRENT_SESSIONS,
    );

    await useCase.execute({
      userId: 'u1',
      roleName: 'CUSTOMER', // uncapped role
      deviceInfo: mockDeviceInfo,
    });

    expect(refreshTokens.countActiveForUser).not.toHaveBeenCalled();
    expect(refreshTokens.revokeOldestForUser).not.toHaveBeenCalled();
  });

  it('rejects if the user is not found', async () => {
    const { useCase } = build(null);
    await expect(
      useCase.execute({
        userId: 'u1',
        roleName: 'CUSTOMER',
        deviceInfo: mockDeviceInfo,
      }),
    ).rejects.toThrowError(UnauthorizedError);
  });
});
