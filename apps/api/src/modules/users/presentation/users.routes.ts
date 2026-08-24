// users module routes — docs/08_api_architecture.md §8's `users` row:
//   Bearer required. `users.read_self` (own profile), `users.read`/`users.write` (admin, any user).
//   Resources: /users/me, /admin/users. Caching: private, no-store (personalized).
import { Router, type RequestHandler } from 'express';
import { NotFoundError, sendSuccess, UnauthorizedError } from '../../../core/exceptions';
import { createRateLimiter, requirePermissions, requireStaffOrAdmin } from '../../../core/security';
import type {
  AdminCreateUser,
  AdminListUsers,
  GetOwnProfile,
  UpdateOwnProfile,
} from '../application/user.use-cases';
import { adminCreateUserSchema, listUsersQuerySchema, updateOwnProfileSchema } from './validators';

export interface UsersRoutesDeps {
  getOwnProfile: GetOwnProfile;
  updateOwnProfile: UpdateOwnProfile;
  adminListUsers: AdminListUsers;
  adminCreateUser: AdminCreateUser;
  hashPassword: (plaintext: string) => Promise<string>;
  resolveRoleIdByName: (name: string) => Promise<string | null>;
  recordAudit: (input: {
    actorId: string | null;
    actorRole: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    after?: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
  }) => Promise<void>;
}

export function createUsersRoutes(deps: UsersRoutesDeps, authMiddleware: RequestHandler): Router {
  const router = Router();

  // Constructed here, not at module scope — see the note in auth.routes.ts.
  const standardLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 120,
    keyPrefix: 'users-standard',
  });

  // docs/08 §8 — "private, no-store (personalized)".
  router.use(standardLimiter, (_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    next();
  });

  // ---- Self-service surface: /users/me -------------------------------------------------------
  router.get(
    '/users/me',
    authMiddleware,
    requirePermissions('users.read_self'),
    (req, res, next) => {
      const userId = req.auth?.sub;
      if (!userId) {
        next(new UnauthorizedError('Authentication required'));
        return;
      }
      deps.getOwnProfile
        .execute(userId)
        .then((profile) => sendSuccess(req, res, 200, profile))
        .catch(next);
    },
  );

  router.patch(
    '/users/me',
    authMiddleware,
    requirePermissions('users.read_self'),
    (req, res, next) => {
      const userId = req.auth?.sub;
      if (!userId) {
        next(new UnauthorizedError('Authentication required'));
        return;
      }
      try {
        const body = updateOwnProfileSchema.parse(req.body);
        deps.updateOwnProfile
          .execute(userId, body)
          .then((profile) => sendSuccess(req, res, 200, profile))
          .catch(next);
      } catch (error) {
        next(error);
      }
    },
  );

  // ---- Admin surface: /admin/users -----------------------------------------------------------
  router.get(
    '/admin/users',
    authMiddleware,
    requireStaffOrAdmin(),
    requirePermissions('users.read'),
    (req, res, next) => {
      try {
        const query = listUsersQuerySchema.parse(req.query);
        deps.adminListUsers
          .execute(query.limit ?? 20)
          .then((users) => sendSuccess(req, res, 200, users))
          .catch(next);
      } catch (error) {
        next(error);
      }
    },
  );

  /**
   * POST /admin/users — the ONLY runtime path creating a STAFF/ADMIN account (ADR-0002 Option A).
   * Three gates in docs/08 §4.3's order, then an audit write per docs/08 §4.11.
   */
  router.post(
    '/admin/users',
    authMiddleware,
    requireStaffOrAdmin(),
    requirePermissions('users.write'),
    (req, res, next) => {
      void (async () => {
        try {
          const body = adminCreateUserSchema.parse(req.body);

          const roleId = await deps.resolveRoleIdByName(body.roleName);
          if (!roleId) {
            throw new NotFoundError(`Role ${body.roleName} not found`);
          }

          const created = await deps.adminCreateUser.execute({
            email: body.email,
            fullName: body.fullName,
            phone: body.phone ?? null,
            passwordHash: await deps.hashPassword(body.password),
            userType: body.userType,
            roleId,
          });

          // docs/08 §4.11 — every mutating STAFF/ADMIN request writes an audit entry. The `after`
          // snapshot is redacted by AuditLogger before storage (docs/03 §9.8.2).
          await deps.recordAudit({
            actorId: req.auth?.sub ?? null,
            actorRole: req.auth?.roleId ?? null,
            action: 'CREATE',
            entityType: 'users',
            entityId: created.id,
            after: { email: created.email, userType: created.userType, roleId: created.roleId },
            ipAddress: req.ip ?? null,
            userAgent: req.header('User-Agent') ?? null,
          });

          sendSuccess(req, res, 201, created);
        } catch (error) {
          next(error);
        }
      })();
    },
  );

  return router;
}
