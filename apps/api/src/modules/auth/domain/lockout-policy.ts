// Brute-force lockout — docs/03_database_design.md §9.1.1 (`failedLoginAttempts`, `lockedUntil`),
// docs/09_security_architecture.md §10's `auth` row (credential-stuffing threat).
//
// Note: this is the per-account lockout backstop. The primary volumetric control is the Strict
// rate-limit tier (docs/08 §4.4: 5 req/min per IP, 10 req/min per account), applied in the
// presentation layer. The two are layered, not alternatives.

/** No locked document specifies a threshold; these are the module's own operational values. */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export interface LockoutOutcome {
  readonly failedLoginAttempts: number;
  readonly lockedUntil: Date | null;
}

export function registerFailedAttempt(current: number, now: Date = new Date()): LockoutOutcome {
  const failedLoginAttempts = current + 1;
  return failedLoginAttempts >= MAX_FAILED_ATTEMPTS
    ? { failedLoginAttempts, lockedUntil: new Date(now.getTime() + LOCKOUT_DURATION_MS) }
    : { failedLoginAttempts, lockedUntil: null };
}

/** docs/03 §9.1.1 — "reset on success". */
export function resetLockout(): LockoutOutcome {
  return { failedLoginAttempts: 0, lockedUntil: null };
}
