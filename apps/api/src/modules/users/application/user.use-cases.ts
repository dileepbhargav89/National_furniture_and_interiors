// users module use cases — docs/08_api_architecture.md §8's `users` row.
import { ConflictError, NotFoundError, ValidationError } from '../../../core/exceptions';
import { exceedsAddressBound } from '../domain/address';
import type {
  AdminCreateUserInput,
  IUserProfileRepository,
  UpdateOwnProfileInput,
  UserProfile,
} from './ports';

export class GetOwnProfile {
  constructor(private readonly users: IUserProfileRepository) {}

  /**
   * Ownership check — docs/08 §4.3 step 3: "inside the Application-layer use case, not general
   * middleware, because 'is this the caller's own resource' is module-specific business logic".
   * Here the scoping is structural: the id comes from the verified token's `sub`, never from a
   * client-supplied parameter, so cross-account access has no expressible request shape.
   */
  async execute(authenticatedUserId: string): Promise<UserProfile> {
    const profile = await this.users.findById(authenticatedUserId);
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }
    return profile;
  }
}

export class UpdateOwnProfile {
  constructor(private readonly users: IUserProfileRepository) {}

  async execute(authenticatedUserId: string, input: UpdateOwnProfileInput): Promise<UserProfile> {
    // Domain invariant re-check (docs/02 §16) — the Zod schema also bounds this, deliberately.
    if (input.addresses && exceedsAddressBound(input.addresses)) {
      throw new ValidationError('Too many addresses', [
        { field: 'addresses', issue: 'a maximum of 10 addresses is allowed' },
      ]);
    }
    const updated = await this.users.updateOwn(authenticatedUserId, input);
    if (!updated) {
      throw new NotFoundError('Profile not found');
    }
    return updated;
  }
}

export class AdminListUsers {
  constructor(private readonly users: IUserProfileRepository) {}

  async execute(limit = 20): Promise<UserProfile[]> {
    // docs/08 §3.4 — default 20, max 100 server-enforced regardless of client request.
    return this.users.list(Math.min(Math.max(limit, 1), 100));
  }
}

/**
 * ============================================================================================
 * AdminCreateUser — the ONLY runtime path that creates a STAFF or ADMIN account.
 *
 * ADR-0002 (APPROVED, Option A): public registration is CUSTOMER-only; privileged accounts are
 * provisioned here, behind Bearer auth + `users.write` + the STAFF/ADMIN userType gate
 * (docs/08 §8). The first SUPER_ADMIN comes from migration 0004, since this path requires a
 * privileged account to already exist.
 *
 * The created account has mfaEnabled=false: docs/09 §2.8 requires the holder to enrol TOTP
 * before privileged access, which the auth module enforces at login.
 * ============================================================================================
 */
export class AdminCreateUser {
  constructor(private readonly users: IUserProfileRepository) {}

  async execute(input: AdminCreateUserInput): Promise<UserProfile> {
    if (await this.users.findByEmail(input.email)) {
      throw new ConflictError('An account with this email already exists');
    }
    return this.users.createPrivileged(input);
  }
}
