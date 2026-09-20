export enum DesignProjectType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  MODULAR_KITCHEN = 'MODULAR_KITCHEN',
  BEDROOM = 'BEDROOM',
  LIVING_ROOM = 'LIVING_ROOM',
  HOTEL = 'HOTEL',
  RESTAURANT = 'RESTAURANT',
  INSTITUTION = 'INSTITUTION',
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
  LOST = 'LOST',
}

export enum MilestoneStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export interface IQuotationDimensions {
  widthFt?: number | undefined;
  heightFt?: number | undefined;
  depthFt?: number | undefined;
  areaSqft?: number | undefined;
  rft?: number | undefined;
}

export interface IQuotationFinancialBreakdown {
  baseJoineryAmount: number; // in paise
  hardwareAmount: number; // in paise
  finishingPolishAmount?: number | undefined; // in paise
  designFeePercent: number; // e.g. 10 for 10%
  designFeeAmount: number; // in paise
  gstRate: number; // e.g. 18 for 18%
  gstAmount: number; // in paise
  grandTotal: number; // in paise
}

export interface IQuotationMilestoneScheduleItem {
  stageName: string;
  percentage: number;
  amount: number; // in paise
  dueTrigger: string;
}

export interface IQuotationItem {
  description: string;
  quantity: number;
  unitPrice: number; // paise
  total: number; // paise
  id?: string | undefined;
  roomName?: string | undefined;
  category?: string | undefined;
  dimensions?: IQuotationDimensions | undefined;
  coreMaterial?: string | undefined;
  finish?: string | undefined;
  hardwareBrand?: string | undefined;
  hardwareDetails?: string | undefined;
  ratePerUnit?: number | undefined;
  hardwareAddonPaise?: number | undefined;
  notes?: string | undefined;
}

export interface IQuotation {
  _id?: string;
  version: number;
  boqItems: IQuotationItem[];
  totalAmount: number; // paise
  financialBreakdown?: IQuotationFinancialBreakdown | undefined;
  milestoneSchedule?: IQuotationMilestoneScheduleItem[] | undefined;
  status?: string | undefined;
  sentAt?: Date | undefined;
  approvedAt?: Date | undefined;
  eSignatureRef?: string | undefined;
  pdfUrl?: string | undefined;
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

export type SiteWorkPhase =
  | 'CIVIL_DEMOLITION'
  | 'ELECTRICAL_PLUMBING'
  | 'CARPENTRY_CARCASES'
  | 'VENEER_PRESSING'
  | 'POP_FALSE_CEILING'
  | 'PU_POLISH_PAINTING'
  | 'HARDWARE_COUNTERTOP'
  | 'DEEP_CLEANING_SNAGGING'
  | 'HANDOVER_READY';

export type SnagSeverity = 'CRITICAL' | 'MODERATE' | 'COSMETIC';
export type SnagStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLIENT_VERIFIED';

export interface ISitePhotoStreamItem {
  id: string;
  url: string;
  thumbnailUrl?: string | undefined;
  roomName: string;
  caption: string;
  workPhase: SiteWorkPhase;
  uploadedBy: string;
  uploadedAt: Date;
  isClientVisible: boolean;
  tags?: string[] | undefined;
}

export interface ISnagChecklistItem {
  id: string;
  title: string;
  roomName: string;
  description: string;
  severity: SnagSeverity;
  status: SnagStatus;
  reportedBy: string;
  assignedTo?: string | undefined;
  reportedAt: Date;
  resolvedAt?: Date | undefined;
  resolvedBy?: string | undefined;
  resolutionNote?: string | undefined;
  beforePhotoUrl?: string | undefined;
  afterPhotoUrl?: string | undefined;
}

export interface ISiteInspectionReport {
  id: string;
  inspectionDate: Date;
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
  materialDeliveriesVerified: string[];
  siteCleanlinessRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'FAILED';
  blockersOrDelays?: string | undefined;
  photos?: ISitePhotoStreamItem[] | undefined;
  snagsLogged?: ISnagChecklistItem[] | undefined;
  createdAt: Date;
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
  siteInspections?: ISiteInspectionReport[] | undefined;
  sitePhotos?: ISitePhotoStreamItem[] | undefined;
  snagItems?: ISnagChecklistItem[] | undefined;

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
  create(
    project: Omit<IDesignProject, '_id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version'>,
  ): Promise<IDesignProject>;
  findById(id: string): Promise<IDesignProject | null>;
  findByProjectCode(code: string): Promise<IDesignProject | null>;
  findAll(
    filters?: { stage?: DesignProjectStage; assignedDesignerId?: string },
    limit?: number,
    skip?: number,
  ): Promise<{ items: IDesignProject[]; total: number }>;
  update(
    id: string,
    updates: Partial<IDesignProject>,
    expectedVersion?: number,
  ): Promise<IDesignProject | null>;
  getFunnelMetrics(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalProjects: number;
    inConsultation: number;
    quotationSent: number;
    inProgress: number;
    completed: number;
  }>;
}
