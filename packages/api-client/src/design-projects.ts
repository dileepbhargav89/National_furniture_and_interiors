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

export interface QuotationItem {
  description: string;
  quantity: number;
  unitPrice: number; // paise
  total: number; // paise
}

export interface Quotation {
  _id?: string;
  version: number;
  boqItems: QuotationItem[];
  totalAmount: number; // paise
  sentAt?: string;
  approvedAt?: string;
  eSignatureRef?: string;
}

export interface Milestone {
  _id?: string;
  name: string;
  amount: number; // paise
  dueDate: string;
  status: MilestoneStatus;
  paymentId?: string;
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
}

export interface ApproveQuotationRequest {
  expectedVersion: number;
  eSignatureRef: string;
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
    return apiClient.get<{ items: DesignProject[]; total: number }>('/api/v1/design-projects', { params: queryParams });
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
    return apiClient.patch<DesignProject>(`/api/v1/design-projects/${id}/quotations/${qid}/approve`, data);
  },

  getFunnelMetrics: async (startDate?: string, endDate?: string) => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return apiClient.get<DesignProjectFunnelMetrics>('/api/v1/design-projects/metrics/funnel', { ...(params ? { params: params as Record<string, unknown> } : {}) });
  },
};
