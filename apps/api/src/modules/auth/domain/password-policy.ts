// Password policy — docs/09_security_architecture.md §2.7, specified there for the first time in
// the doc series. Domain-layer invariant: re-checked here regardless of Presentation-layer Zod
// validation (docs/02 §16's defense-in-depth principle, docs/08 §3.12's closing note).
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
/** docs/09 §2.7 — "Last 5 password hashes retained… to prevent immediate reuse on a forced reset". */
export const PASSWORD_HISTORY_SIZE = 5;

export interface PasswordPolicyViolation {
  rule: 'MIN_LENGTH' | 'MAX_LENGTH';
  message: string;
}

/**
 * docs/09 §2.7 deliberately imposes NO composition rule (no forced special-character mix) —
 * "composition rules push users toward predictable substitutions… without materially increasing
 * entropy". Length is the only structural rule; breach-list checking is the substantive control
 * and is an open item (no provider named in any locked document).
 */
export function checkPasswordPolicy(password: string): PasswordPolicyViolation | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      rule: 'MIN_LENGTH',
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      rule: 'MAX_LENGTH',
      message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    };
  }
  return null;
}
