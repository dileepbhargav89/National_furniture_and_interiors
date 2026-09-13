// IssueSession — mints the access/refresh pair once authentication (and MFA, where required) has
// succeeded. Shared by LoginUser's CUSTOMER path, VerifyMfa, and RefreshToken's rotation.
//
// docs/02 §9.1 / docs/08 §4.1-4.2 / docs/09 §2.1:
//   * access token  — short TTL, returned in the response BODY, held in memory client-side
//   * refresh token — long TTL, HASHED in storage, returned to the caller for httpOnly cookie
//   * access-token claims carry resolved PERMISSION KEYS (docs/02 §9.1, v1.1 S2 resolution)
import { UnauthorizedError } from '../../../core/exceptions';
import type {
  IAuthUserRepository,
  IPermissionResolver,
  IRefreshTokenRepository,
  ITokenService,
} from './ports';

/**
 * docs/09 §2.5 — "SUPER_ADMIN and DESIGN_MANAGER roles are capped at 3 concurrent sessions, with
 * the oldest session force-revoked on a 4th login". Keyed by role NAME, resolved by the caller.
 */
export const SESSION_CAPPED_ROLES = ['SUPER_ADMIN', 'DESIGN_MANAGER'] as const;
export const MAX_CONCURRENT_SESSIONS = 3;

export interface IssueSessionInput {
  readonly userId: string;
  readonly roleName: string;
  readonly deviceInfo: { userAgent: string; ip: string };
}

export interface SessionTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: Date;
}

export class IssueSession {
  constructor(
    private readonly users: IAuthUserRepository,
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly tokens: ITokenService,
    private readonly permissions: IPermissionResolver,
  ) {}

  async execute(input: IssueSessionInput): Promise<SessionTokens> {
    const user = await this.users.findById(input.userId);
    if (!user) {
      throw new UnauthorizedError('Invalid session');
    }

    // docs/09 §2.5's concurrent-session cap for the two highest-privilege roles.
    if ((SESSION_CAPPED_ROLES as readonly string[]).includes(input.roleName)) {
      const active = await this.refreshTokens.countActiveForUser(user.id);
      if (active >= MAX_CONCURRENT_SESSIONS) {
        await this.refreshTokens.revokeOldestForUser(user.id);
      }
    }

    const permissionKeys = await this.permissions.resolvePermissionKeys(user.roleId);

    const accessToken = this.tokens.issueAccessToken({
      sub: user.id,
      userType: user.userType,
      roleId: user.roleId,
      roleName: input.roleName,
      permissions: permissionKeys,
    });

    const refresh = this.tokens.issueRefreshToken();
    await this.refreshTokens.store({
      userId: user.id,
      tokenHash: refresh.hash,
      expiresAt: refresh.expiresAt,
      deviceInfo: input.deviceInfo,
    });

    await this.users.recordSuccessfulLogin(user.id);

    return {
      accessToken,
      refreshToken: refresh.token,
      refreshTokenExpiresAt: refresh.expiresAt,
    };
  }
}
