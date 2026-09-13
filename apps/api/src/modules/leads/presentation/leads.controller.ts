import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../../core/exceptions';
import { SubmitLeadUseCase, ListLeadsUseCase, AssignLeadUseCase, UpdateLeadStatusUseCase } from '../application/leads.use-cases';
import { submitLeadSchema, listLeadsQuerySchema, assignLeadSchema, updateLeadStatusSchema } from './leads.schemas';

export interface LeadsControllerDeps {
  submitLeadUseCase: SubmitLeadUseCase;
  listLeadsUseCase: ListLeadsUseCase;
  assignLeadUseCase: AssignLeadUseCase;
  updateLeadStatusUseCase: UpdateLeadStatusUseCase;
}

export function createLeadsController(deps: LeadsControllerDeps) {
  return {
    async submitLead(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const body = submitLeadSchema.parse(req.body);
        const lead = await deps.submitLeadUseCase.execute(body);
        sendSuccess(req, res, 201, lead);
      } catch (error) {
        next(error);
      }
    },

    async listLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = listLeadsQuerySchema.parse(req.query);
        const result = await deps.listLeadsUseCase.execute(
          { status: query.status, priority: query.priority, assignedToId: query.assignedToId },
          query.limit,
          query.offset
        );
        sendSuccess(req, res, 200, result);
      } catch (error) {
        next(error);
      }
    },

    async assignLead(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id);
        const body = assignLeadSchema.parse(req.body);
        const lead = await deps.assignLeadUseCase.execute(id, body.assignedToId, body.expectedVersion);
        sendSuccess(req, res, 200, lead);
      } catch (error) {
        next(error);
      }
    },

    async updateLeadStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id);
        const body = updateLeadStatusSchema.parse(req.body);
        const lead = await deps.updateLeadStatusUseCase.execute(id, body.status, body.expectedVersion);
        sendSuccess(req, res, 200, lead);
      } catch (error) {
        next(error);
      }
    }
  };
}
