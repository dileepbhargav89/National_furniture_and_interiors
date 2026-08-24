// The composition root — docs/02_enterprise_architecture.md §7.3 (manual composition, not a DI
// framework), docs/06_project_structure.md §4.2: "the ONLY place concrete Infrastructure
// implementations are wired into Application-layer use-cases… this file only wires, it never
// decides".
//
// Note on module boundaries: this file legitimately imports from every module's application/ and
// infrastructure/ layers, because composition is precisely its job. The rule it must not break is
// the reverse one — no module may import another module's infrastructure/domain. Cross-module
// dependencies below are satisfied by passing `admin`'s PermissionResolver/AuditLogger into
// `auth`'s constructor as the INTERFACE `auth` declares in its own ports.ts (docs/06 §4.3/§1.6).
import type { Redis } from 'ioredis';
import mongooseInstance from 'mongoose';
import type mongoose from 'mongoose';
import type { Logger } from 'pino';
import { redisClient } from '../cache';
import { logger } from '../logger';

import {
  AuditLogger,
  ListAuditLogs,
  ListPermissions,
  ListRoles,
} from '../../modules/admin/application/audit-logger';
import { PermissionResolver } from '../../modules/admin/application/permission-resolver';
import {
  MongoAuditLogRepository,
  MongoPermissionRepository,
  MongoRoleRepository,
} from '../../modules/admin/infrastructure/admin.repositories';

import { IssueSession } from '../../modules/auth/application/issue-session.use-case';
import { LoginUser } from '../../modules/auth/application/login-user.use-case';
import { SetupMfa, VerifyMfa } from '../../modules/auth/application/mfa.use-cases';
import { RegisterUser } from '../../modules/auth/application/register-user.use-case';
import {
  LogoutUser,
  RefreshTokenUseCase,
} from '../../modules/auth/application/refresh-token.use-case';
import { MongoAuthUserRepository } from '../../modules/auth/infrastructure/auth-user.repository';
import { BcryptPasswordHasher } from '../../modules/auth/infrastructure/bcrypt-password-hasher';
import { JwtTokenService } from '../../modules/auth/infrastructure/jwt-token.service';
import { MongoRefreshTokenRepository } from '../../modules/auth/infrastructure/refresh-token.repository';
import { OtplibTotpService } from '../../modules/auth/infrastructure/totp.service';

import {
  AdminCreateUser,
  AdminListUsers,
  GetOwnProfile,
  UpdateOwnProfile,
} from '../../modules/users/application/user.use-cases';
import { MongoUserProfileRepository } from '../../modules/users/infrastructure/user-profile.repository';

export interface AppContext {
  readonly logger: Logger;
  readonly cache: Redis;
  readonly mongoose: typeof mongoose;

  readonly auth: {
    registerUser: RegisterUser;
    loginUser: LoginUser;
    issueSession: IssueSession;
    setupMfa: SetupMfa;
    verifyMfa: VerifyMfa;
    refreshToken: RefreshTokenUseCase;
    logoutUser: LogoutUser;
    tokenService: JwtTokenService;
    passwordHasher: BcryptPasswordHasher;
  };
  readonly users: {
    getOwnProfile: GetOwnProfile;
    updateOwnProfile: UpdateOwnProfile;
    adminListUsers: AdminListUsers;
    adminCreateUser: AdminCreateUser;
  };
  readonly admin: {
    listRoles: ListRoles;
    listPermissions: ListPermissions;
    listAuditLogs: ListAuditLogs;
    permissionResolver: PermissionResolver;
    auditLogger: AuditLogger;
    roleRepository: MongoRoleRepository;
  };
  readonly authUserRepository: MongoAuthUserRepository;
}

let appContext: AppContext | undefined;

/** Builds (once) and returns the wired application graph. Idempotent. */
export function buildAppContext(): AppContext {
  if (appContext) {
    return appContext;
  }

  // ---- Infrastructure ------------------------------------------------------------------------
  const roleRepository = new MongoRoleRepository();
  const permissionRepository = new MongoPermissionRepository();
  const auditLogRepository = new MongoAuditLogRepository();
  const authUserRepository = new MongoAuthUserRepository();
  const refreshTokenRepository = new MongoRefreshTokenRepository();
  const userProfileRepository = new MongoUserProfileRepository();

  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService();
  const totpService = new OtplibTotpService();

  // ---- admin: the two interfaces every other module consumes ---------------------------------
  const permissionResolver = new PermissionResolver(roleRepository, permissionRepository);
  const auditLogger = new AuditLogger(auditLogRepository);

  // ---- auth ----------------------------------------------------------------------------------
  const resolveCustomerRoleId = async (): Promise<string> => {
    const role = await roleRepository.findByName('CUSTOMER');
    if (!role) {
      throw new Error('CUSTOMER role is missing — run packages/database migrations 0002 and 0003');
    }
    return role.id;
  };

  const resolveRoleName = (roleId: string): Promise<string> =>
    permissionResolver.resolveRoleName(roleId);

  const auth = {
    registerUser: new RegisterUser(
      authUserRepository,
      passwordHasher,
      permissionResolver,
      resolveCustomerRoleId,
    ),
    loginUser: new LoginUser(authUserRepository, passwordHasher),
    issueSession: new IssueSession(
      authUserRepository,
      refreshTokenRepository,
      tokenService,
      permissionResolver,
    ),
    setupMfa: new SetupMfa(authUserRepository, totpService),
    verifyMfa: new VerifyMfa(authUserRepository, totpService),
    refreshToken: new RefreshTokenUseCase(
      refreshTokenRepository,
      authUserRepository,
      tokenService,
      auditLogger,
      resolveRoleName,
    ),
    logoutUser: new LogoutUser(refreshTokenRepository, tokenService),
    tokenService,
    passwordHasher,
  };

  // ---- users ---------------------------------------------------------------------------------
  const users = {
    getOwnProfile: new GetOwnProfile(userProfileRepository),
    updateOwnProfile: new UpdateOwnProfile(userProfileRepository),
    adminListUsers: new AdminListUsers(userProfileRepository),
    adminCreateUser: new AdminCreateUser(userProfileRepository),
  };

  // ---- admin read surface --------------------------------------------------------------------
  const admin = {
    listRoles: new ListRoles(roleRepository),
    listPermissions: new ListPermissions(permissionRepository),
    listAuditLogs: new ListAuditLogs(auditLogRepository),
    permissionResolver,
    auditLogger,
    roleRepository,
  };

  appContext = {
    logger,
    cache: redisClient,
    mongoose: mongooseInstance,
    auth,
    users,
    admin,
    authUserRepository,
  };
  return appContext;
}

/** Test-only: clears the memoized graph so a fresh one can be built. */
export function resetAppContext(): void {
  appContext = undefined;
}
