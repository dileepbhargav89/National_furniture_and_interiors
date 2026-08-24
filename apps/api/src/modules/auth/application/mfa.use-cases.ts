// MFA enrolment and verification — TOTP (RFC 6238), docs/07 §6.3 (LOCKED), docs/09 §2.8,
// docs/02 §9.1 v1.1 ("MFA Required (TOTP) for all STAFF/ADMIN user types before first
// admin-panel access; not required for CUSTOMER accounts").
import { ConflictError, UnauthorizedError } from '../../../core/exceptions';
import { requiresMfa } from '../domain/user-type';
import type { IAuthUserRepository, ITotpService } from './ports';

export interface SetupMfaResult {
  /** Provisioning URI for an authenticator app. The raw secret is never returned to a client. */
  readonly otpAuthUrl: string;
}

export class SetupMfa {
  constructor(
    private readonly users: IAuthUserRepository,
    private readonly totp: ITotpService,
  ) {}

  async execute(userId: string): Promise<SetupMfaResult> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError('Invalid session');
    }

    // docs/09 §2.8 — MFA is scoped to STAFF/ADMIN. Offering enrolment to a CUSTOMER would
    // contradict that scope, so it is a state conflict, not a validation error.
    if (!requiresMfa(user.userType)) {
      throw new ConflictError('MFA enrolment is only available for staff and admin accounts');
    }

    if (user.mfaEnabled) {
      // Re-enrolment is NOT self-service — docs/09 §2.8 requires SUPER_ADMIN-mediated identity
      // re-verification, because self-service MFA reset is a known bypass vector.
      throw new ConflictError(
        'MFA is already enrolled. A reset requires SUPER_ADMIN identity re-verification.',
      );
    }

    const secret = this.totp.generateSecret();
    await this.users.setMfaSecret(user.id, secret);

    return { otpAuthUrl: this.totp.buildOtpAuthUrl(secret, user.email) };
  }
}

export interface VerifyMfaInput {
  readonly userId: string;
  readonly code: string;
}

export class VerifyMfa {
  constructor(
    private readonly users: IAuthUserRepository,
    private readonly totp: ITotpService,
  ) {}

  /** Returns the user's roleId so the caller can apply docs/09 §2.5's session cap. */
  async execute(input: VerifyMfaInput): Promise<{ userId: string; roleId: string }> {
    const user = await this.users.findById(input.userId);
    if (!user || !user.mfaSecret) {
      throw new UnauthorizedError('MFA verification failed');
    }

    if (!this.totp.verify(user.mfaSecret, input.code)) {
      throw new UnauthorizedError('MFA verification failed');
    }

    // First successful verification completes enrolment (docs/09 §2.8's enrolment flow).
    if (!user.mfaEnabled) {
      await this.users.enableMfa(user.id);
    }

    return { userId: user.id, roleId: user.roleId };
  }
}
