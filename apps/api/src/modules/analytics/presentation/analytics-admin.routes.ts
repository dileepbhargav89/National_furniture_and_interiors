import { Router } from 'express';
import { AnalyticsAdminController } from './analytics-admin.controller';
import { requirePermissions } from '../../../core/security/rbac.middleware';

export function createAnalyticsAdminRouter(controller: AnalyticsAdminController): Router {
  const router = Router();

  // All analytics routes require 'analytics.read' permission
  router.use(requirePermissions('analytics.read'));

  router.get(
    '/leads-funnel',
    controller.getLeadsFunnel
  );

  router.get(
    '/design-funnel',
    controller.getDesignFunnel
  );

  router.get(
    '/sales',
    controller.getSalesMetrics
  );

  router.get(
    '/dashboard-summary',
    controller.getDashboardSummary
  );

  router.get(
    '/executive-kpis',
    controller.getExecutiveKPIs
  );

  router.get(
    '/revenue-trends',
    controller.getRevenueTrends
  );

  router.get(
    '/customer-cohorts',
    controller.getCustomerCohorts
  );

  router.get(
    '/category-performance',
    controller.getCategoryPerformance
  );

  return router;
}
