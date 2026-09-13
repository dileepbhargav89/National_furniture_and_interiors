import { Router, RequestHandler } from 'express';
import { createRateLimiter } from '../../../core/security';
import { DesignProjectsController } from './design-projects.controller';

export function createDesignProjectsRouter(
  controller: DesignProjectsController,
  authMiddleware: RequestHandler,
  requirePermission: (permission: string) => RequestHandler
): Router {
  const router = Router();

  const standardLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 120,
    keyPrefix: 'design-projects'
  });

  router.use(standardLimiter);

  // ── Public Portfolio Endpoints (No Auth Required) ─────────────────────────
  router.get('/portfolio', controller.listPortfolio);
  router.get('/portfolio/:slug', controller.getPortfolioBySlug);

  // ── Admin Portfolio Endpoints (Auth + Permissions Required) ───────────────
  router.get(
    '/admin/portfolio',
    authMiddleware,
    requirePermission('design_projects.read'),
    controller.adminListPortfolio
  );

  router.post(
    '/admin/portfolio',
    authMiddleware,
    requirePermission('design_projects.write'),
    controller.adminCreatePortfolio
  );

  router.put(
    '/admin/portfolio/:id',
    authMiddleware,
    requirePermission('design_projects.write'),
    controller.adminUpdatePortfolio
  );

  router.patch(
    '/admin/portfolio/:id',
    authMiddleware,
    requirePermission('design_projects.write'),
    controller.adminUpdatePortfolio
  );

  router.delete(
    '/admin/portfolio/:id',
    authMiddleware,
    requirePermission('design_projects.write'),
    controller.adminDeletePortfolio
  );

  router.post(
    '/admin/portfolio/seed',
    authMiddleware,
    requirePermission('design_projects.write'),
    controller.adminSeedPortfolio
  );

  // ── Client Design Pipeline Endpoints (Auth Required) ──────────────────────
  router.get(
    '/',
    authMiddleware,
    requirePermission('design_projects.read'),
    controller.listDesignProjects
  );

  router.get(
    '/metrics/funnel',
    authMiddleware,
    requirePermission('design_projects.read'),
    controller.getFunnelMetrics
  );

  router.get(
    '/:id',
    authMiddleware,
    requirePermission('design_projects.read'),
    controller.getDesignProjectById
  );

  router.post(
    '/',
    authMiddleware,
    requirePermission('design_projects.write'),
    controller.createDesignProject
  );

  router.patch(
    '/:id/stage',
    authMiddleware,
    requirePermission('design_projects.write'),
    controller.advanceProjectStage
  );

  router.post(
    '/:id/quotations',
    authMiddleware,
    requirePermission('design_projects.write'),
    controller.addQuotation
  );

  router.patch(
    '/:id/quotations/:qid/approve',
    authMiddleware,
    requirePermission('design_projects.write'),
    controller.approveQuotation
  );

  return router;
}
