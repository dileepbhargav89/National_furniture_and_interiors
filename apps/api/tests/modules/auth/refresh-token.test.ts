// Unit tests for refresh-token rotation and reuse detection — docs/02 §9.1, docs/09 §2.6.
//
// This behaviour is verified end-to-end against the live stack, but only along the happy replay
// path. These tests pin the branches that end-to-end run cannot reach cheaply: a revoked-but-not-
// rotated token, a suspended account, and — most importantly — that reuse revokes the whole family
// AND writes the audit record, in that order. A refactor that dropped either half would still pass
// the integration test, because the caller only ever observes the 401.
import { describe, expect, it, vi } from 'vitest';
import { RefreshTokenUseCase } from '../../../src/modules/auth/application/refresh-token.use-case';
import { UnauthorizedError } from '../../../src/core/exceptions';
import type {
  IAuditLogger,
  IAuthUserRepository,
  IRefreshTokenRepository,
  ITokenService,
} from '../../../src/modules/auth/application/ports';

const DEVICE = { userAgent: 'probe/1.0', ip: '203.0.113.7' };

interface StoredOverrides {
  revokedAt?: Date | null;
  replacedByTokenId?: string | null;
}

function build(
  stored: StoredOverrides | null,
  userStatus: 'ACTIVE' | 'SUSPENDED' | 'BANNED' = 'ACTIVE',
) {
  const refreshTokens = {
    findByHash: vi.fn(async () =>
      stored === null
        ? null
        : {
            id: 'token-1',
            userId: 'user-1',
            revokedAt: stored.revokedAt ?? null,
            replacedByTokenId: stored.replacedByTokenId ?? null,
          },
    ),
    revoke: vi.fn(async () => undefined),
    revokeAllForUser: vi.fn(async () => undefined),
    markRotated: vi.fn(async () => undefined),
    countActiveForUser: vi.fn(async () => 0),
    revokeOldestForUser: vi.fn(async () => undefined),
    create: vi.fn(async () => 'token-2'),
  } as unknown as IRefreshTokenRepository & Record<string, ReturnType<typeof vi.fn>>;

  const users = {
    findById: vi.fn(async () => ({ id: 'user-1', roleId: 'role-1', status: userStatus })),
  } as unknown as IAuthUserRepository & Record<string, ReturnType<typeof vi.fn>>;

  const tokens = {
    hashRefreshToken: vi.fn((t: string) => `hash(${t})`),
  } as unknown as ITokenService & Record<string, ReturnType<typeof vi.fn>>;

  const audit = { record: vi.fn(async () => undefined) } as unknown as IAuditLogger &
    Record<string, ReturnType<typeof vi.fn>>;

  const useCase = new RefreshTokenUseCase(
    refreshTokens,
    users,
    tokens,
    audit,
    async () => 'CUSTOMER',
  );
  return { useCase, refreshTokens, users, tokens, audit };
}

describe('RefreshTokenUseCase', () => {
  it('rotates a valid token and revokes the presented one', async () => {
    const { useCase, refreshTokens } = build({});
    await expect(useCase.execute({ presentedToken: 'good', deviceInfo: DEVICE })).resolves.toEqual({
      userId: 'user-1',
      roleName: 'CUSTOMER',
    });
    expect(refreshTokens.revoke).toHaveBeenCalledWith('token-1');
    expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('hashes the presented token — never queries by the raw value', async () => {
    const { useCase, refreshTokens, tokens } = build({});
    await useCase.execute({ presentedToken: 'raw-secret', deviceInfo: DEVICE });
    expect(tokens.hashRefreshToken).toHaveBeenCalledWith('raw-secret');
    expect(refreshTokens.findByHash).toHaveBeenCalledWith('hash(raw-secret)');
    expect(refreshTokens.findByHash).not.toHaveBeenCalledWith('raw-secret');
  });

  it('rejects an unknown token without revoking anything', async () => {
    const { useCase, refreshTokens, audit } = build(null);
    await expect(useCase.execute({ presentedToken: 'nope', deviceInfo: DEVICE })).rejects.toThrow(
      UnauthorizedError,
    );
    expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  describe('reuse detection (docs/09 §2.6)', () => {
    it('revokes the ENTIRE family when an already-rotated token is replayed', async () => {
      const { useCase, refreshTokens } = build({ replacedByTokenId: 'token-2' });
      await expect(useCase.execute({ presentedToken: 'old', deviceInfo: DEVICE })).rejects.toThrow(
        UnauthorizedError,
      );
      expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('user-1');
    });

    it('also treats an explicitly revoked token as reuse', async () => {
      const { useCase, refreshTokens } = build({ revokedAt: new Date('2026-08-11T00:00:00Z') });
      await expect(useCase.execute({ presentedToken: 'old', deviceInfo: DEVICE })).rejects.toThrow(
        UnauthorizedError,
      );
      expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('user-1');
    });

    it('writes a TOKEN_REUSE_DETECTED audit record with the device context', async () => {
      const { useCase, audit } = build({ replacedByTokenId: 'token-2' });
      await expect(useCase.execute({ presentedToken: 'old', deviceInfo: DEVICE })).rejects.toThrow(
        UnauthorizedError,
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TOKEN_REUSE_DETECTED',
          entityType: 'refresh_tokens',
          actorId: 'user-1',
          ipAddress: DEVICE.ip,
          userAgent: DEVICE.userAgent,
        }) as Record<string, unknown>,
      );
    });

    it('never puts the raw token or its hash into the audit record', async () => {
      const { useCase, audit } = build({ replacedByTokenId: 'token-2' });
      await expect(
        useCase.execute({ presentedToken: 'super-secret-value', deviceInfo: DEVICE }),
      ).rejects.toThrow(UnauthorizedError);
      const blob = JSON.stringify(audit.record.mock.calls[0]?.[0] ?? {});
      expect(blob).not.toContain('super-secret-value');
      expect(blob).not.toContain('hash(super-secret-value)');
    });

    it('surfaces the same generic message as an unknown token (no oracle)', async () => {
      const reuse = build({ replacedByTokenId: 'token-2' });
      const unknown = build(null);
      const a = await reuse.useCase
        .execute({ presentedToken: 'x', deviceInfo: DEVICE })
        .catch((e: Error) => e.message);
      const b = await unknown.useCase
        .execute({ presentedToken: 'y', deviceInfo: DEVICE })
        .catch((e: Error) => e.message);
      expect(a).toBe(b);
    });
  });

  it('refuses to refresh a SUSPENDED account', async () => {
    const { useCase } = build({}, 'SUSPENDED');
    await expect(useCase.execute({ presentedToken: 'good', deviceInfo: DEVICE })).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('refuses to refresh a BANNED account', async () => {
    const { useCase } = build({}, 'BANNED');
    await expect(useCase.execute({ presentedToken: 'good', deviceInfo: DEVICE })).rejects.toThrow(
      UnauthorizedError,
    );
  });
});
