// Auth-specific cookie helpers. The response ENVELOPE helper lives in core/exceptions
// (success-response.ts) so all three modules share one implementation — docs/18 §4.3's DRY rule.

/** docs/08 §4.2 — the refresh cookie is scoped to the ONE path that consumes it, not the domain. */
export const REFRESH_COOKIE_NAME = 'nfi_refresh_token';
export const REFRESH_COOKIE_PATH = '/api/v1/auth/refresh';

export function refreshCookieOptions(expiresAt: Date, isProduction: boolean) {
  return {
    httpOnly: true,
    // docs/02 §9.1 / docs/08 §4.2: Secure + SameSite=Strict. Secure is relaxed only outside
    // production so the cookie works over plain-HTTP localhost during development.
    secure: isProduction,
    sameSite: 'strict' as const,
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt,
  };
}
