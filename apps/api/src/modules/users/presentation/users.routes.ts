import { Router, type RequestHandler } from 'express';
import {
  ForbiddenError,
  NotFoundError,
  sendSuccess,
  UnauthorizedError,
} from '../../../core/exceptions';
import { createRateLimiter, requirePermissions, requireStaffOrAdmin } from '../../../core/security';
import type {
  AdminCreateUser,
  AdminGetUserDetail,
  AdminListUsers,
  AdminListUsersWithFilters,
  AdminOnboardUser,
  AdminResendOnboarding,
  AdminResetUserPassword,
  AdminUpdateUserStatus,
  GetOwnProfile,
  UpdateOwnProfile,
} from '../application/user.use-cases';
import {
  adminBulkOnboardSchema,
  adminCreateUserSchema,
  adminOnboardUserSchema,
  adminResetPasswordSchema,
  adminUpdateStatusSchema,
  listUsersQuerySchema,
  updateOwnProfileSchema,
} from './validators';

export interface UsersRoutesDeps {
  getOwnProfile: GetOwnProfile;
  updateOwnProfile: UpdateOwnProfile;
  adminListUsers: AdminListUsers;
  adminListUsersWithFilters: AdminListUsersWithFilters;
  adminGetUserDetail: AdminGetUserDetail;
  adminCreateUser: AdminCreateUser;
  adminOnboardUser: AdminOnboardUser;
  adminResendOnboarding: AdminResendOnboarding;
  adminResetUserPassword: AdminResetUserPassword;
  adminUpdateUserStatus: AdminUpdateUserStatus;
  hashPassword: (plaintext: string) => Promise<string>;
  listLeads?:
    | {
        execute(
          filters: Record<string, unknown>,
          limit?: number,
          offset?: number,
        ): Promise<{ leads: unknown[]; total: number }>;
      }
    | undefined;
  resolveRoleIdByName: (name: string) => Promise<string | null>;
  resolveRoleNameById?: ((id: string) => Promise<string | null>) | undefined;
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

