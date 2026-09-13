import { IDesignProjectRepository, IDesignProject, DesignProjectStage, DesignProjectType, IQuotationItem } from '../domain/design-projects.types';
import { DesignProjectNotFoundError, StateConflictError, ConcurrencyError, AuthorizationError } from './design-project.errors';

// Define valid transitions matching the state diagram in 02_enterprise_architecture.md §13
const VALID_TRANSITIONS: Record<DesignProjectStage, DesignProjectStage[]> = {
  [DesignProjectStage.LEAD_CAPTURED]: [DesignProjectStage.QUALIFIED],
  [DesignProjectStage.QUALIFIED]: [DesignProjectStage.CONSULTATION_SCHEDULED],
  [DesignProjectStage.CONSULTATION_SCHEDULED]: [DesignProjectStage.SITE_VISIT_COMPLETED],
  [DesignProjectStage.SITE_VISIT_COMPLETED]: [DesignProjectStage.PROPOSAL_IN_PROGRESS],
  [DesignProjectStage.PROPOSAL_IN_PROGRESS]: [DesignProjectStage.QUOTATION_SENT],
  [DesignProjectStage.QUOTATION_SENT]: [DesignProjectStage.CLIENT_REVIEW],
  [DesignProjectStage.CLIENT_REVIEW]: [DesignProjectStage.APPROVED, DesignProjectStage.REVISION, DesignProjectStage.LOST],
  [DesignProjectStage.REVISION]: [DesignProjectStage.PROPOSAL_IN_PROGRESS],
  [DesignProjectStage.APPROVED]: [DesignProjectStage.ADVANCE_PAYMENT_COLLECTED],
  [DesignProjectStage.ADVANCE_PAYMENT_COLLECTED]: [DesignProjectStage.PROCUREMENT],
  [DesignProjectStage.PROCUREMENT]: [DesignProjectStage.EXECUTION_IN_PROGRESS],
  [DesignProjectStage.EXECUTION_IN_PROGRESS]: [DesignProjectStage.MILESTONE_PAYMENT_COLLECTED, DesignProjectStage.QUALITY_CHECK],
  [DesignProjectStage.MILESTONE_PAYMENT_COLLECTED]: [DesignProjectStage.EXECUTION_IN_PROGRESS],
  [DesignProjectStage.QUALITY_CHECK]: [DesignProjectStage.HANDOVER],
  [DesignProjectStage.HANDOVER]: [DesignProjectStage.WARRANTY_AMC],
  [DesignProjectStage.WARRANTY_AMC]: [],
  [DesignProjectStage.LOST]: []
};

export class CreateDesignProjectUseCase {
  constructor(private readonly repository: IDesignProjectRepository) {}

