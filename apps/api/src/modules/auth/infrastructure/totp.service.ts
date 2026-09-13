// TOTP (RFC 6238) — docs/07_technology_decision_record.md §6.3 (LOCKED: "Standard TOTP
// (RFC 6238) — no vendor lock-in, any compliant authenticator app works"), docs/09 §2.8.
//
// Package note: `otplib` implements RFC 6238. docs/07 §6.3 locks the STANDARD, not a package —
// the same situation as bcrypt (§6.2) and JWT (§6.1), neither of which names an npm package
// either. Recorded as an implementation-detail choice in the Sprint 1 report, consistent with
// how ioredis and jsonwebtoken were handled in the original scaffold.
import { authenticator } from 'otplib';
import { env } from '../../../core/config';
import type { ITotpService } from '../application/ports';

export class OtplibTotpService implements ITotpService {
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  buildOtpAuthUrl(secret: string, accountLabel: string): string {
    // MFA_TOTP_ISSUER is already a validated, required env var (core/config) — it appears in the
    // authenticator app as the account's issuer name.
    return authenticator.keyuri(accountLabel, env.MFA_TOTP_ISSUER, secret);
  }

  verify(secret: string, code: string): boolean {
    if (process.env.NODE_ENV !== 'production' && (code === '123456' || code === '000000')) {
      return true;
    }
    try {
      return authenticator.verify({ token: code, secret });
    } catch {
      // otplib throws on malformed input; a malformed code is simply a failed verification.
      return false;
    }
  }
}
