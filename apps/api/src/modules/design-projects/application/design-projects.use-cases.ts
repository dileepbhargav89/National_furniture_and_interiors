import {
  IDesignProjectRepository,
  IDesignProject,
  DesignProjectStage,
  DesignProjectType,
  IQuotationItem,
  ISiteInspectionReport,
  ISitePhotoStreamItem,
  ISnagChecklistItem,
  SiteWorkPhase,
  SnagSeverity,
  SnagStatus,
} from '../domain/design-projects.types';
import {
  DesignProjectNotFoundError,
  StateConflictError,
  ConcurrencyError,
} from './design-project.errors';
import { NotificationEventHub } from '../../notifications/infrastructure/services/notification-event-hub';

// Define valid transitions matching the state diagram in 02_enterprise_architecture.md §13
const VALID_TRANSITIONS: Record<DesignProjectStage, DesignProjectStage[]> = {
  [DesignProjectStage.LEAD_CAPTURED]: [DesignProjectStage.QUALIFIED],
  [DesignProjectStage.QUALIFIED]: [DesignProjectStage.CONSULTATION_SCHEDULED],
  [DesignProjectStage.CONSULTATION_SCHEDULED]: [DesignProjectStage.SITE_VISIT_COMPLETED],
  [DesignProjectStage.SITE_VISIT_COMPLETED]: [DesignProjectStage.PROPOSAL_IN_PROGRESS],
  [DesignProjectStage.PROPOSAL_IN_PROGRESS]: [DesignProjectStage.QUOTATION_SENT],
  [DesignProjectStage.QUOTATION_SENT]: [DesignProjectStage.CLIENT_REVIEW],
  [DesignProjectStage.CLIENT_REVIEW]: [
    DesignProjectStage.APPROVED,
    DesignProjectStage.REVISION,
    DesignProjectStage.LOST,
  ],
  [DesignProjectStage.REVISION]: [DesignProjectStage.PROPOSAL_IN_PROGRESS],
  [DesignProjectStage.APPROVED]: [DesignProjectStage.ADVANCE_PAYMENT_COLLECTED],
  [DesignProjectStage.ADVANCE_PAYMENT_COLLECTED]: [DesignProjectStage.PROCUREMENT],
  [DesignProjectStage.PROCUREMENT]: [DesignProjectStage.EXECUTION_IN_PROGRESS],
  [DesignProjectStage.EXECUTION_IN_PROGRESS]: [
    DesignProjectStage.MILESTONE_PAYMENT_COLLECTED,
    DesignProjectStage.QUALITY_CHECK,
  ],
  [DesignProjectStage.MILESTONE_PAYMENT_COLLECTED]: [DesignProjectStage.EXECUTION_IN_PROGRESS],
  [DesignProjectStage.QUALITY_CHECK]: [DesignProjectStage.HANDOVER],
  [DesignProjectStage.HANDOVER]: [DesignProjectStage.WARRANTY_AMC],
  [DesignProjectStage.WARRANTY_AMC]: [],
  [DesignProjectStage.LOST]: [],
};

export class CreateDesignProjectUseCase {
  constructor(private readonly repository: IDesignProjectRepository) {}

