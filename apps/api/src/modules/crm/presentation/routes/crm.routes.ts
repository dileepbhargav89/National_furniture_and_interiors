import { Router } from 'express';
import { CrmController } from '../controllers/crm.controller';

export function createCrmRoutes(
  controller: CrmController,
  authMiddleware: any,
  rbacMiddleware: any
): Router {
  const router = Router();

  router.use(authMiddleware);

  // Executive KPIs & Visual Kanban Pipeline
  router.get('/pipeline', rbacMiddleware('crm.read'), controller.getPipeline);
  router.get('/kpis', rbacMiddleware('crm.read'), controller.getCrmKpis);
  router.patch('/deals/:id/stage', rbacMiddleware('crm.write'), controller.updatePipelineStage);

  // Sales Team & Workload Allocation
  router.get('/sales-team', rbacMiddleware('crm.read'), controller.getSalesTeam);
  router.post('/deals/:id/assign', rbacMiddleware('crm.write'), controller.assignSalesRep);

  // Customer 360 Dossier & Conversions
  router.get('/customers/:id/dossier', rbacMiddleware('crm.read'), controller.getCustomerDossier);
  router.post('/deals/:id/convert-project', rbacMiddleware('crm.write'), controller.convertLeadToProject);
  router.post('/deals/:id/convert-order', rbacMiddleware('crm.write'), controller.convertLeadToOrder);

  // Standard Customer Management
  router.post('/customers', rbacMiddleware('crm.write'), controller.createCustomerProfile);
  router.get('/customers/:id', rbacMiddleware('crm.read'), controller.getCustomerProfile);
  router.patch('/customers/:id', rbacMiddleware('crm.write'), controller.updateCustomerProfile);
  router.get('/customers/user/:userId', rbacMiddleware('crm.read'), controller.getCustomerProfileByUserId);
  
  // Activities & Transitions
  router.post('/lead-activities', rbacMiddleware('crm.write'), controller.recordLeadActivity);
  router.get('/lead-activities/:leadId', rbacMiddleware('crm.read'), controller.getLeadActivities);

  router.post('/lead-status-history', rbacMiddleware('crm.write'), controller.trackLeadStatusTransition);
  router.get('/lead-status-history/:leadId', rbacMiddleware('crm.read'), controller.getLeadStatusHistory);

  return router;
}

