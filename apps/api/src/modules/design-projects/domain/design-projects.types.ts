export enum DesignProjectType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  MODULAR_KITCHEN = 'MODULAR_KITCHEN',
  BEDROOM = 'BEDROOM',
  LIVING_ROOM = 'LIVING_ROOM',
  HOTEL = 'HOTEL',
  RESTAURANT = 'RESTAURANT',
  INSTITUTION = 'INSTITUTION'
}

export enum DesignProjectStage {
  LEAD_CAPTURED = 'LEAD_CAPTURED',
  QUALIFIED = 'QUALIFIED',
  CONSULTATION_SCHEDULED = 'CONSULTATION_SCHEDULED',
  SITE_VISIT_COMPLETED = 'SITE_VISIT_COMPLETED',
  PROPOSAL_IN_PROGRESS = 'PROPOSAL_IN_PROGRESS',
  QUOTATION_SENT = 'QUOTATION_SENT',
  CLIENT_REVIEW = 'CLIENT_REVIEW',
  REVISION = 'REVISION',
  APPROVED = 'APPROVED',
  ADVANCE_PAYMENT_COLLECTED = 'ADVANCE_PAYMENT_COLLECTED',
  PROCUREMENT = 'PROCUREMENT',
  EXECUTION_IN_PROGRESS = 'EXECUTION_IN_PROGRESS',
  MILESTONE_PAYMENT_COLLECTED = 'MILESTONE_PAYMENT_COLLECTED',
  QUALITY_CHECK = 'QUALITY_CHECK',
  HANDOVER = 'HANDOVER',
  WARRANTY_AMC = 'WARRANTY_AMC',
  LOST = 'LOST'
}

export enum MilestoneStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

export interface IQuotationItem {
  description: string;
  quantity: number;
  unitPrice: number; // paise
  total: number; // paise
}

export interface IQuotation {
  _id?: string;
  version: number;
  boqItems: IQuotationItem[];
  totalAmount: number; // paise
  sentAt?: Date | undefined;
  approvedAt?: Date | undefined;
  eSignatureRef?: string | undefined;
}

export interface IMilestone {
  _id?: string;
  name: string;
  amount: number; // paise
  dueDate: Date;
  status: MilestoneStatus;
  paymentId?: string | undefined;
}

export interface IStageHistoryEvent {
  stage: DesignProjectStage;
  changedAt: Date;
  changedBy: string; // ObjectId
  note?: string | undefined;
}

export interface IDesignProject {
  _id?: string;
  projectCode: string;
  leadId?: string | undefined;
  customerId: string;
  projectType: DesignProjectType;
  stage: DesignProjectStage;
  assignedDesignerId?: string | undefined;
  budgetRange: {
    min: number; // paise
    max: number; // paise
  };
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  propertyDetails: {
    areaSqft: number;
    rooms?: number | undefined;
    bhk?: number | undefined;
  };
  quotations: IQuotation[];
  milestones: IMilestone[];
  stageHistory: IStageHistoryEvent[];
  
  // Audit fields
  version: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | undefined;
  updatedBy?: string | undefined;
  deletedAt?: Date | undefined;
  deletedBy?: string | undefined;
}

export interface IDesignProjectRepository {
  create(project: Omit<IDesignProject, '_id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version'>): Promise<IDesignProject>;
  findById(id: string): Promise<IDesignProject | null>;
  findByProjectCode(code: string): Promise<IDesignProject | null>;
  findAll(filters?: { stage?: DesignProjectStage; assignedDesignerId?: string }, limit?: number, skip?: number): Promise<{ items: IDesignProject[], total: number }>;
  update(id: string, updates: Partial<IDesignProject>, expectedVersion?: number): Promise<IDesignProject | null>;
  getFunnelMetrics(startDate?: string, endDate?: string): Promise<{
    totalProjects: number;
    inConsultation: number;
    quotationSent: number;
    inProgress: number;
    completed: number;
  }>;
}
