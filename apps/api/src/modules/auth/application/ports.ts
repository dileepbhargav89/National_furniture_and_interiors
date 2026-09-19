// Port interfaces — docs/02_enterprise_architecture.md §7.1 (Repository Pattern contract), §7.3
// (dependency inversion: Application depends on interfaces, Infrastructure implements them, and
// wiring happens at the composition root). docs/06 §4.3: application/ holds "use-case classes…
// port interfaces".
import type { AuthUser } from '../domain/auth-user';
import type { UserStatus, UserType } from '../domain/user-type';

export interface CreateAuthUserInput {
  email: string;
  phone: string | null;
  passwordHash: string | null;
  authProviders: string[];
  googleId: string | null;
  facebookId: string | null;
  fullName: string;
  userType: UserType;
  roleId: string;
  status: UserStatus;
}

export interface IAuthUserRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  findByPhone(phone: string): Promise<AuthUser | null>;
  findById(id: string): Promise<AuthUser | null>;
  existsByEmail(email: string): Promise<boolean>;
  create(input: CreateAuthUserInput): Promise<AuthUser>;
  updateLockout(id: string, failedLoginAttempts: number, lockedUntil: Date | null): Promise<void>;
  recordSuccessfulLogin(id: string): Promise<void>;
  setMfaSecret(id: string, secret: string): Promise<void>;
  enableMfa(id: string): Promise<void>;
  setPasswordResetToken(id: string, token: string, expiresAt: Date): Promise<void>;
  findByPasswordResetToken(token: string): Promise<AuthUser | null>;
  resetPassword(id: string, newPasswordHash: string, previousHashes?: string[]): Promise<void>;
}

export interface StoredRefreshToken {
  readonly id: string;
  readonly userId: string;
  readonly revokedAt: Date | null;
  readonly replacedByTokenId: string | null;
}

export interface IRefreshTokenRepository {
  /** Stores the HASH, never the plaintext — docs/03 §9.1.4, docs/02 §9.1. */
  store(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    deviceInfo: { userAgent: string; ip: string };
  }): Promise<string>;
  findByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
  markRotated(id: string, replacedByTokenId: string): Promise<void>;
  revoke(id: string): Promise<void>;
  /** docs/09 §2.6 — reuse of a rotated token revokes every session for that user. */
  revokeAllForUser(userId: string): Promise<void>;
  countActiveForUser(userId: string): Promise<number>;
  revokeOldestForUser(userId: string): Promise<void>;
}

export interface IPasswordHasher {
  hash(plaintext: string): Promise<string>;
  verify(plaintext: string, hash: string): Promise<boolean>;
}

export interface AccessTokenClaims {
  sub: string;
  userType: UserType;
  roleId: string;
  roleName?: string;
  /** docs/02 §9.1 — the access token carries resolved PERMISSION KEYS, not just a role name. */
  permissions: string[];
}

export interface ITokenService {
  issueAccessToken(claims: AccessTokenClaims): string;
  verifyAccessToken(token: string): AccessTokenClaims;
  issueRefreshToken(): { token: string; hash: string; expiresAt: Date };
  hashRefreshToken(token: string): string;
}

export interface ITotpService {
  generateSecret(): string;
  buildOtpAuthUrl(secret: string, accountLabel: string): string;
  verify(secret: string, code: string): boolean;
}

export interface GooglePayload {
  email: string;
  sub: string;
  name?: string | undefined;
}

export interface FacebookPayload {
  email: string;
  id: string;
  name?: string | undefined;
}

export interface GoogleAuthParams {
  idToken?: string | undefined;
  accessToken?: string | undefined;
}

export interface IGoogleAuthService {
  verifyIdToken(idToken: string): Promise<GooglePayload>;
  verifyAccessToken?(accessToken: string): Promise<GooglePayload>;
  verifyToken?(params: GoogleAuthParams): Promise<GooglePayload>;
}

export interface IFacebookAuthService {
  verifyAccessToken(accessToken: string): Promise<FacebookPayload>;
}

export interface ISmsService {
  sendOtp(phone: string, code: string): Promise<void>;
}

/**
 * Cross-module dependency, resolved through an exported Application-layer interface only —
 * docs/06 §4.3 / §1.6. `auth` never imports `admin`'s infrastructure or domain.
 */
export interface IPermissionResolver {
  /** Resolves a role's permission keys from roles.permissionIds[] -> permissions.key. */
  resolvePermissionKeys(roleId: string): Promise<string[]>;
}

export interface AuditEvent {
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
}

/** `admin`'s exported audit-write interface — docs/08 §4.11, docs/08 §8's `admin` row. */
export interface IAuditLogger {
  record(event: AuditEvent): Promise<void>;
}
