// JWT access tokens + opaque refresh tokens — docs/02 §9.1, docs/07 §6.1 (LOCKED),
// docs/08 §4.1-4.2, docs/09 §2.1.
//
// Access token  — JWT, short TTL, carries resolved PERMISSION KEYS (docs/02 §9.1's v1.1 S2
//                 resolution: "not just a role name").
// Refresh token — a high-entropy opaque random string, NOT a JWT. Its authority comes from the
//                 stored hash, so there is nothing to gain from making it self-describing, and
//                 an opaque value cannot leak claims if intercepted.
import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../../core/exceptions';
import { env } from '../../../core/config';
import type { AccessTokenClaims, ITokenService } from '../application/ports';

/** Parses the `15m` / `7d` forms core/config already validates by regex. */
function parseDurationMs(value: string): number {
  const amount = Number(value.slice(0, -1));
  const unit = value.slice(-1);
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * (unitMs[unit] ?? 0);
}

export class JwtTokenService implements ITokenService {
  issueAccessToken(claims: AccessTokenClaims): string {
    // env.JWT_ACCESS_TTL is regex-validated by core/config to the `15m`/`1h`/`7d` form, so the
    // cast is asserting a shape config already guarantees. The non-optional local satisfies
    // exactOptionalPropertyTypes, which rejects a possibly-undefined `expiresIn`.
    const options: jwt.SignOptions = {
      expiresIn: env.JWT_ACCESS_TTL as NonNullable<jwt.SignOptions['expiresIn']>,
    };
    return jwt.sign(claims, env.JWT_ACCESS_SECRET, options);
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      if (typeof decoded === 'string') {
        throw new UnauthorizedError('Invalid access token');
      }
      return {
        sub: decoded.sub as string,
        userType: decoded.userType as AccessTokenClaims['userType'],
        roleId: decoded.roleId as string,
        permissions: (decoded.permissions as string[]) ?? [],
      };
    } catch {
      // Signature failure, expiry, and malformed input all collapse to one response — revealing
      // which would help an attacker tune their forgery attempts.
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  issueRefreshToken(): { token: string; hash: string; expiresAt: Date } {
    const token = randomBytes(48).toString('base64url');
    return {
      token,
      hash: this.hashRefreshToken(token),
      expiresAt: new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_TTL)),
    };
  }

  /**
   * SHA-256, not bcrypt. The input is 48 bytes of CSPRNG output, so it has no brute-forceable
   * structure for a slow hash to protect — and refresh happens on the request path, where a
   * deliberately slow KDF would be a self-inflicted latency cost. bcrypt remains correct for
   * user-chosen passwords (docs/07 §6.2); this is the different case.
   */
  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
