import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../../../core/exceptions';
import { CrmUseCases } from '../../application/crm.use-cases';
import {
  createCustomerSchema,
  updateCustomerSchema,
  updatePipelineStageSchema,
  assignSalesRepSchema,
  convertLeadToProjectSchema,
  convertLeadToOrderSchema,
  recordLeadActivitySchema,
  trackLeadStatusTransitionSchema,
} from '../dto/crm.dto';
import { PipelineStageId } from '../../domain/crm.types';

interface AuthenticatedRequest extends Request {
  user?: { name?: string; email?: string } | undefined;
}

export class CrmController {
  constructor(private readonly useCases: CrmUseCases) {}

  // ---------------- Pipeline & KPIs ----------------

  getPipeline = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const repId = req.query.repId as string | undefined;
      const search = req.query.search as string | undefined;
      const pipeline = await this.useCases.getPipeline({
        ...(repId ? { repId } : {}),
        ...(search ? { search } : {}),
      });
      sendSuccess(req, res, 200, pipeline);
    } catch (error) {
      next(error);
    }
  };

  getCrmKpis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const kpis = await this.useCases.getCrmKpis();
      sendSuccess(req, res, 200, kpis);
    } catch (error) {
      next(error);
    }
  };

  updatePipelineStage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = updatePipelineStageSchema.parse(req.body);
      const performedBy =
        (req as AuthenticatedRequest).user?.name ||
        (req as AuthenticatedRequest).user?.email ||
        'Sales Manager';
      const updated = await this.useCases.updateLeadPipelineStage(
        req.params.id as string,
        parsedBody.stage as PipelineStageId,
        parsedBody.reason,
        performedBy,
      );
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  };

  // ---------------- Sales Team Management ----------------

  getSalesTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await this.useCases.getSalesTeam();
      sendSuccess(req, res, 200, team);
    } catch (error) {
      next(error);
    }
  };

  assignSalesRep = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = assignSalesRepSchema.parse(req.body);
      const performedBy =
        (req as AuthenticatedRequest).user?.name ||
        (req as AuthenticatedRequest).user?.email ||
        'Sales Manager';
      const updated = await this.useCases.assignSalesRep(
        req.params.id as string,
        parsedBody.repId,
        performedBy,
      );
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  };

  // ---------------- Customer 360 Dossier & Conversions ----------------

  getCustomerDossier = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dossier = await this.useCases.getCustomerDossier(req.params.id as string);
      res.status(200).json(dossier);
    } catch (error) {
      next(error);
    }
  };

  convertLeadToProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = convertLeadToProjectSchema.parse(req.body);
      const performedBy =
        (req as AuthenticatedRequest).user?.name ||
        (req as AuthenticatedRequest).user?.email ||
        'Sales Consultant';
      const result = await this.useCases.convertDealToProject(
        req.params.id as string,
        parsedBody,
        performedBy,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  convertLeadToOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = convertLeadToOrderSchema.parse(req.body);
      const performedBy =
        (req as AuthenticatedRequest).user?.name ||
        (req as AuthenticatedRequest).user?.email ||
        'Sales Consultant';
      const result = await this.useCases.convertDealToOrder(
        req.params.id as string,
        parsedBody,
        performedBy,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // ---------------- Customer Profile & Core CRUD ----------------

  getCustomerProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await this.useCases.getCustomerProfile(req.params.id as string);
      res.status(200).json(customer);
    } catch (error) {
      next(error);
    }
  };

  getCustomerProfileByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const customer = await this.useCases.getCustomerProfileByUserId(req.params.userId as string);
      res.status(200).json(customer);
    } catch (error) {
      next(error);
    }
  };

  createCustomerProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = createCustomerSchema.parse(req.body);
      const customer = await this.useCases.createCustomerProfile({
        ...(parsedBody.userId ? { userId: parsedBody.userId } : {}),
        customerCode: parsedBody.customerCode || `NFI-C-${Date.now().toString().slice(-6)}`,
        name: parsedBody.name,
        email: parsedBody.email,
        phone: parsedBody.phone,
        tags: parsedBody.tags || [],
        clientTier: parsedBody.clientTier || 'PROSPECT',
        ...(parsedBody.preferredStudio ? { preferredStudio: parsedBody.preferredStudio } : {}),
        ...(parsedBody.propertyDetails ? { propertyDetails: parsedBody.propertyDetails } : {}),
        estimatedDealValue: parsedBody.estimatedDealValue || 0,
        currentPipelineStage: parsedBody.currentPipelineStage || 'NEW_INQUIRY',
        ...(parsedBody.assignedRepId ? { assignedRepId: parsedBody.assignedRepId } : {}),
        ...(parsedBody.assignedRepName ? { assignedRepName: parsedBody.assignedRepName } : {}),
        lifetimeValue: 0,
        totalOrders: 0,
        totalDesignProjects: 0,
        ...(parsedBody.preferredContactChannel
          ? { preferredContactChannel: parsedBody.preferredContactChannel }
          : {}),
        ...(parsedBody.acquisitionSource
          ? { acquisitionSource: parsedBody.acquisitionSource }
          : {}),
        ...(parsedBody.notes ? { notes: parsedBody.notes } : {}),
      });
      res.status(201).json(customer);
    } catch (error) {
      next(error);
    }
  };

  updateCustomerProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = updateCustomerSchema.parse(req.body);
      const customer = await this.useCases.updateCustomerProfile(
        req.params.id as string,
        parsedBody,
      );
      res.status(200).json(customer);
    } catch (error) {
      next(error);
    }
  };

  recordLeadActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = recordLeadActivitySchema.parse(req.body);
      const activity = await this.useCases.recordLeadActivity({
        leadId: parsedBody.leadId,
        type: parsedBody.type,
        ...(parsedBody.direction ? { direction: parsedBody.direction } : {}),
        summary: parsedBody.summary,
        ...(parsedBody.outcome ? { outcome: parsedBody.outcome } : {}),
        performedBy:
          parsedBody.performedBy ||
          (req as AuthenticatedRequest).user?.name ||
          (req as AuthenticatedRequest).user?.email ||
          req.auth?.roleName ||
          'Concierge Consultant',
        ...(parsedBody.scheduledFollowUpAt
          ? { scheduledFollowUpAt: new Date(parsedBody.scheduledFollowUpAt) }
          : {}),
        ...(parsedBody.metadata ? { metadata: parsedBody.metadata } : {}),
      });
      res.status(201).json(activity);
    } catch (error) {
      next(error);
    }
  };

  getLeadActivities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const activities = await this.useCases.getLeadActivities(req.params.leadId as string);
      res.status(200).json(activities);
    } catch (error) {
      next(error);
    }
  };

  trackLeadStatusTransition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsedBody = trackLeadStatusTransitionSchema.parse(req.body);
      const transition = await this.useCases.trackLeadStatusTransition({
        leadId: parsedBody.leadId,
        fromStatus: parsedBody.fromStatus,
        toStatus: parsedBody.toStatus,
        changedBy:
          parsedBody.changedBy ||
          (req as AuthenticatedRequest).user?.name ||
          (req as AuthenticatedRequest).user?.email ||
          req.auth?.roleName ||
          'Concierge Consultant',
        ...(parsedBody.reason ? { reason: parsedBody.reason } : {}),
      });
      res.status(201).json(transition);
    } catch (error) {
      next(error);
    }
  };

  getLeadStatusHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await this.useCases.getLeadStatusHistory(req.params.leadId as string);
      res.status(200).json(history);
    } catch (error) {
      next(error);
    }
  };
}
