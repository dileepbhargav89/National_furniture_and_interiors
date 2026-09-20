import { apiClient } from './client';

// ── Domain Types ─────────────────────────────────────────────────────────────

export type DesignProjectType =
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'MODULAR_KITCHEN'
  | 'BEDROOM'
  | 'LIVING_ROOM'
  | 'HOTEL'
  | 'RESTAURANT'
  | 'INSTITUTION';

export type DesignProjectStage =
  | 'LEAD_CAPTURED'
  | 'QUALIFIED'
  | 'CONSULTATION_SCHEDULED'
  | 'SITE_VISIT_COMPLETED'
  | 'PROPOSAL_IN_PROGRESS'
  | 'QUOTATION_SENT'
  | 'CLIENT_REVIEW'
  | 'REVISION'
  | 'APPROVED'
  | 'ADVANCE_PAYMENT_COLLECTED'
  | 'PROCUREMENT'
  | 'EXECUTION_IN_PROGRESS'
  | 'MILESTONE_PAYMENT_COLLECTED'
  | 'QUALITY_CHECK'
  | 'HANDOVER'
  | 'WARRANTY_AMC'
  | 'LOST';

export type MilestoneStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface QuotationDimensions {
  widthFt?: number | undefined;
  heightFt?: number | undefined;
  depthFt?: number | undefined;
  areaSqft?: number | undefined;
  rft?: number | undefined;
}

export interface QuotationFinancialBreakdown {
  baseJoineryAmount: number; // in paise
  hardwareAmount: number; // in paise
  finishingPolishAmount?: number | undefined; // in paise
  designFeePercent: number; // e.g. 10 for 10%
  designFeeAmount: number; // in paise
  gstRate: number; // e.g. 18 for 18%
  gstAmount: number; // in paise
  grandTotal: number; // in paise
}

export interface QuotationMilestoneScheduleItem {
  stageName: string;
  percentage: number;
  amount: number; // in paise
  dueTrigger: string;
}

export interface QuotationItem {
  description: string;
  quantity: number;
  unitPrice: number; // paise
  total: number; // paise
  // Enhanced luxury BOQ metadata:
  id?: string | undefined;
  roomName?: string | undefined;
  category?: string | undefined;
  dimensions?: QuotationDimensions | undefined;
  coreMaterial?:
    'CENTURY_BWP_710' | 'GREENPANEL_HDHMR' | 'BIRCH_PLY' | 'BURMA_TEAK_SOLID' | string | undefined;
  finish?:
    | 'BURMA_TEAK_VENEER'
    | 'SMOKED_OAK_VENEER'
    | 'EUROPEAN_ACRYLIC'
    | 'PU_LACQUER'
    | 'QUARTZ_SLAB'
    | string
    | undefined;
  hardwareBrand?: 'BLUM' | 'HETTICH' | 'HAFELE' | 'EBCO' | string | undefined;
  hardwareDetails?: string | undefined;
  ratePerUnit?: number | undefined; // paise per sqft/unit
  hardwareAddonPaise?: number | undefined;
  notes?: string | undefined;
}

export interface Quotation {
  _id?: string;
  version: number;
  boqItems: QuotationItem[];
  totalAmount: number; // paise
  financialBreakdown?: QuotationFinancialBreakdown | undefined;
  milestoneSchedule?: QuotationMilestoneScheduleItem[] | undefined;
  status?: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | undefined;
  sentAt?: string | undefined;
  approvedAt?: string | undefined;
  eSignatureRef?: string | undefined;
  pdfUrl?: string | undefined;
}

// ── BOQ Luxury Pricing Constants & Presets ────────────────────────────────────

export const JOINERY_CORE_MATERIALS = [
  {
    id: 'CENTURY_BWP_710',
    name: 'Century Club Prime BWP 710 Marine Ply',
    ratePerSqftPaise: 185000,
    description: '100% boiling-water-proof with 10-year warranty against borer & termite',
  },
  {
    id: 'GREENPANEL_HDHMR',
    name: 'Greenpanel Club HDHMR (Moisture Resistant)',
    ratePerSqftPaise: 145000,
    description: 'High-density fiber core ideal for precision CNC routing and lacquer finishes',
  },
  {
    id: 'BIRCH_PLY',
    name: 'Grade-A European White Birch Plywood',
    ratePerSqftPaise: 210000,
    description: 'Architectural grade uniform multi-ply veneer with exposed edge aesthetics',
  },
  {
    id: 'BURMA_TEAK_SOLID',
    name: 'Authentic 1st-Quality Burma Teak Solid Hardwood',
    ratePerSqftPaise: 380000,
    description: 'Kiln-dried seasoned genuine Burma teak for statement luxury elements',
  },
] as const;

