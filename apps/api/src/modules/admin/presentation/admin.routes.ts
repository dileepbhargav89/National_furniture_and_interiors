// Admin routes — docs/08_api_architecture.md §8's `admin` row:
//   Bearer required, STAFF/ADMIN userType only; entirely permission-key-gated with no public or
//   self-scoped surface at all. Resources: /admin/roles, /admin/permissions, /admin/audit-logs.
import { Router, type RequestHandler } from 'express';
import { sendSuccess } from '../../../core/exceptions';
import { createRateLimiter, requirePermissions, requireStaffOrAdmin } from '../../../core/security';
import type { ListAuditLogs, ListPermissions, ListRoles } from '../application/audit-logger';

export function createAdminRoutes(
  deps: { listRoles: ListRoles; listPermissions: ListPermissions; listAuditLogs: ListAuditLogs },
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  // Constructed here, not at module scope — see the note in auth.routes.ts.
  const standardLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 120,
    keyPrefix: 'admin-standard',
  });

  // Every admin route carries the same three gates, in docs/08 §4.3's order.
  router.use(standardLimiter, authMiddleware, requireStaffOrAdmin());

  router.get('/roles', requirePermissions('admin.manage_roles'), (req, res, next) => {
    deps.listRoles
      .execute()
      .then((roles) => sendSuccess(req, res, 200, roles))
      .catch(next);
  });

  router.get('/permissions', requirePermissions('admin.manage_roles'), (req, res, next) => {
    deps.listPermissions
      .execute()
      .then((permissions) => sendSuccess(req, res, 200, permissions))
      .catch(next);
  });

  router.get('/audit-logs', requirePermissions('admin.view_audit_log'), (req, res, next) => {
    const limit = Number(req.query.limit ?? 50);
    deps.listAuditLogs
      .execute(Number.isFinite(limit) ? limit : 50)
      .then((logs) => sendSuccess(req, res, 200, logs))
      .catch(next);
  });

  return router;
}
