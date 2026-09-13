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
  readonly companyName?: string | null;
  readonly gstin?: string | null;
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
  findByEmail(email: string): Promise<UserProfile | null>;
  list(limit: number): Promise<UserProfile[]>;
  updateOwn(id: string, input: UpdateOwnProfileInput): Promise<UserProfile | null>;
  createPrivileged(input: AdminCreateUserInput): Promise<UserProfile>;
}