export const JOINERY_FINISHES = [
  {
    id: 'BURMA_TEAK_VENEER',
    name: 'Burma Teak Architectural Veneer (PU Matte)',
    addonPerSqftPaise: 65000,
    description: 'Matched natural woodgrain coated with zero-yellowing Italian polyurethane',
  },
  {
    id: 'SMOKED_OAK_VENEER',
    name: 'Smoked Crown European Oak Veneer',
    addonPerSqftPaise: 75000,
    description: 'Deep rich fumed character with subtle golden wire-brushed grain',
  },
  {
    id: 'EUROPEAN_ACRYLIC',
    name: 'Anti-Fingerprint European Matte Acrylic (0.8mm)',
    addonPerSqftPaise: 55000,
    description: 'Seamless laser edge-banded satin texture, scratch & thermal resistant',
  },
  {
    id: 'PU_LACQUER',
    name: 'High-Gloss Sayerlack Italian PU Lacquer (Multi-Coat)',
    addonPerSqftPaise: 85000,
    description: '100% mirror-finish liquid polyurethane baked in automated clean-room',
  },
  {
    id: 'QUARTZ_SLAB',
    name: 'Caesarstone / KalingaStone Quartz Countertop',
    addonPerSqftPaise: 120000,
    description: 'Non-porous stain proof engineered quartz for kitchen worktops & vanities',
  },
] as const;

export const HARDWARE_SYSTEM_OPTIONS = [
  {
    id: 'BLUM',
    name: 'Blum (Austria)',
    basePremiumPaise: 1250000,
    description:
      'Aventos HF bi-fold lift-ups, Tandembox Antaro soft-close drawer runners (Lifetime Guarantee)',
  },
  {
    id: 'HETTICH',
    name: 'Hettich (Germany)',
    basePremiumPaise: 850000,
    description:
      'Sensys integrated soft-close hinges and InnoTech Atira double-walled steel drawers',
  },
  {
    id: 'HAFELE',
    name: 'Häfele (Germany)',
    basePremiumPaise: 700000,
    description: 'Architectural matrix runners, Loox 5 warm-white LED joinery lighting integration',
  },
  {
    id: 'EBCO',
    name: 'Ebco Architectural Pro',
    basePremiumPaise: 350000,
    description: 'Heavy-duty soft-closing telescopic slides and concealed cabinet systems',
  },
] as const;

export const DEFAULT_ROOM_CATEGORIES = [
  'Living Room',
  'Master Bedroom Suite',
  'Gourmet Modular Kitchen',
  'Dining & Crockery Area',
  'Foyer & Shoe Dressing',
  'Walk-in Wardrobe',
  'Kids / Guest Bedroom',
  'Home Office & Library',
  'Balcony Deck & Bar',
] as const;

export interface Milestone {
  _id?: string;
  name: string;
  amount: number; // paise
  dueDate: string;
  status: MilestoneStatus;
  paymentId?: string;
}

// ── Site Inspection, Photo Stream & Snag Models ─────────────────────────────

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

export interface SitePhotoStreamItem {
  id: string;
  url: string;
  thumbnailUrl?: string | undefined;
  roomName: string;
  caption: string;
  workPhase: SiteWorkPhase;
  uploadedBy: string;
  uploadedAt: string;
  isClientVisible: boolean;
  tags?: string[] | undefined;
}

export interface SnagChecklistItem {
  id: string;
  title: string;
  roomName: string;
  description: string;
  severity: SnagSeverity;
  status: SnagStatus;
  reportedBy: string;
  assignedTo?: string | undefined;
  reportedAt: string;
  resolvedAt?: string | undefined;
  resolvedBy?: string | undefined;
  resolutionNote?: string | undefined;
  beforePhotoUrl?: string | undefined;
  afterPhotoUrl?: string | undefined;
}

export interface SiteInspectionReport {
  id: string;
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
  materialDeliveriesVerified: string[];
  siteCleanlinessRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'FAILED';
  blockersOrDelays?: string | undefined;
  photos?: SitePhotoStreamItem[] | undefined;
  snagsLogged?: SnagChecklistItem[] | undefined;
  createdAt: string;
}

export interface StageHistoryEvent {
  stage: DesignProjectStage;
  changedAt: string;
  changedBy: string;
  note?: string;
}

export interface DesignProject {
  _id: string;
  projectCode: string;
  leadId?: string;
  customerId: string;
  projectType: DesignProjectType;
  stage: DesignProjectStage;
  assignedDesignerId?: string;
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
    rooms?: number;
    bhk?: number;
  };
  quotations: Quotation[];
  milestones: Milestone[];
  stageHistory: StageHistoryEvent[];
  siteInspections?: SiteInspectionReport[] | undefined;
  sitePhotos?: SitePhotoStreamItem[] | undefined;
  snagItems?: SnagChecklistItem[] | undefined;
  version: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DesignProjectFunnelMetrics {
  totalProjects: number;
  inConsultation: number;
  quotationSent: number;
  inProgress: number;
  completed: number;
}

// ── Request/Response Interfaces ──────────────────────────────────────────────

export interface CreateDesignProjectRequest {
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
  propertyDetails: {
    areaSqft: number;
    rooms?: number;
    bhk?: number;
  };
}

