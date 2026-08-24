// Audit-log field redaction — docs/03_database_design.md §9.8.2's v1.1 redaction rule, and
// docs/09_security_architecture.md §11 rule 8 ("Secrets never appear in a log statement, error
// message, or audit-log snapshot").
//
// The rule, verbatim from docs/03 §9.8.2: before/after snapshots "never capture passwordHash,
// refresh/OTP/reset token hashes, or other secret-equivalent fields in full — those fields are
// replaced with the literal string [REDACTED] in the snapshot, NOT silently omitted (so the audit
// record still shows *that* the field changed, without persisting its value)".
//
// Necessary because audit_logs is immutable and never deleted (docs/03 §3.1) — without redaction
// a password hash predating a reset would persist in audit history indefinitely.
// Framework-free (docs/06 §4.3).

export const REDACTED = '[REDACTED]';

/**
 * Field-redaction allowlist, maintained alongside each module's audit call sites per
 * docs/03 §9.8.2. Add to this list whenever a new Tier 1 field (docs/09 §1.4) is introduced.
 */
const SECRET_EQUIVALENT_FIELDS = new Set([
  'passwordHash',
  'passwordHistory',
  'mfaSecret',
  'tokenHash',
  'otpHash',
  'refreshToken',
  'accessToken',
  'password',
]);

/**
 * Returns a copy of `snapshot` with every secret-equivalent field replaced by `[REDACTED]`.
 * Replacement, never omission — the audit record must still show that the field changed.
 */
export function redactSnapshot(
  snapshot: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!snapshot) {
    return null;
  }
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(snapshot)) {
    if (SECRET_EQUIVALENT_FIELDS.has(key)) {
      output[key] = REDACTED;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = redactSnapshot(value as Record<string, unknown>);
    } else {
      output[key] = value;
    }
  }
  return output;
}