  async execute(params: {
    leadId?: string;
    customerId: string;
    projectType: DesignProjectType;
    assignedDesignerId?: string;
    budgetRange: { min: number; max: number };
    propertyAddress: { street: string; city: string; state: string; postalCode: string; country: string };
    propertyDetails: { areaSqft: number; rooms?: number; bhk?: number };
    actorId: string;
  }): Promise<IDesignProject> {
    const projectCode = `DP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    return this.repository.create({
      projectCode,
      leadId: params.leadId,
      customerId: params.customerId,
      projectType: params.projectType,
      stage: DesignProjectStage.LEAD_CAPTURED,
      assignedDesignerId: params.assignedDesignerId,
      budgetRange: params.budgetRange,
      propertyAddress: params.propertyAddress,
      propertyDetails: params.propertyDetails,
      quotations: [],
      milestones: [],
      stageHistory: [{
        stage: DesignProjectStage.LEAD_CAPTURED,
        changedAt: new Date(),
        changedBy: params.actorId,
        note: 'Project created'
      }],
      createdBy: params.actorId,
      updatedBy: params.actorId
    });
  }
}

export class AdvanceProjectStageUseCase {
  constructor(private readonly repository: IDesignProjectRepository) {}

  async execute(params: {
    projectId: string;
    targetStage: DesignProjectStage;
    expectedVersion: number;
    actorId: string;
    note?: string;
  }): Promise<IDesignProject> {
    const project = await this.repository.findById(params.projectId);
    if (!project) throw new DesignProjectNotFoundError(params.projectId);

    // Guard: State Machine Validation
    const allowedNextStages = VALID_TRANSITIONS[project.stage];
    if (!allowedNextStages.includes(params.targetStage)) {
      throw new StateConflictError(project.stage, params.targetStage);
    }

    // Additional Guards: Require at least one approved quotation with an eSignature
    if (params.targetStage === DesignProjectStage.APPROVED) {
      const hasApprovedQuotation = project.quotations.some(q => q.approvedAt && q.eSignatureRef);
      if (!hasApprovedQuotation) {
        throw new Error('Cannot approve project without an e-signed quotation');
      }
    }

    const newHistory = [...project.stageHistory, {
      stage: params.targetStage,
      changedAt: new Date(),
      changedBy: params.actorId,
      note: params.note
    }];

    try {
      const updated = await this.repository.update(params.projectId, {
        stage: params.targetStage,
        stageHistory: newHistory,
        updatedBy: params.actorId
      }, params.expectedVersion);

      if (!updated) throw new DesignProjectNotFoundError(params.projectId);
      return updated;
    } catch (error: any) {
      if (error.message.includes('ConcurrencyError')) {
        throw new ConcurrencyError();
      }
      throw error;
    }
  }
}

export class AddQuotationUseCase {
  constructor(private readonly repository: IDesignProjectRepository) {}

  async execute(params: {
    projectId: string;
    boqItems: IQuotationItem[];
    expectedVersion: number;
    actorId: string;
  }): Promise<IDesignProject> {
    const project = await this.repository.findById(params.projectId);
    if (!project) throw new DesignProjectNotFoundError(params.projectId);

    if (project.stage !== DesignProjectStage.PROPOSAL_IN_PROGRESS && project.stage !== DesignProjectStage.REVISION) {
      throw new Error(`Cannot add quotation in current stage: ${project.stage}`);
    }

    const totalAmount = params.boqItems.reduce((sum, item) => sum + item.total, 0);

    const newQuotation = {
      version: project.quotations.length + 1,
      boqItems: params.boqItems,
      totalAmount,
      sentAt: new Date(),
      approvedAt: undefined,
      eSignatureRef: undefined
    };

    try {
      const updated = await this.repository.update(params.projectId, {
        quotations: [...project.quotations, newQuotation],
        updatedBy: params.actorId
      }, params.expectedVersion);
      
      if (!updated) throw new DesignProjectNotFoundError(params.projectId);
      return updated;
    } catch (error: any) {
      if (error.message.includes('ConcurrencyError')) {
        throw new ConcurrencyError();
      }
      throw error;
    }
  }
}

export class ApproveQuotationUseCase {
  constructor(private readonly repository: IDesignProjectRepository) {}

  async execute(params: {
    projectId: string;
    quotationVersion: number;
    eSignatureRef: string;
    expectedVersion: number;
    actorId: string;
  }): Promise<IDesignProject> {
    const project = await this.repository.findById(params.projectId);
    if (!project) throw new DesignProjectNotFoundError(params.projectId);

    if (project.stage !== DesignProjectStage.CLIENT_REVIEW) {
      throw new Error(`Cannot approve quotation unless in CLIENT_REVIEW stage`);
    }

    const quotationIndex = project.quotations.findIndex(q => q.version === params.quotationVersion);
    const targetQuotation = project.quotations[quotationIndex];
    if (!targetQuotation) {
      throw new Error(`Quotation version ${params.quotationVersion} not found`);
    }

    if (targetQuotation.approvedAt) {
      throw new Error('Quotation is already approved');
    }

    const updatedQuotations = [...project.quotations];
    
    // Create new quotation explicitly handling optional _id for exactOptionalPropertyTypes
    const updatedQuotation: typeof targetQuotation = {
      version: targetQuotation.version,
      boqItems: targetQuotation.boqItems,
      totalAmount: targetQuotation.totalAmount,
      approvedAt: new Date(),
      eSignatureRef: params.eSignatureRef
    };
    if (targetQuotation._id !== undefined) updatedQuotation._id = targetQuotation._id;
    if (targetQuotation.sentAt !== undefined) updatedQuotation.sentAt = targetQuotation.sentAt;
    
    updatedQuotations[quotationIndex] = updatedQuotation;


    try {
      const updated = await this.repository.update(params.projectId, {
        quotations: updatedQuotations,
        updatedBy: params.actorId
      }, params.expectedVersion);
      
      if (!updated) throw new DesignProjectNotFoundError(params.projectId);
      return updated;
    } catch (error: any) {
      if (error.message.includes('ConcurrencyError')) {
        throw new ConcurrencyError();
      }
      throw error;
    }
  }
}

export class ListDesignProjectsUseCase {
  constructor(private readonly repository: IDesignProjectRepository) {}

  async execute(filters?: { stage?: DesignProjectStage; assignedDesignerId?: string }, limit: number = 10, skip: number = 0) {
    return this.repository.findAll(filters, limit, skip);
  }
}

export class GetDesignFunnelUseCase {
  constructor(private readonly repository: IDesignProjectRepository) {}

  async execute(startDate?: string, endDate?: string) {
    return this.repository.getFunnelMetrics(startDate, endDate);
  }
}

export class GetDesignProjectByIdUseCase {
  constructor(private readonly repository: IDesignProjectRepository) {}

  async execute(projectId: string): Promise<IDesignProject> {
    const project = await this.repository.findById(projectId);
    if (!project) throw new DesignProjectNotFoundError(projectId);
    return project;
  }
}
