// users module port interfaces — docs/02 §7.1, docs/06 §4.3.
//
// Note the shared-collection relationship: this repository reads and writes the SAME `users`
// collection as `auth`'s, but through its own interface and its own Mongoose model, exposing only
// the profile fields this module owns (docs/06 §4.3's module list note). Neither module imports
// the other's infrastructure or domain.
import type { Address } from '../domain/address';

export interface UserProfile {
  readonly id: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly userType: string;
  readonly roleId: string;
  readonly status: string;
  readonly avatarUrl: string | null;
  readonly addresses: readonly Address[];
  readonly mfaEnabled: boolean;
  readonly createdAt: Date;
  readonly companyName?: string | null | undefined;
  readonly gstin?: string | null | undefined;
  readonly onboardingStatus?: 'INVITED' | 'PENDING_PASSWORD' | 'COMPLETED' | undefined;
  readonly onboardingToken?: string | null | undefined;
  readonly onboardingTokenExpiresAt?: Date | null | undefined;
  readonly invitedAt?: Date | null | undefined;
  readonly lastLoginAt?: Date | null | undefined;
  readonly failedLoginAttempts?: number | undefined;
  readonly lockedUntil?: Date | null | undefined;
  readonly mustChangePassword?: boolean | undefined;
}

export interface UserDetailDossier extends UserProfile {
  readonly ordersCount: number;
  readonly totalSpend: number; // in paise
  readonly lastOrderAt?: Date | null | undefined;
  readonly authProviders: readonly string[];
}

export interface UnregisteredUserLead {
  readonly id: string;
  readonly name: string;
  readonly email?: string | null | undefined;
  readonly phone: string;
  readonly source: string;
  readonly interestType: string;
  readonly projectType?: string | null | undefined;
  readonly budgetRange?: { min: number; max: number } | undefined;
  readonly score: number;
  readonly priority: 'HOT' | 'WARM' | 'COLD';
  readonly status: string;
  readonly createdAt: Date;
}

export interface AdminOnboardUserInput {
  readonly email: string;
  readonly fullName?: string | undefined;
  readonly phone?: string | null | undefined;
  readonly userType: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  readonly roleId: string;
  readonly companyName?: string | null | undefined;
  readonly gstin?: string | null | undefined;
  readonly temporaryPassword?: string | undefined;
  readonly sendInvite?: boolean | undefined;
}

export interface CompleteOnboardingData {
  readonly fullName: string;
  readonly phone?: string | null | undefined;
  readonly passwordHash: string;
  readonly companyName?: string | null | undefined;
  readonly gstin?: string | null | undefined;
  readonly address?: Address | undefined;
}

export interface UserListFilter {
  readonly search?: string | undefined;
  readonly userType?: string | undefined;
  readonly status?: string | undefined;
  readonly page?: number | undefined;
  readonly limit?: number | undefined;
}

// `| undefined` on every optional member: tsconfig.base.json enables exactOptionalPropertyTypes,
// under which an absent key and an explicit `undefined` are distinct types.
export interface UpdateOwnProfileInput {
  readonly fullName?: string | undefined;
  readonly phone?: string | null | undefined;
  readonly avatarUrl?: string | null | undefined;
  readonly addresses?: readonly Address[] | undefined;
  readonly companyName?: string | null | undefined;
  readonly gstin?: string | null | undefined;
}

export interface AdminCreateUserInput {
  readonly email: string;
  readonly fullName: string;
  readonly phone: string | null;
  readonly passwordHash: string;
  readonly userType: 'STAFF' | 'ADMIN';
  readonly roleId: string;
}

export interface IUserProfileRepository {
  findById(id: string): Promise<UserProfile | null>;
  findByIdDetailed(id: string): Promise<UserDetailDossier | null>;
  findByEmail(email: string): Promise<UserProfile | null>;
  findByOnboardingToken(token: string): Promise<UserProfile | null>;
  list(limit: number): Promise<UserProfile[]>;
  listWithFilters(filter: UserListFilter): Promise<{ items: UserProfile[]; total: number }>;
  updateOwn(id: string, input: UpdateOwnProfileInput): Promise<UserProfile | null>;
  createPrivileged(input: AdminCreateUserInput): Promise<UserProfile>;
  onboardUser(
    input: AdminOnboardUserInput,
    passwordHash: string | null,
    onboardingToken?: string,
    onboardingTokenExpiresAt?: Date,
  ): Promise<UserProfile>;
  updateStatus(id: string, status: string): Promise<UserProfile | null>;
  resetPassword(
    id: string,
    newPasswordHash: string,
    mustChangePassword?: boolean,
  ): Promise<boolean>;
  recordOnboardingInvite(id: string): Promise<boolean>;
  refreshOnboardingToken(id: string, token: string, expiresAt: Date): Promise<boolean>;
  completeOnboarding(id: string, data: CompleteOnboardingData): Promise<UserProfile | null>;
}
