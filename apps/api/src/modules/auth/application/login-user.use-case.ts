// LoginUser — docs/02_enterprise_architecture.md §9's Login sequence, docs/09 §2.1/§2.8/§10.
//
// Outcome is one of three states, not a boolean:
//   MFA_ENROLMENT_REQUIRED — privileged account that has not yet enrolled TOTP (docs/09 §2.8)
//   MFA_REQUIRED           — privileged account, enrolled; must present a TOTP code
//   AUTHENTICATED          — CUSTOMER (docs/09 §2.8: MFA "not required for CUSTOMER accounts")
import { UnauthorizedError } from '../../../core/exceptions';
import { canAuthenticate, isLockedOut, requiresMfaEnrolment } from '../domain/auth-user';
import { registerFailedAttempt, resetLockout } from '../domain/lockout-policy';
import { requiresMfa } from '../domain/user-type';
import type { IAuthUserRepository, IPasswordHasher } from './ports';

export interface LoginUserInput {
  readonly email: string;
  readonly password: string;
}

export type LoginOutcome =
  | { readonly status: 'AUTHENTICATED'; readonly userId: string }
  | { readonly status: 'MFA_REQUIRED'; readonly userId: string }
  | { readonly status: 'MFA_ENROLMENT_REQUIRED'; readonly userId: string };

export class LoginUser {
  constructor(
    private readonly users: IAuthUserRepository,
    private readonly hasher: IPasswordHasher,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginOutcome> {
    const user = await this.users.findByEmail(input.email);

    // docs/09 §10 `auth` row — "Invalid credentials rejected WITHOUT user-enumeration hint".
    // Every failure below returns the identical message and status, so a caller cannot
    // distinguish "no such account" from "wrong password" from "suspended".
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (isLockedOut(user)) {
      // Deliberately the same message — revealing lockout state would confirm the account exists.
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!canAuthenticate(user)) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await this.hasher.verify(input.password, user.passwordHash);
    if (!passwordMatches) {
      const outcome = registerFailedAttempt(user.failedLoginAttempts);
      await this.users.updateLockout(user.id, outcome.failedLoginAttempts, outcome.lockedUntil);
      throw new UnauthorizedError('Invalid email or password');
    }

    const reset = resetLockout();
    await this.users.updateLockout(user.id, reset.failedLoginAttempts, reset.lockedUntil);

    // docs/09 §2.8 — privileged accounts must enrol MFA before privileged access. A session is
    // NOT issued here; the caller is routed to /auth/mfa/setup.
    if (requiresMfaEnrolment(user)) {
      return { status: 'MFA_ENROLMENT_REQUIRED', userId: user.id };
    }

    if (requiresMfa(user.userType)) {
      return { status: 'MFA_REQUIRED', userId: user.id };
    }

    await this.users.recordSuccessfulLogin(user.id);
    return { status: 'AUTHENTICATED', userId: user.id };
  }
}
