// rbacMiddleware + audit redaction — docs/08 §4.3, docs/09 §11 rule 11, docs/03 §9.8.2.
import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it } from 'vitest';
import { requirePermissions, requireStaffOrAdmin } from '../../../src/core/security';
import { redactSnapshot, REDACTED } from '../../../src/modules/admin/domain/audit-redaction';
import { ForbiddenError, UnauthorizedError } from '../../../src/core/exceptions';

function runMiddleware(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  claims: Request['auth'],
): unknown {
  const req = { auth: claims } as Request;
  let captured: unknown = 'NOT_CALLED';
  middleware(
    req,
    {} as Response,
    ((error?: unknown) => {
      captured = error ?? null;
    }) as NextFunction,
  );
  return captured;
}

const claims = (permissions: string[], userType: 'CUSTOMER' | 'STAFF' | 'ADMIN' = 'STAFF') => ({
  sub: 'u1',
  userType,
  roleId: 'r1',
  permissions,
});

describe('requirePermissions', () => {
  it('allows a caller holding the required key', () => {
    const result = runMiddleware(requirePermissions('users.read'), claims(['users.read']));
    expect(result).toBeNull();
  });

  it('denies with 403 FORBIDDEN when the key is missing', () => {
    const result = runMiddleware(requirePermissions('users.read'), claims(['users.read_self']));
    expect(result).toBeInstanceOf(ForbiddenError);
    expect((result as ForbiddenError).statusCode).toBe(403);
    expect((result as ForbiddenError).code).toBe('FORBIDDEN');
  });

  it('SECURITY: the 403 message never names the missing permission (docs/09 §11 rule 11)', () => {
    const result = runMiddleware(requirePermissions('admin.manage_roles'), claims([]));
    expect((result as ForbiddenError).message).not.toContain('admin.manage_roles');
  });

  it('SECURITY: fails closed when claims are absent rather than allowing through', () => {
    const result = runMiddleware(requirePermissions('users.read'), undefined);
    expect(result).toBeInstanceOf(UnauthorizedError);
  });

  it('requires ALL keys when several are demanded', () => {
    const result = runMiddleware(
      requirePermissions('users.read', 'users.write'),
      claims(['users.read']),
    );
    expect(result).toBeInstanceOf(ForbiddenError);
  });
});

describe('requireStaffOrAdmin — docs/08 §8 admin row userType gate', () => {
  it('allows STAFF and ADMIN', () => {
    expect(runMiddleware(requireStaffOrAdmin(), claims([], 'STAFF'))).toBeNull();
    expect(runMiddleware(requireStaffOrAdmin(), claims([], 'ADMIN'))).toBeNull();
  });

  it('SECURITY: denies CUSTOMER even when permission keys are present', () => {
    const result = runMiddleware(requireStaffOrAdmin(), claims(['admin.manage_roles'], 'CUSTOMER'));
    expect(result).toBeInstanceOf(ForbiddenError);
  });
});

describe('audit redaction — docs/03 §9.8.2', () => {
  it('SECURITY: replaces secret-equivalent fields with [REDACTED], never omits them', () => {
    const snapshot = redactSnapshot({
      email: 'user@example.com',
      passwordHash: '$2a$12$realhash',
      mfaSecret: 'JBSWY3DPEHPK3PXP',
      userType: 'ADMIN',
    });

    expect(snapshot?.passwordHash).toBe(REDACTED);
    expect(snapshot?.mfaSecret).toBe(REDACTED);
    // Replacement, not omission — the record must still show THAT the field was present.
    expect(Object.keys(snapshot ?? {})).toContain('passwordHash');
    // Non-secret fields survive intact.
    expect(snapshot?.email).toBe('user@example.com');
  });

  it('redacts nested secret-equivalent fields', () => {
    const snapshot = redactSnapshot({ credentials: { passwordHash: 'x', tokenHash: 'y' } });
    const nested = snapshot?.credentials as Record<string, unknown>;
    expect(nested.passwordHash).toBe(REDACTED);
    expect(nested.tokenHash).toBe(REDACTED);
  });

  it('returns null for a null snapshot', () => {
    expect(redactSnapshot(null)).toBeNull();
  });
});
