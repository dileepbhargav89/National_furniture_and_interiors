// RefreshToken — rotation with reuse detection.
//
// docs/02_enterprise_architecture.md §9.1: "Refresh token rotated on every use; reuse of an
// already-rotated token is treated as a compromise signal (revoke all sessions for that user)".
// docs/09 §2.6 adds the detection-to-response mapping: a detected reuse is ALSO written to
// audit_logs with action TOKEN_REUSE_DETECTED, because "refresh-token reuse is one of the
// highest-confidence account-compromise indicators available anywhere in the system".
import { UnauthorizedError } from '../../../core/exceptions';
import type {
  IAuditLogger,
  IAuthUserRepository,
  IRefreshTokenRepository,
  ITokenService,
} from './ports';

export interface RefreshTokenInput {
  readonly presentedToken: string;
  readonly deviceInfo: { userAgent: string; ip: string };
}

export interface RefreshTokenResult {
  readonly userId: string;
  readonly roleName: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly users: IAuthUserRepository,
    private readonly tokens: ITokenService,
    private readonly audit: IAuditLogger,
    private readonly resolveRoleName: (roleId: string) => Promise<string>,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenResult> {
    const presentedHash = this.tokens.hashRefreshToken(input.presentedToken);
    const stored = await this.refreshTokens.findByHash(presentedHash);

    if (!stored) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // ---- Reuse detection (docs/09 §2.6) -----------------------------------------------------
    // A token that has already been rotated (replacedByTokenId set) or explicitly revoked, but is
    // being presented again, means the token was captured. The legitimate holder's copy was
    // rotated away, so whoever presents the old one is not the legitimate holder — or the
    // legitimate holder's copy was stolen and used first. Either way: revoke everything.
    if (stored.replacedByTokenId !== null || stored.revokedAt !== null) {
      await this.refreshTokens.revokeAllForUser(stored.userId);
      await this.audit.record({
        actorId: stored.userId,
        actorRole: null,
        action: 'TOKEN_REUSE_DETECTED',
        entityType: 'refresh_tokens',
        entityId: stored.id,
        ipAddress: input.deviceInfo.ip,
        userAgent: input.deviceInfo.userAgent,
      });
      throw new UnauthorizedError('Invalid refresh token');
    }
    // -----------------------------------------------------------------------------------------

    const user = await this.users.findById(stored.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Rotate: revoke the presented token before minting its replacement, so a crash between the
    // two leaves the old token dead rather than both alive.
    await this.refreshTokens.revoke(stored.id);

    return { userId: user.id, roleName: await this.resolveRoleName(user.roleId) };
  }

  /** Links the rotation chain once the replacement exists — docs/03 §9.1.4's replacedByTokenId. */
  async linkRotation(oldTokenHash: string, newTokenId: string): Promise<void> {
    const stored = await this.refreshTokens.findByHash(oldTokenHash);
    if (stored) {
      await this.refreshTokens.markRotated(stored.id, newTokenId);
    }
  }
}

export class LogoutUser {
  constructor(
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly tokens: ITokenService,
  ) {}

  /** docs/02 §9's Logout sequence — delete the stored refresh token, clear the cookie. */
  async execute(presentedToken: string | undefined): Promise<void> {
    if (!presentedToken) {
      return; // Idempotent: logging out without a session is a no-op, not an error.
    }
    const stored = await this.refreshTokens.findByHash(
      this.tokens.hashRefreshToken(presentedToken),
    );
    if (stored) {
      await this.refreshTokens.revoke(stored.id);
    }
  }
}