  const standardLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 120,
    keyPrefix: 'users-standard',
  });

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

  // Non-registered users / leads endpoint
  router.get(
    '/admin/users/non-registered',
    authMiddleware,
    requireStaffOrAdmin(),
    requirePermissions('users.read'),
    (req, res, next) => {
      void (async () => {
        try {
          if (deps.listLeads) {
            const leadsResult = await deps.listLeads.execute({}, 50, 0);
            const rawLeads = leadsResult.leads as Array<{
              id: string;
              name: string;
              email?: string;
              phone: string;
              source: string;
              interestType: string;
              projectType?: string;
              budgetRange?: { min: number; max: number };
              score: number;
              priority: 'HOT' | 'WARM' | 'COLD';
              status: string;
              createdAt: Date;
            }>;
            sendSuccess(req, res, 200, { items: rawLeads, total: leadsResult.total });
          } else {
            sendSuccess(req, res, 200, { items: [], total: 0 });
          }
        } catch (error) {
          next(error);
        }
      })();
    },
  );

  // List users (with pagination, search, and type filters)
  router.get(
    '/admin/users',
    authMiddleware,
    requireStaffOrAdmin(),
    requirePermissions('users.read'),
    (req, res, next) => {
      try {
        const query = listUsersQuerySchema.parse(req.query);
        if (query.search || query.userType || query.status || query.page) {
          deps.adminListUsersWithFilters
            .execute({
              ...(query.search ? { search: query.search } : {}),
              ...(query.userType ? { userType: query.userType } : {}),
              ...(query.status ? { status: query.status } : {}),
              ...(query.page ? { page: query.page } : {}),
              ...(query.limit ? { limit: query.limit } : {}),
            })
            .then((result) => sendSuccess(req, res, 200, result))
            .catch(next);
        } else {
          deps.adminListUsers
            .execute(query.limit ?? 50)
            .then((users) => sendSuccess(req, res, 200, { items: users, total: users.length }))
            .catch(next);
        }
      } catch (error) {
        next(error);
      }
    },
  );

  // Single User Dossier
  router.get(
    '/admin/users/:id',
    authMiddleware,
    requireStaffOrAdmin(),
    requirePermissions('users.read'),
    (req, res, next) => {
      deps.adminGetUserDetail
        .execute(req.params['id'] as string)
        .then((dossier) => sendSuccess(req, res, 200, dossier))
        .catch(next);
    },
  );

  // Create privileged account (STAFF / ADMIN)
  router.post(
    '/admin/users',
    authMiddleware,
    requireStaffOrAdmin(),
    requirePermissions('users.write'),
    (req, res, next) => {
      void (async () => {
        try {
          const body = adminCreateUserSchema.parse(req.body);

          if (body.roleName === 'SUPER_ADMIN' && req.auth?.roleName !== 'SUPER_ADMIN') {
            throw new ForbiddenError(
              'Access Denied: Only a Super Administrator can provision Super Administrator accounts.',
            );
          }

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

  // Single User Onboarding
  router.post(
    '/admin/users/onboard',
    authMiddleware,
    requireStaffOrAdmin(),
    requirePermissions('users.write'),
    (req, res, next) => {
      void (async () => {
        try {
          const body = adminOnboardUserSchema.parse(req.body);

          if (body.roleName === 'SUPER_ADMIN' && req.auth?.roleName !== 'SUPER_ADMIN') {
            throw new ForbiddenError(
              'Access Denied: Only a Super Administrator can provision Super Administrator accounts.',
            );
          }

          let roleId = await deps.resolveRoleIdByName(body.roleName);
          if (!roleId) {
            roleId = (await deps.resolveRoleIdByName('CUSTOMER')) || '6aa05745ad65cf3101da30f0';
          }

          const created = await deps.adminOnboardUser.execute({
            email: body.email,
            ...(body.fullName ? { fullName: body.fullName } : {}),
            phone: body.phone ?? null,
            userType: body.userType,
            roleId,
            companyName: body.companyName ?? null,
            gstin: body.gstin ?? null,
            ...(body.temporaryPassword ? { temporaryPassword: body.temporaryPassword } : {}),
            sendInvite: body.sendInvite,
          });

          await deps.recordAudit({
            actorId: req.auth?.sub ?? null,
            actorRole: req.auth?.roleId ?? null,
            action: 'USER_ONBOARDED',
            entityType: 'users',
            entityId: created.id,
            after: {
              email: created.email,
              userType: created.userType,
              sendInvite: body.sendInvite,
            },
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

  // Bulk Onboarding
  router.post(
    '/admin/users/bulk-onboard',
    authMiddleware,
    requireStaffOrAdmin(),
    requirePermissions('users.write'),
    (req, res, next) => {
      void (async () => {
        try {
          const body = adminBulkOnboardSchema.parse(req.body);
          const results = [];
          const errors = [];

          const customerRoleId =
            (await deps.resolveRoleIdByName('CUSTOMER')) || '6aa05745ad65cf3101da30f0';

          for (const item of body.users) {
            try {
              const onboarded = await deps.adminOnboardUser.execute({
                email: item.email,
                ...(item.fullName ? { fullName: item.fullName } : {}),
                phone: item.phone ?? null,
                userType: item.userType,
                roleId: customerRoleId,
                companyName: item.companyName ?? null,
                gstin: item.gstin ?? null,
                sendInvite: true,
              });
              results.push(onboarded);
            } catch (err: unknown) {
              errors.push({
                email: item.email,
                error: err instanceof Error ? err.message : 'Failed',
              });
            }
          }

          await deps.recordAudit({
            actorId: req.auth?.sub ?? null,
            actorRole: req.auth?.roleId ?? null,
            action: 'USERS_BULK_ONBOARDED',
            entityType: 'users',
            entityId: null,
            after: {
              totalRequested: body.users.length,
              successCount: results.length,
              errorCount: errors.length,
            },
            ipAddress: req.ip ?? null,
            userAgent: req.header('User-Agent') ?? null,
          });

          sendSuccess(req, res, 200, {
            success: true,
            totalRequested: body.users.length,
            successCount: results.length,
            errorCount: errors.length,
            created: results,
            errors,
          });
        } catch (error) {
          next(error);
        }
      })();
    },
  );

  // Resend Onboarding Invite
  router.post(
    '/admin/users/:id/resend-onboarding',
    authMiddleware,
    requireStaffOrAdmin(),
    requirePermissions('users.write'),
    (req, res, next) => {
      void (async () => {
        try {
          const userId = req.params['id'] as string;

          const targetUser = await deps.adminGetUserDetail.execute(userId);
          const targetRoleName =
            targetUser.roleId && deps.resolveRoleNameById
              ? await deps.resolveRoleNameById(targetUser.roleId)
              : null;
          const isTargetSuperAdmin =
            targetRoleName === 'SUPER_ADMIN' || targetUser.userType === 'SUPER_ADMIN';
          const isActorSuperAdmin = req.auth?.roleName === 'SUPER_ADMIN';

          if (isTargetSuperAdmin && !isActorSuperAdmin) {
            throw new ForbiddenError(
              'Access Denied: Only a Super Administrator can resend onboarding for Super Administrator accounts.',
            );
          }

          const result = await deps.adminResendOnboarding.execute(userId);

          await deps.recordAudit({
            actorId: req.auth?.sub ?? null,
            actorRole: req.auth?.roleId ?? null,
            action: 'USER_ONBOARDING_RESENT',
            entityType: 'users',
            entityId: userId,
            ipAddress: req.ip ?? null,
            userAgent: req.header('User-Agent') ?? null,
          });

          sendSuccess(req, res, 200, result);
        } catch (error) {
          next(error);
        }
      })();
    },
  );

  // Admin Reset User Password
  router.post(
    '/admin/users/:id/reset-password',
    authMiddleware,
    requireStaffOrAdmin(),
    requirePermissions('users.write'),
    (req, res, next) => {
      void (async () => {
        try {
          const userId = req.params['id'] as string;

          const targetUser = await deps.adminGetUserDetail.execute(userId);
          const targetRoleName =
            targetUser.roleId && deps.resolveRoleNameById
              ? await deps.resolveRoleNameById(targetUser.roleId)
              : null;
          const isTargetSuperAdmin =
            targetRoleName === 'SUPER_ADMIN' || targetUser.userType === 'SUPER_ADMIN';
          const isActorSuperAdmin = req.auth?.roleName === 'SUPER_ADMIN';

          // Hierarchy Rule 1: Only a Super Admin can reset a Super Admin's password!
          if (isTargetSuperAdmin && !isActorSuperAdmin) {
            throw new ForbiddenError(
              'Access Denied: Only a Super Administrator can reset passwords for Super Administrator accounts.',
            );
          }

          // Hierarchy Rule 2: An Admin cannot reset another Admin's password unless they are Super Admin or self
          const isTargetAdmin = targetRoleName === 'ADMIN' || targetUser.userType === 'ADMIN';
          if (isTargetAdmin && !isActorSuperAdmin && req.auth?.sub !== userId) {
            throw new ForbiddenError(
              'Access Denied: Only a Super Administrator can reset credentials for Administrator accounts.',
            );
          }

          const body = adminResetPasswordSchema.parse(req.body);
          const newPassword =
            body.newPassword ||
            `Nfi#${Math.random().toString(36).slice(2, 8)}!${Math.floor(Math.random() * 89 + 10)}`;

          const result = await deps.adminResetUserPassword.execute(
            userId,
            newPassword,
            body.mustChangePassword,
          );

          await deps.recordAudit({
            actorId: req.auth?.sub ?? null,
            actorRole: req.auth?.roleId ?? null,
            action: 'USER_PASSWORD_RESET',
            entityType: 'users',
            entityId: userId,
            after: {
              sendEmailLink: body.sendEmailLink,
              mustChangePassword: body.mustChangePassword,
            },
            ipAddress: req.ip ?? null,
            userAgent: req.header('User-Agent') ?? null,
          });

          sendSuccess(req, res, 200, {
            ...result,
            temporaryPassword: body.newPassword ? undefined : newPassword,
          });
        } catch (error) {
          next(error);
        }
      })();
    },
  );

  // Update User Status (ACTIVE, SUSPENDED, BANNED)
  router.patch(
    '/admin/users/:id/status',
    authMiddleware,
    requireStaffOrAdmin(),
    requirePermissions('users.write'),
    (req, res, next) => {
      void (async () => {
        try {
          const userId = req.params['id'] as string;
          const body = adminUpdateStatusSchema.parse(req.body);

          const targetUser = await deps.adminGetUserDetail.execute(userId);
          const targetRoleName =
            targetUser.roleId && deps.resolveRoleNameById
              ? await deps.resolveRoleNameById(targetUser.roleId)
              : null;
          const isTargetSuperAdmin =
            targetRoleName === 'SUPER_ADMIN' || targetUser.userType === 'SUPER_ADMIN';
          const isTargetAdmin = targetRoleName === 'ADMIN' || targetUser.userType === 'ADMIN';
          const isActorSuperAdmin = req.auth?.roleName === 'SUPER_ADMIN';

          // Hierarchy Rule 1: A Super Admin cannot be suspended by a non-Super Admin
          if (isTargetSuperAdmin && !isActorSuperAdmin) {
            throw new ForbiddenError(
              'Access Denied: Super Administrator accounts cannot be modified or suspended by non-Super Administrators.',
            );
          }

          // Hierarchy Rule 2: Super Admin accounts are permanent and cannot be suspended or deactivated
          if (isTargetSuperAdmin && body.status !== 'ACTIVE') {
            throw new ForbiddenError(
              'Access Denied: Super Administrator accounts are permanent and cannot be deactivated or suspended.',
            );
          }

          // Hierarchy Rule 3: Only a Super Administrator can alter the status of an Administrator account
          if (isTargetAdmin && !isActorSuperAdmin) {
            throw new ForbiddenError(
              'Access Denied: Only a Super Administrator can alter the status of an Administrator account.',
            );
          }

          const updated = await deps.adminUpdateUserStatus.execute(userId, body.status);

          await deps.recordAudit({
            actorId: req.auth?.sub ?? null,
            actorRole: req.auth?.roleId ?? null,
            action: 'USER_STATUS_UPDATED',
            entityType: 'users',
            entityId: userId,
            after: { status: body.status },
            ipAddress: req.ip ?? null,
            userAgent: req.header('User-Agent') ?? null,
          });

          sendSuccess(req, res, 200, updated);
        } catch (error) {
          next(error);
        }
      })();
    },
  );

  return router;
}
