// RegisterUser — public, unauthenticated account creation.
//
// ============================================================================================
// ADR-0002 (APPROVED 2026-08-11, Option A) — THE SECURITY-CRITICAL RULE OF THIS FILE
//
// This use case creates CUSTOMER accounts ONLY. It does not accept `userType` or `roleId` as
// input — those fields are absent from RegisterUserInput by design, so there is no code path by
// which a caller can influence them. STAFF/ADMIN accounts are provisioned exclusively through the
// authenticated `users` module admin surface (POST /admin/users), and the first SUPER_ADMIN via
// migration 0004.
//
// Rationale (docs/09 §2.2 fail-closed, §1.12 admin = highest-value target, §2.8's
// "not a self-service reset… well-known bypass vector" precedent, docs/02 §14, docs/18 §8):
// permitting an anonymous caller to self-assign STAFF would let an attacker enrol THEIR OWN MFA
// on a privileged account, nullifying MFA, permission-key RBAC, and admin network hardening at
// once.
//
// DO NOT add userType/roleId to this input type without a new approved ADR.
// The regression guard is tests/modules/auth/register-user.test.ts.
// ============================================================================================
import { ConflictError, ValidationError } from '../../../core/exceptions';
import { checkPasswordPolicy } from '../domain/password-policy';
import type { IAuthUserRepository, IPasswordHasher, IPermissionResolver } from './ports';

export interface RegisterUserInput {
  readonly email: string;
  readonly password: string;
  readonly fullName: string;
  // `| undefined` is explicit because tsconfig.base.json enables exactOptionalPropertyTypes:
  // an absent key and an explicit `phone: undefined` are distinct types under that flag.
  readonly phone?: string | null | undefined;
}

export interface RegisterUserResult {
  readonly userId: string;
  readonly email: string;
  readonly userType: 'CUSTOMER';
}

export class RegisterUser {
  constructor(
    private readonly users: IAuthUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly permissions: IPermissionResolver,
    /** Resolves the CUSTOMER role's id — seeded by migration 0002. */
    private readonly resolveCustomerRoleId: () => Promise<string>,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
    // Domain invariant re-checked independently of the Presentation-layer Zod schema —
    // docs/02 §16 / docs/08 §3.12's defense-in-depth rule.
    const violation = checkPasswordPolicy(input.password);
    if (violation) {
      throw new ValidationError('Password does not meet policy', [
        { field: 'password', issue: violation.message },
      ]);
    }

    if (await this.users.existsByEmail(input.email)) {
      // Note: this is a deliberate, accepted disclosure on the REGISTRATION path only — a user
      // must be told their email is already taken. docs/09 §10's `auth` row scopes the
      // no-enumeration requirement to LOGIN ("Invalid credentials rejected without
      // user-enumeration hint"), which LoginUser honours.
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await this.hasher.hash(input.password);
    const roleId = await this.resolveCustomerRoleId();

    const created = await this.users.create({
      email: input.email,
      phone: input.phone ?? null,
      passwordHash,
      fullName: input.fullName,
      // Hard-assigned. Never derived from input. See the ADR-0002 banner above.
      userType: 'CUSTOMER',
      roleId,
      status: 'ACTIVE',
    });

    // Touch the resolver so a misconfigured CUSTOMER role surfaces at registration rather than
    // at first login (fail fast, not fail late).
    await this.permissions.resolvePermissionKeys(roleId);

    return { userId: created.id, email: created.email, userType: 'CUSTOMER' };
  }
}