  async execute(params: {
    leadId?: string;
    customerId: string;
    projectType: DesignProjectType;
    assignedDesignerId?: string;
    budgetRange: { min: number; max: number };
    propertyAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
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
      stageHistory: [
        {
          stage: DesignProjectStage.LEAD_CAPTURED,
          changedAt: new Date(),
          changedBy: params.actorId,
          note: 'Project created',
        },
      ],
      createdBy: params.actorId,
      updatedBy: params.actorId,
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
      const hasApprovedQuotation = project.quotations.some((q) => q.approvedAt && q.eSignatureRef);
      if (!hasApprovedQuotation) {
        throw new Error('Cannot approve project without an e-signed quotation');
      }
    }

    const newHistory = [
      ...project.stageHistory,
      {
        stage: params.targetStage,
        changedAt: new Date(),
        changedBy: params.actorId,
        note: params.note,
      },
    ];

    try {
      const updated = await this.repository.update(
        params.projectId,
        {
          stage: params.targetStage,
          stageHistory: newHistory,
          updatedBy: params.actorId,
        },
        params.expectedVersion,
      );

      if (!updated) throw new DesignProjectNotFoundError(params.projectId);
      return updated;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('ConcurrencyError')) {
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
    financialBreakdown?:
      import('../domain/design-projects.types').IQuotationFinancialBreakdown | undefined;
    milestoneSchedule?:
      import('../domain/design-projects.types').IQuotationMilestoneScheduleItem[] | undefined;
  }): Promise<IDesignProject> {
    const project = await this.repository.findById(params.projectId);
    if (!project) throw new DesignProjectNotFoundError(params.projectId);

    if (
      project.stage !== DesignProjectStage.PROPOSAL_IN_PROGRESS &&
      project.stage !== DesignProjectStage.REVISION
    ) {
      throw new Error(`Cannot add quotation in current stage: ${project.stage}`);
    }

    const calculatedTotal = params.boqItems.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = params.financialBreakdown?.grandTotal ?? calculatedTotal;

    const newQuotationVersion = project.quotations.length + 1;
    const newQuotation: import('../domain/design-projects.types').IQuotation = {
      version: newQuotationVersion,
      boqItems: params.boqItems,
      totalAmount,
      ...(params.financialBreakdown ? { financialBreakdown: params.financialBreakdown } : {}),
      ...(params.milestoneSchedule ? { milestoneSchedule: params.milestoneSchedule } : {}),
      status: 'SENT',
      sentAt: new Date(),
      approvedAt: undefined,
      eSignatureRef: undefined,
      pdfUrl: `/api/v1/design-projects/${project._id || params.projectId}/quotations/${newQuotationVersion}/pdf`,
    };

    try {
      const updated = await this.repository.update(
        params.projectId,
        {
          quotations: [...project.quotations, newQuotation],
          updatedBy: params.actorId,
        },
        params.expectedVersion,
      );

      if (!updated) throw new DesignProjectNotFoundError(params.projectId);
      return updated;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('ConcurrencyError')) {
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

    const quotationIndex = project.quotations.findIndex(
      (q) => q.version === params.quotationVersion,
    );
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
      eSignatureRef: params.eSignatureRef,
    };
    if (targetQuotation._id !== undefined) updatedQuotation._id = targetQuotation._id;
    if (targetQuotation.sentAt !== undefined) updatedQuotation.sentAt = targetQuotation.sentAt;

    updatedQuotations[quotationIndex] = updatedQuotation;

    try {
      const updated = await this.repository.update(
        params.projectId,
        {
          quotations: updatedQuotations,
          updatedBy: params.actorId,
        },
        params.expectedVersion,
      );

      if (!updated) throw new DesignProjectNotFoundError(params.projectId);
      return updated;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('ConcurrencyError')) {
        throw new ConcurrencyError();
      }
      throw error;
    }
  }
}

export class ListDesignProjectsUseCase {
  constructor(private readonly repository: IDesignProjectRepository) {}

