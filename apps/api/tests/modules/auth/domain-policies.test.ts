// Unit tests for the auth module's pure domain policies.
//
// These encode security behaviour that was previously verified only indirectly, through the live
// acceptance run. That is weaker than it sounds: an integration test proves the behaviour holds
// for the paths it happens to walk, whereas these pin the rule itself — including the boundary
// values an end-to-end flow never exercises.
//
// Domain layer, so there is nothing to mock: no framework, no I/O (docs/06 §4.3).
import { describe, expect, it } from 'vitest';
import {
  PASSWORD_HISTORY_SIZE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  checkPasswordPolicy,
} from '../../../src/modules/auth/domain/password-policy';
import {
  LOCKOUT_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  registerFailedAttempt,
  resetLockout,
} from '../../../src/modules/auth/domain/lockout-policy';
import {
  USER_STATUSES,
  USER_TYPES,
  requiresMfa,
  type UserType,
} from '../../../src/modules/auth/domain/user-type';

describe('password policy (docs/09 §2.7)', () => {
  it('accepts a password exactly at the minimum length', () => {
    expect(checkPasswordPolicy('a'.repeat(PASSWORD_MIN_LENGTH))).toBeNull();
  });

  it('rejects one character below the minimum', () => {
    const violation = checkPasswordPolicy('a'.repeat(PASSWORD_MIN_LENGTH - 1));
    expect(violation?.rule).toBe('MIN_LENGTH');
  });

  it('accepts a password exactly at the maximum length', () => {
    expect(checkPasswordPolicy('a'.repeat(PASSWORD_MAX_LENGTH))).toBeNull();
  });

  it('rejects one character above the maximum', () => {
    const violation = checkPasswordPolicy('a'.repeat(PASSWORD_MAX_LENGTH + 1));
    expect(violation?.rule).toBe('MAX_LENGTH');
  });

  it('rejects the empty string', () => {
    expect(checkPasswordPolicy('')?.rule).toBe('MIN_LENGTH');
  });

  // docs/09 §2.7 deliberately imposes NO composition rule. This asserts that absence: a long
  // all-lowercase password must pass. If someone later adds a "must contain a symbol" rule, this
  // fails — which is the point, because that would contradict the locked decision.
  it('imposes no composition rule — length is the only structural constraint', () => {
    expect(checkPasswordPolicy('aaaaaaaaaaaaaaaaaaaa')).toBeNull();
    expect(checkPasswordPolicy('correct horse battery staple')).toBeNull();
    expect(checkPasswordPolicy('!@#$%^&*()_+{}|:"<>?')).toBeNull();
  });

  it('does not reject on the basis of multi-byte characters', () => {
    // Length is counted in JS string units; a 10-emoji password is >= 10 units.
    expect(checkPasswordPolicy('🔐'.repeat(10))).toBeNull();
  });

  it('retains the docs/09 §2.7 history size of 5', () => {
    expect(PASSWORD_HISTORY_SIZE).toBe(5);
  });
});

describe('lockout policy', () => {
  const now = new Date('2026-08-11T00:00:00.000Z');

  it('does not lock before the threshold is reached', () => {
    for (let current = 0; current < MAX_FAILED_ATTEMPTS - 1; current += 1) {
      const outcome = registerFailedAttempt(current, now);
      expect(outcome.lockedUntil).toBeNull();
      expect(outcome.failedLoginAttempts).toBe(current + 1);
    }
  });

  it('locks exactly on the attempt that reaches the threshold', () => {
    const outcome = registerFailedAttempt(MAX_FAILED_ATTEMPTS - 1, now);
    expect(outcome.failedLoginAttempts).toBe(MAX_FAILED_ATTEMPTS);
    expect(outcome.lockedUntil).toEqual(new Date(now.getTime() + LOCKOUT_DURATION_MS));
  });

  it('stays locked when further attempts arrive past the threshold', () => {
    const outcome = registerFailedAttempt(MAX_FAILED_ATTEMPTS + 3, now);
    expect(outcome.lockedUntil).not.toBeNull();
  });

  it('resets to a clean slate on success (docs/03 §9.1.1)', () => {
    expect(resetLockout()).toEqual({ failedLoginAttempts: 0, lockedUntil: null });
  });

  it('never returns a lockedUntil in the past', () => {
    const outcome = registerFailedAttempt(MAX_FAILED_ATTEMPTS, now);
    expect(outcome.lockedUntil!.getTime()).toBeGreaterThan(now.getTime());
  });
});

describe('userType / MFA requirement (docs/09 §2.8)', () => {
  it('requires MFA for STAFF and ADMIN', () => {
    expect(requiresMfa('STAFF')).toBe(true);
    expect(requiresMfa('ADMIN')).toBe(true);
  });

  it('does not require MFA for CUSTOMER', () => {
    expect(requiresMfa('CUSTOMER')).toBe(false);
  });

  // Fail-closed guard: if a privileged userType is ever added to the enum, it must be considered
  // here deliberately rather than silently defaulting to "no MFA required".
  it('every declared userType other than CUSTOMER requires MFA', () => {
    const notRequiring = USER_TYPES.filter((t: UserType) => !requiresMfa(t));
    expect(notRequiring).toEqual(['CUSTOMER']);
  });

  it('declares exactly the docs/03 §9.1.1 enums', () => {
    expect([...USER_TYPES]).toEqual(['CUSTOMER', 'STAFF', 'ADMIN']);
    expect([...USER_STATUSES]).toEqual(['ACTIVE', 'SUSPENDED', 'BANNED']);
  });
});
