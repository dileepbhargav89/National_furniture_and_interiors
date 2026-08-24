// Express application factory — docs/06_project_structure.md §4.1.
//
// Middleware pipeline order is docs/07 §4.2's documented sequence, applied once here and never
// varied per module: request-id -> security headers -> CORS -> cookies -> body -> routes ->
// error handler (which must be LAST, since Express only invokes 4-arg middleware for errors).
import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import { isCacheConnected } from './core/cache';
import { isDatabaseConnected } from './core/database';
import { buildAppContext } from './core/di';
import { errorHandlerMiddleware } from './core/exceptions';
import { requestIdMiddleware } from './core/logger/request-id';
import { corsPolicy, securityHeaders } from './core/security';

import { createAuthController } from './modules/auth/presentation/auth.controller';
import { createAuthMiddleware } from './modules/auth/presentation/auth.middleware';
import { createAuthRoutes } from './modules/auth/presentation/auth.routes';
import { createAdminRoutes } from './modules/admin/presentation/admin.routes';
import { createUsersRoutes } from './modules/users/presentation/users.routes';

/**
 * @param mountBusinessRoutes false in unit tests that only exercise the probes, so no Redis-backed
 * rate limiter is constructed where no Redis is available.
 */
export function createApp(mountBusinessRoutes = true): Express {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(securityHeaders);
  app.use(corsPolicy);
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));

  // Liveness probe — docs/10_devops_architecture.md §10.4: "is the process alive?" only. Never
  // checks a dependency; a Mongo/Redis blip must NOT cause the orchestrator to restart a healthy
  // process. Infrastructure, not a business route (docs/06 §4.2).
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // Readiness probe — docs/10 §10.4: "can this instance currently serve traffic?" A failure
  // removes the instance from load-balancer rotation without restarting it.
  app.get('/ready', (_req, res) => {
    const mongoConnected = isDatabaseConnected();
    const redisConnected = isCacheConnected();
    const ready = mongoConnected && redisConnected;
    res
      .status(ready ? 200 : 503)
      .json({ status: ready ? 'ready' : 'not_ready', mongoConnected, redisConnected });
  });

  if (mountBusinessRoutes) {
    const ctx = buildAppContext();
    const authMiddleware = createAuthMiddleware(ctx.auth.tokenService);

    const authController = createAuthController({
      registerUser: ctx.auth.registerUser,
      loginUser: ctx.auth.loginUser,
      issueSession: ctx.auth.issueSession,
      setupMfa: ctx.auth.setupMfa,
      verifyMfa: ctx.auth.verifyMfa,
      refreshToken: ctx.auth.refreshToken,
      logoutUser: ctx.auth.logoutUser,
      resolveRoleName: (roleId) => ctx.admin.permissionResolver.resolveRoleName(roleId),
      resolveRoleIdForUser: async (userId) => {
        const user = await ctx.authUserRepository.findById(userId);
        if (!user) {
          throw new Error('User not found while resolving role');
        }
        return user.roleId;
      },
    });

    // docs/08 §3.17 — URI-based versioning from day one.
    app.use('/api/v1/auth', createAuthRoutes(authController, authMiddleware));

    app.use(
      '/api/v1',
      createUsersRoutes(
        {
          getOwnProfile: ctx.users.getOwnProfile,
          updateOwnProfile: ctx.users.updateOwnProfile,
          adminListUsers: ctx.users.adminListUsers,
          adminCreateUser: ctx.users.adminCreateUser,
          hashPassword: (plaintext) => ctx.auth.passwordHasher.hash(plaintext),
          resolveRoleIdByName: async (name) =>
            (await ctx.admin.roleRepository.findByName(name))?.id ?? null,
          recordAudit: (input) => ctx.admin.auditLogger.record(input),
        },
        authMiddleware,
      ),
    );

    app.use(
      '/api/v1/admin',
      createAdminRoutes(
        {
          listRoles: ctx.admin.listRoles,
          listPermissions: ctx.admin.listPermissions,
          listAuditLogs: ctx.admin.listAuditLogs,
        },
        authMiddleware,
      ),
    );
  }

  // Must be registered last — docs/02 §16's centralized error middleware.
  app.use(errorHandlerMiddleware);

  return app;
}
