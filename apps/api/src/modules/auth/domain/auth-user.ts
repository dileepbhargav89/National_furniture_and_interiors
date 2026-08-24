// Auth-owned slice of the `users` collection — docs/03_database_design.md §9.1.1.
//
// The `users` collection is shared with the `users` module (docs/06 §4.3: "users — (shared with
// auth on users) — Profile/address management, distinct from credential management"). This entity
// models only the credential/session fields `auth` owns; `users` owns fullName/avatar/addresses.
// Neither module imports the other's domain or infrastructure (docs/06 §4.3's import rules).
//
// Framework-free: zero imports from express/mongoose/ioredis/bullmq (mechanically enforced by
// @nfi/eslint-config's module-boundary rule).
import type { UserStatus, UserType } from './user-type';

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly phone: string | null;
  readonly passwordHash: string | null;
  readonly userType: UserType;
  readonly roleId: string;
  readonly status: UserStatus;
  readonly mfaEnabled: boolean;
  readonly mfaSecret: string | null;
  readonly failedLoginAttempts: number;
  readonly lockedUntil: Date | null;
  readonly passwordHistory: readonly string[];
}

/** docs/03 §9.1.1 — `lockedUntil` implements brute-force lockout. */
export function isLockedOut(user: AuthUser, now: Date = new Date()): boolean {
  return user.lockedUntil !== null && user.lockedUntil > now;
}

/** Only ACTIVE accounts may authenticate — docs/03 §9.1.1's `status` enum. */
export function canAuthenticate(user: AuthUser): boolean {
  return user.status === 'ACTIVE';
}

/**
 * docs/09 §2.8 — a STAFF/ADMIN account must complete TOTP enrolment before privileged access.
 * Returns true when the account is privileged but not yet enrolled, i.e. login must route to
 * MFA setup rather than issuing a full session.
 */
export function requiresMfaEnrolment(user: AuthUser): boolean {
  return (user.userType === 'STAFF' || user.userType === 'ADMIN') && !user.mfaEnabled;
}
