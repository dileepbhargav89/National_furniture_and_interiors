// ============================================================================================
// ADR-0002 REGRESSION GUARD
//
// These tests are the executable defence for the security decision approved on 2026-08-11:
// public registration creates CUSTOMER accounts ONLY. If someone later adds `userType` to
// RegisterUserInput or the Zod schema, these tests fail.
//
// Do not weaken or delete them without a new approved ADR.
// ============================================================================================
import { describe, expect, it, vi } from 'vitest';
import { RegisterUser } from '../../../src/modules/auth/application/register-user.use-case';
import { registerSchema } from '../../../src/modules/auth/presentation/validators';
import { ConflictError, ValidationError } from '../../../src/core/exceptions';
import type {
  IAuthUserRepository,
  IPasswordHasher,
  IPermissionResolver,
} from '../../../src/modules/auth/application/ports';

function buildDeps(overrides: { exists?: boolean } = {}) {
  const created = vi.fn(async (input: { email: string }) => ({
    id: 'user-1',
    email: input.email,
    phone: null,
    passwordHash: 'hashed',
    userType: 'CUSTOMER' as const,
    roleId: 'role-customer',
    status: 'ACTIVE' as const,
    mfaEnabled: false,
    mfaSecret: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    passwordHistory: [],
  }));

  const users = {
    existsByEmail: vi.fn(async () => overrides.exists ?? false),
    create: created,
  } as unknown as IAuthUserRepository;

  const hasher = {
    hash: vi.fn(async () => 'hashed'),
    verify: vi.fn(async () => true),
  } as unknown as IPasswordHasher;

  const permissions = {
    resolvePermissionKeys: vi.fn(async () => ['users.read_self']),
  } as unknown as IPermissionResolver;

  return { users, hasher, permissions, created };
}

describe('RegisterUser — ADR-0002 Option A', () => {
  it('creates a CUSTOMER account', async () => {
    const { users, hasher, permissions, created } = buildDeps();
    const useCase = new RegisterUser(users, hasher, permissions, async () => 'role-customer');

    const result = await useCase.execute({
      email: 'customer@example.com',
      password: 'a-long-enough-password',
      fullName: 'Test Customer',
    });

    expect(result.userType).toBe('CUSTOMER');
    expect(created).toHaveBeenCalledOnce();
  });

  it('SECURITY: always hard-assigns userType CUSTOMER, never derives it from input', async () => {
    const { users, hasher, permissions, created } = buildDeps();
    const useCase = new RegisterUser(users, hasher, permissions, async () => 'role-customer');

    // Even if a caller somehow bypassed the Zod layer and smuggled a privileged userType through,
    // the use case must ignore it. This asserts defence in depth, not just schema filtering.
    await useCase.execute({
      email: 'attacker@example.com',
      password: 'a-long-enough-password',
      fullName: 'Attacker',
      ...({ userType: 'ADMIN', roleId: 'role-super-admin' } as object),
    });

    const passedToRepository = created.mock.calls[0]?.[0] as unknown as {
      userType: string;
      roleId: string;
    };
    expect(passedToRepository.userType).toBe('CUSTOMER');
    expect(passedToRepository.roleId).toBe('role-customer');
  });

  it('enforces the password policy floor independently of the API layer', async () => {
    const { users, hasher, permissions } = buildDeps();
    const useCase = new RegisterUser(users, hasher, permissions, async () => 'role-customer');

    await expect(
      useCase.execute({ email: 'x@example.com', password: 'short', fullName: 'X' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a duplicate email with 409 CONFLICT', async () => {
    const { users, hasher, permissions } = buildDeps({ exists: true });
    const useCase = new RegisterUser(users, hasher, permissions, async () => 'role-customer');

    await expect(
      useCase.execute({
        email: 'taken@example.com',
        password: 'a-long-enough-password',
        fullName: 'X',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('registerSchema — ADR-0002 privilege-escalation guard', () => {
  it('SECURITY: REJECTS a request carrying userType (does not silently strip it)', () => {
    const result = registerSchema.safeParse({
      email: 'attacker@example.com',
      password: 'a-long-enough-password',
      fullName: 'Attacker',
      userType: 'STAFF',
    });

    // docs/08 §3.12 — strict mode rejects unknown fields rather than stripping them, so an
    // escalation attempt fails loudly (400) instead of silently succeeding as a CUSTOMER.
    expect(result.success).toBe(false);
  });

  it('SECURITY: REJECTS a request carrying roleId', () => {
    const result = registerSchema.safeParse({
      email: 'attacker@example.com',
      password: 'a-long-enough-password',
      fullName: 'Attacker',
      roleId: 'role-super-admin',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a well-formed customer registration', () => {
    const result = registerSchema.safeParse({
      email: 'customer@example.com',
      password: 'a-long-enough-password',
      fullName: 'Real Customer',
    });
    expect(result.success).toBe(true);
  });

  it('enforces the 10-character password floor from docs/09 §2.7', () => {
    expect(
      registerSchema.safeParse({ email: 'a@b.com', password: 'short', fullName: 'X' }).success,
    ).toBe(false);
  });
});
