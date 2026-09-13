import { Router } from 'express';
import { createRateLimiter } from '../../../core/security';
import type { RequestHandler } from 'express';
import type { createLeadsController } from './leads.controller';

export function createLeadsRoutes(
  controller: ReturnType<typeof createLeadsController>,
  authMiddleware: RequestHandler,
  requirePermission: (permission: string) => RequestHandler
): Router {
  const router = Router();

  const publicLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 10, // Strict limit for public lead submissions (bot flood protection)
    keyPrefix: 'leads-public',
  });

  const adminLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 120, // Standard limit for authenticated admin endpoints
    keyPrefix: 'leads-admin',
  });

  // Public endpoint
  router.post('/leads', publicLimiter, controller.submitLead);

  // Admin endpoints
  router.get('/admin/leads', adminLimiter, authMiddleware, requirePermission('leads.read'), controller.listLeads);
  router.patch('/admin/leads/:id/assign', adminLimiter, authMiddleware, requirePermission('leads.write'), controller.assignLead);
  router.patch('/admin/leads/:id/status', adminLimiter, authMiddleware, requirePermission('leads.write'), controller.updateLeadStatus);

  return router;
}