export interface AdvanceProjectStageRequest {
  targetStage: DesignProjectStage;
  expectedVersion: number;
  note?: string;
}

export interface AddQuotationRequest {
  expectedVersion: number;
  boqItems: QuotationItem[];
  financialBreakdown?: QuotationFinancialBreakdown | undefined;
  milestoneSchedule?: QuotationMilestoneScheduleItem[] | undefined;
}

export interface ApproveQuotationRequest {
  expectedVersion: number;
  eSignatureRef: string;
}

export interface RecordInspectionRequest {
  expectedVersion: number;
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
  siteCleanlinessRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' | 'FAILED';
  blockersOrDelays?: string | undefined;
  photos?: Omit<SitePhotoStreamItem, 'id' | 'uploadedAt'>[] | undefined;
  snags?: Omit<SnagChecklistItem, 'id' | 'reportedAt' | 'status'>[] | undefined;
}

export interface AddSitePhotoRequest {
  expectedVersion: number;
  url: string;
  thumbnailUrl?: string | undefined;
  roomName: string;
  caption: string;
  workPhase: SiteWorkPhase;
  uploadedBy: string;
  isClientVisible: boolean;
  tags?: string[] | undefined;
}

export interface LogSnagRequest {
  expectedVersion: number;
  title: string;
  roomName: string;
  description: string;
  severity: SnagSeverity;
  reportedBy: string;
  assignedTo?: string | undefined;
  beforePhotoUrl?: string | undefined;
}

export interface UpdateSnagStatusRequest {
  expectedVersion: number;
  status: SnagStatus;
  resolvedBy?: string | undefined;
  resolutionNote?: string | undefined;
  afterPhotoUrl?: string | undefined;
}

export interface ListDesignProjectsParams {
  stage?: DesignProjectStage;
  assignedDesignerId?: string;
  limit?: number;
  offset?: number;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const DesignProjectService = {
  create: async (data: CreateDesignProjectRequest) => {
    return apiClient.post<DesignProject>('/api/v1/design-projects', data);
  },

  list: async (params?: ListDesignProjectsParams) => {
    const queryParams: Record<string, string> = {};
    if (params) {
      if (params.stage) queryParams.stage = params.stage;
      if (params.assignedDesignerId) queryParams.assignedDesignerId = params.assignedDesignerId;
      if (params.limit !== undefined) queryParams.limit = params.limit.toString();
      if (params.offset !== undefined) queryParams.offset = params.offset.toString();
    }
    return apiClient.get<{ items: DesignProject[]; total: number }>('/api/v1/design-projects', {
      params: queryParams,
    });
  },

  getById: async (id: string) => {
    return apiClient.get<DesignProject>(`/api/v1/design-projects/${id}`);
  },

  advanceStage: async (id: string, data: AdvanceProjectStageRequest) => {
    return apiClient.patch<DesignProject>(`/api/v1/design-projects/${id}/stage`, data);
  },

  addQuotation: async (id: string, data: AddQuotationRequest) => {
    return apiClient.post<DesignProject>(`/api/v1/design-projects/${id}/quotations`, data);
  },

  approveQuotation: async (id: string, qid: string, data: ApproveQuotationRequest) => {
    return apiClient.patch<DesignProject>(
      `/api/v1/design-projects/${id}/quotations/${qid}/approve`,
      data,
    );
  },

  recordInspection: async (id: string, data: RecordInspectionRequest) => {
    return apiClient.post<DesignProject>(`/api/v1/design-projects/${id}/inspections`, data);
  },

  listInspections: async (id: string) => {
    return apiClient.get<SiteInspectionReport[]>(`/api/v1/design-projects/${id}/inspections`);
  },

  addSitePhoto: async (id: string, data: AddSitePhotoRequest) => {
    return apiClient.post<DesignProject>(`/api/v1/design-projects/${id}/photos`, data);
  },

  listPhotos: async (id: string, clientOnly?: boolean) => {
    const params: Record<string, string> = clientOnly ? { clientOnly: 'true' } : {};
    return apiClient.get<SitePhotoStreamItem[]>(`/api/v1/design-projects/${id}/photos`, { params });
  },

  logSnag: async (id: string, data: LogSnagRequest) => {
    return apiClient.post<DesignProject>(`/api/v1/design-projects/${id}/snags`, data);
  },

  updateSnagStatus: async (id: string, snagId: string, data: UpdateSnagStatusRequest) => {
    return apiClient.patch<DesignProject>(`/api/v1/design-projects/${id}/snags/${snagId}`, data);
  },

  getQuotationPdfUrl: (projectId: string, qid: string | number): string => {
    return `/api/v1/design-projects/${projectId}/quotations/${qid}/pdf`;
  },

  getFunnelMetrics: async (startDate?: string, endDate?: string) => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return apiClient.get<DesignProjectFunnelMetrics>('/api/v1/design-projects/metrics/funnel', {
      ...(params ? { params: params as Record<string, unknown> } : {}),
    });
  },
};
