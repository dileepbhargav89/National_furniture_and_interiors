// users module use cases — docs/08_api_architecture.md §8's `users` row.
import crypto from 'node:crypto';
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

export class AdminListUsersWithFilters {
  constructor(private readonly users: IUserProfileRepository) {}

  async execute(
    filter: import('./ports').UserListFilter,
  ): Promise<{ items: UserProfile[]; total: number }> {
    const page = Math.max(filter.page ?? 1, 1);
    const limit = Math.min(Math.max(filter.limit ?? 20, 1), 100);
    return this.users.listWithFilters({ ...filter, page, limit });
  }
}

export class AdminGetUserDetail {
  constructor(private readonly users: IUserProfileRepository) {}

  async execute(id: string): Promise<import('./ports').UserDetailDossier> {
    const dossier = await this.users.findByIdDetailed(id);
    if (!dossier) {
      throw new NotFoundError('User not found');
    }
    return dossier;
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

export class AdminOnboardUser {
  constructor(
    private readonly users: IUserProfileRepository,
    private readonly hashPassword?: (plaintext: string) => Promise<string>,
    private readonly generatePassword?: () => string,
  ) {}

  async execute(input: import('./ports').AdminOnboardUserInput): Promise<UserProfile> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    let passwordHash: string | null = null;
    if (input.temporaryPassword && this.hashPassword) {
      passwordHash = await this.hashPassword(input.temporaryPassword);
    }

    const onboardingToken = crypto.randomBytes(32).toString('hex');
    const onboardingTokenExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    return this.users.onboardUser(input, passwordHash, onboardingToken, onboardingTokenExpiresAt);
  }
}

export class AdminResendOnboarding {
  constructor(private readonly users: IUserProfileRepository) {}

  async execute(id: string): Promise<{
    success: boolean;
    message: string;
    onboardingToken: string;
    onboardingUrl: string;
  }> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const onboardingToken = crypto.randomBytes(32).toString('hex');
    const onboardingTokenExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    await this.users.refreshOnboardingToken(id, onboardingToken, onboardingTokenExpiresAt);
    return {
      success: true,
      message: `Onboarding invitation re-dispatched to ${user.email}`,
      onboardingToken,
      onboardingUrl: `/onboarding?token=${onboardingToken}`,
    };
  }
}

export interface VerifyOnboardingTokenResult {
  readonly valid: boolean;
  readonly email: string;
  readonly fullName: string;
  readonly phone?: string | null | undefined;
  readonly companyName?: string | null | undefined;
  readonly gstin?: string | null | undefined;
  readonly userType: string;
}

export class VerifyOnboardingToken {
  constructor(private readonly users: IUserProfileRepository) {}

  async execute(token: string): Promise<VerifyOnboardingTokenResult> {
    const user = await this.users.findByOnboardingToken(token);
    if (!user) {
      throw new ValidationError('Invalid invitation token', [
        { field: 'token', issue: 'Invitation token is invalid or does not exist.' },
      ]);
    }

    if (user.onboardingTokenExpiresAt && user.onboardingTokenExpiresAt < new Date()) {
      throw new ValidationError('Expired invitation token', [
        { field: 'token', issue: 'Invitation link has expired. Please request a new invitation.' },
      ]);
    }

    return {
      valid: true,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      companyName: user.companyName,
      gstin: user.gstin,
      userType: user.userType,
    };
  }
}

export interface CompleteOnboardingInput {
  readonly token: string;
  readonly fullName: string;
  readonly phone?: string | null | undefined;
  readonly password: string;
  readonly companyName?: string | null | undefined;
  readonly gstin?: string | null | undefined;
  readonly address?: import('../domain/address').Address | undefined;
  readonly deviceInfo?: { userAgent: string; ip: string } | undefined;
}

export interface CompleteOnboardingResult {
  readonly user: UserProfile;
  readonly session?:
    import('../../auth/application/issue-session.use-case').SessionTokens | undefined;
}

export class CompleteOnboarding {
  constructor(
    private readonly users: IUserProfileRepository,
    private readonly hashPassword: (plaintext: string) => Promise<string>,
    private readonly issueSession?: (
      userId: string,
      roleId: string,
      deviceInfo: { userAgent: string; ip: string },
    ) => Promise<import('../../auth/application/issue-session.use-case').SessionTokens>,
  ) {}

  async execute(input: CompleteOnboardingInput): Promise<CompleteOnboardingResult> {
    const user = await this.users.findByOnboardingToken(input.token);
    if (!user) {
      throw new ValidationError('Invalid invitation token', [
        { field: 'token', issue: 'Invitation token is invalid or has already been used.' },
      ]);
    }

    if (user.onboardingTokenExpiresAt && user.onboardingTokenExpiresAt < new Date()) {
      throw new ValidationError('Expired invitation token', [
        { field: 'token', issue: 'Invitation link has expired. Please request a new invitation.' },
      ]);
    }

    const passwordHash = await this.hashPassword(input.password);

    const updatedUser = await this.users.completeOnboarding(user.id, {
      fullName: input.fullName.trim(),
      phone: input.phone ?? null,
      passwordHash,
      companyName: input.companyName ?? null,
      gstin: input.gstin ?? null,
      ...(input.address ? { address: input.address } : {}),
    });

    if (!updatedUser) {
      throw new NotFoundError('Failed to activate user account');
    }

    let session: import('../../auth/application/issue-session.use-case').SessionTokens | undefined =
      undefined;
    if (this.issueSession && input.deviceInfo) {
      try {
        session = await this.issueSession(updatedUser.id, updatedUser.roleId, input.deviceInfo);
      } catch {
        // Session issue can fail gracefully without failing account activation
      }
    }

    return {
      user: updatedUser,
      ...(session ? { session } : {}),
    };
  }
}

export class AdminResetUserPassword {
  constructor(
    private readonly users: IUserProfileRepository,
    private readonly hashPassword: (plaintext: string) => Promise<string>,
    private readonly generatePassword?: () => string,
  ) {}

  async execute(
    id: string,
    newPassword?: string,
    mustChangePassword = true,
  ): Promise<{ success: boolean; message: string; temporaryPassword: string }> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const passwordToSet =
      newPassword ||
      (this.generatePassword
        ? this.generatePassword()
        : `Nfi#${Math.random().toString(36).slice(2, 8)}!`);
    const hash = await this.hashPassword(passwordToSet);
    await this.users.resetPassword(id, hash, mustChangePassword);
    return {
      success: true,
      message: `Password reset successfully for ${user.email}`,
      temporaryPassword: passwordToSet,
    };
  }
}

export class AdminUpdateUserStatus {
  constructor(private readonly users: IUserProfileRepository) {}

  async execute(id: string, status: string): Promise<UserProfile> {
    const updated = await this.users.updateStatus(id, status);
    if (!updated) {
      throw new NotFoundError('User not found');
    }
    return updated;
  }
}