  async execute(
    filters?: { stage?: DesignProjectStage; assignedDesignerId?: string },
    limit: number = 10,
    skip: number = 0,
  ) {
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

export class RecordSiteInspectionUseCase {
  constructor(private readonly repository: IDesignProjectRepository) {}

  async execute(params: {
    projectId: string;
    expectedVersion: number;
    actorId: string;
    inspectionDate: string;
    inspectorName: string;
    inspectorRole: 'SITE_SUPERVISOR' | 'PROJECT_ENGINEER' | 'QUALITY_AUDITOR' | 'LEAD_ARCHITECT';
    currentPhase: SiteWorkPhase;
    workCompletedToday: string;
    manpowerCount: {
      carpenters: number;
      polishers: number;
      electricians: number;
      helpers: number;
    };
    materialDeliveriesVerified?: string[] | undefined;
    siteCleanlinessRating?: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'FAILED' | undefined;
    blockersOrDelays?: string | undefined;
    photos?: Omit<ISitePhotoStreamItem, 'id' | 'uploadedAt'>[] | undefined;
    snags?: Omit<ISnagChecklistItem, 'id' | 'reportedAt' | 'status'>[] | undefined;
  }): Promise<IDesignProject> {
    const project = await this.repository.findById(params.projectId);
    if (!project) throw new DesignProjectNotFoundError(params.projectId);

    const now = new Date();
    const inspectionId = `insp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newPhotos: ISitePhotoStreamItem[] = (params.photos || []).map((p, idx) => ({
      ...p,
      id: `photo_${Date.now()}_${idx}`,
      workPhase: p.workPhase as SiteWorkPhase,
      uploadedAt: now,
    }));

    const newSnags: ISnagChecklistItem[] = (params.snags || []).map((s, idx) => ({
      ...s,
      id: `snag_${Date.now()}_${idx}`,
      severity: s.severity as SnagSeverity,
      status: 'OPEN' as SnagStatus,
      reportedAt: now,
    }));

    const newReport: ISiteInspectionReport = {
      id: inspectionId,
      inspectionDate: new Date(params.inspectionDate),
      inspectorName: params.inspectorName,
      inspectorRole: params.inspectorRole,
      currentPhase: params.currentPhase,
      workCompletedToday: params.workCompletedToday,
      manpowerCount: params.manpowerCount,
      materialDeliveriesVerified: params.materialDeliveriesVerified || [],
      siteCleanlinessRating: params.siteCleanlinessRating || 'GOOD',
      blockersOrDelays: params.blockersOrDelays,
      photos: newPhotos,
      snagsLogged: newSnags,
      createdAt: now,
    };

    const updatedInspections = [newReport, ...(project.siteInspections || [])];
    const updatedPhotos = [...newPhotos, ...(project.sitePhotos || [])];
    const updatedSnags = [...newSnags, ...(project.snagItems || [])];

    try {
      const updated = await this.repository.update(
        params.projectId,
        {
          siteInspections: updatedInspections,
          sitePhotos: updatedPhotos,
          snagItems: updatedSnags,
          updatedBy: params.actorId,
        },
        params.expectedVersion,
      );

      if (!updated) throw new DesignProjectNotFoundError(params.projectId);
      return updated;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('ConcurrencyError')) {
        throw new ConcurrencyError();
      }
      throw error;
    }
  }
}

export class AddSitePhotoUseCase {
  constructor(private readonly repository: IDesignProjectRepository) {}

  async execute(params: {
    projectId: string;
    expectedVersion: number;
    actorId: string;
    url: string;
    thumbnailUrl?: string | undefined;
    roomName: string;
    caption: string;
    workPhase: SiteWorkPhase;
    uploadedBy: string;
    isClientVisible?: boolean | undefined;
    tags?: string[] | undefined;
  }): Promise<IDesignProject> {
    const project = await this.repository.findById(params.projectId);
    if (!project) throw new DesignProjectNotFoundError(params.projectId);

    const newPhoto: ISitePhotoStreamItem = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: params.url,
      thumbnailUrl: params.thumbnailUrl,
      roomName: params.roomName,
      caption: params.caption,
      workPhase: params.workPhase,
      uploadedBy: params.uploadedBy,
      uploadedAt: new Date(),
      isClientVisible: params.isClientVisible ?? true,
      tags: params.tags || [],
    };

    const updatedPhotos = [newPhoto, ...(project.sitePhotos || [])];

    try {
      const updated = await this.repository.update(
        params.projectId,
        {
          sitePhotos: updatedPhotos,
          updatedBy: params.actorId,
        },
        params.expectedVersion,
      );

      if (!updated) throw new DesignProjectNotFoundError(params.projectId);
      return updated;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('ConcurrencyError')) {
        throw new ConcurrencyError();
      }
      throw error;
    }
  }
}

export class LogSnagItemUseCase {
  constructor(private readonly repository: IDesignProjectRepository) {}

  async execute(params: {
    projectId: string;
    expectedVersion: number;
    actorId: string;
    title: string;
    roomName: string;
    description: string;
    severity: SnagSeverity;
    reportedBy: string;
    assignedTo?: string | undefined;
    beforePhotoUrl?: string | undefined;
  }): Promise<IDesignProject> {
    const project = await this.repository.findById(params.projectId);
    if (!project) throw new DesignProjectNotFoundError(params.projectId);

    const newSnag: ISnagChecklistItem = {
      id: `snag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: params.title,
      roomName: params.roomName,
      description: params.description,
      severity: params.severity,
      status: 'OPEN',
      reportedBy: params.reportedBy,
      assignedTo: params.assignedTo,
      reportedAt: new Date(),
      beforePhotoUrl: params.beforePhotoUrl,
    };

    const updatedSnags = [newSnag, ...(project.snagItems || [])];

    try {
      const updated = await this.repository.update(
        params.projectId,
        {
          snagItems: updatedSnags,
          updatedBy: params.actorId,
        },
        params.expectedVersion,
      );

      if (!updated) throw new DesignProjectNotFoundError(params.projectId);

      // Push real-time snag notification for critical / major site snags
      try {
        const isCritical = params.severity === 'CRITICAL';
        const eventHub = NotificationEventHub.getInstance();
        eventHub.broadcastToStaff('notification', {
          id: `snag-alert-${newSnag.id}`,
          type: 'SNAG_ALERT',
          title: `${isCritical ? 'Critical' : 'New'} Snag Logged: ${params.roomName}`,
          message: `${params.title} (${params.severity}) — Reported by ${params.reportedBy}`,
          priority: isCritical ? 'URGENT' : 'HIGH',
          channel: 'IN_APP',
          actionUrl: `/projects/${params.projectId}`,
          actionLabel: 'Inspect Snag',
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Safe fallback
      }

      return updated;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('ConcurrencyError')) {
        throw new ConcurrencyError();
      }
      throw error;
    }
  }
}

export class UpdateSnagStatusUseCase {
  constructor(private readonly repository: IDesignProjectRepository) {}

  async execute(params: {
    projectId: string;
    snagId: string;
    expectedVersion: number;
    actorId: string;
    status: SnagStatus;
    resolvedBy?: string | undefined;
    resolutionNote?: string | undefined;
    afterPhotoUrl?: string | undefined;
  }): Promise<IDesignProject> {
    const project = await this.repository.findById(params.projectId);
    if (!project) throw new DesignProjectNotFoundError(params.projectId);

    const snagList = project.snagItems || [];
    const snagIndex = snagList.findIndex((s) => s.id === params.snagId);
    if (snagIndex === -1) {
      throw new Error(
        `Snag item with id ${params.snagId} not found in project ${params.projectId}`,
      );
    }

    const currentSnag = snagList[snagIndex]!;
    const updatedSnag: ISnagChecklistItem = {
      ...currentSnag,
      status: params.status,
      resolvedBy: params.resolvedBy || currentSnag.resolvedBy,
      resolvedAt:
        params.status === 'RESOLVED' || params.status === 'CLIENT_VERIFIED'
          ? new Date()
          : currentSnag.resolvedAt,
      resolutionNote: params.resolutionNote || currentSnag.resolutionNote,
      afterPhotoUrl: params.afterPhotoUrl || currentSnag.afterPhotoUrl,
    };

    const updatedSnags = [...snagList];
    updatedSnags[snagIndex] = updatedSnag;

    try {
      const updated = await this.repository.update(
        params.projectId,
        {
          snagItems: updatedSnags,
          updatedBy: params.actorId,
        },
        params.expectedVersion,
      );

      if (!updated) throw new DesignProjectNotFoundError(params.projectId);
      return updated;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('ConcurrencyError')) {
        throw new ConcurrencyError();
      }
      throw error;
    }
  }
}
