import { apiClient } from './client';

export type ClientTier = 'VIP_PLATINUM' | 'HIGH_NET_WORTH' | 'COMMERCIAL' | 'RETAIL' | 'PROSPECT';
export type PreferredStudio = 'INDIRANAGAR' | 'WHITEFIELD' | 'HSR_LAYOUT' | 'VIRTUAL';
export type PipelineStageId = 
  | 'NEW_INQUIRY'
  | 'QUALIFIED'
  | 'STUDIO_CONSULTATION'
  | 'DESIGN_PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export type CrmDealPriority = 'HOT' | 'WARM' | 'COLD';

export interface CustomerProfile {
  id: string;
  _id?: string | undefined;
  userId: string;
  customerCode: string;
  name?: string | undefined;
  email: string;
  firstName?: string | undefined;
  lastName?: string | undefined;
  phone?: string | undefined;
  tags: string[];
  clientTier?: ClientTier | undefined;
  preferredStudio?: PreferredStudio | undefined;
  propertyDetails?: {
    community?: string | undefined;
    configuration?: string | undefined;
    estimatedAreaSqFt?: number | undefined;
    possessionDate?: string | undefined;
  } | undefined;
  estimatedDealValue?: number | undefined;
  currentPipelineStage?: PipelineStageId | undefined;
  assignedRepId?: string | undefined;
  assignedRepName?: string | undefined;
  notes?: string | undefined;
  totalSpent?: number | undefined;
  lifetimeValue?: number | undefined;
  orderCount?: number | undefined;
  totalOrders?: number | undefined;
  totalDesignProjects?: number | undefined;
  lastPurchaseDate?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineDeal {
  id: string;
  customerId: string;
  customerCode: string;
  clientName: string;
  email: string;
  phone: string;
  community: string;
  configuration: string;
  estimatedDealValue: number; // in paise
  weightedValue: number; // in paise
  stage: PipelineStageId;
  probability: number;
  clientTier: ClientTier;
  priority: CrmDealPriority;
  assignedRepId?: string | undefined;
  assignedRepName?: string | undefined;
  daysInStage: number;
  nextFollowUpAt?: string | undefined;
  notes?: string | undefined;
  updatedAt: string;
}

export interface PipelineStage {
  id: PipelineStageId;
  label: string;
  probability: number;
  totalValue: number; // in paise
  count: number;
  deals: PipelineDeal[];
}

export interface SalesRepresentative {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string | undefined;
  specialization: 'LUXURY_RESIDENTIAL' | 'COMMERCIAL_OFFICE' | 'MODULAR_KITCHEN' | 'BESPOKE_FURNITURE';
  monthlyTarget: number; // in paise
  achievedRevenue: number; // in paise
  activeLeadsCount: number;
  maxCapacity: number;
  wonDealsCount: number;
  conversionRate: number; // percentage
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface CrmKpis {
  totalPipelineValue: number; // in paise
  weightedPipelineValue: number; // in paise
  winRate: number; // percentage
  averageDealVelocityDays: number;
  averageDealSize: number; // in paise
  activeDealsCount: number;
  wonDealsCount: number;
  targetAchievementRate: number; // percentage
}

export interface LeadActivity {
  id: string;
  _id?: string | undefined;
  leadId: string;
  activityType?: 'NOTE' | 'EMAIL' | 'CALL' | 'MEETING' | 'STATUS_CHANGE' | 'STUDIO_VISIT' | undefined;
  type?: string | undefined;
  summary?: string | undefined;
  description?: string | undefined;
  performedById?: string | undefined;
  performedBy?: string | undefined;
  outcome?: string | undefined;
  scheduledFollowUpAt?: string | undefined;
  isFollowUpCompleted?: boolean | undefined;
  metadata?: Record<string, unknown> | undefined;
  occurredAt?: string | undefined;
  createdAt: string;
}

export interface LeadStatusHistory {
  id: string;
  _id?: string | undefined;
  leadId: string;
  fromStatus: string;
  toStatus: string;
  changedById?: string | undefined;
  changedBy?: string | undefined;
  reason?: string | undefined;
  changedAt?: string | undefined;
  createdAt: string;
}

export interface CustomerDossier {
  customer: CustomerProfile;
  deal?: PipelineDeal | undefined;
  activities: LeadActivity[];
  statusHistory: LeadStatusHistory[];
  designProjects: Array<{ id: string; title: string; stage: string; estimatedBudget: number }>;
  orders: Array<{ id: string; orderNumber: string; status: string; totalAmount: number; createdAt: string }>;
}

export const CrmService = {
  // Executive Pipeline & KPIs
  getCrmKpis: () =>
    apiClient.get<CrmKpis>('/crm/kpis'),

  getPipeline: (params?: { repId?: string | undefined; search?: string | undefined }) =>
    apiClient.get<PipelineStage[]>('/crm/pipeline', params ? { params } : undefined),

  updateDealStage: (dealId: string, stage: PipelineStageId, reason?: string | undefined) =>
    apiClient.patch<CustomerProfile>(`/crm/deals/${dealId}/stage`, { stage, reason }),

  // Sales Team Operations
  getSalesTeam: () =>
    apiClient.get<SalesRepresentative[]>('/crm/sales-team'),

  assignSalesRep: (dealId: string, repId: string) =>
    apiClient.post<CustomerProfile>(`/crm/deals/${dealId}/assign`, { repId }),

  // Customer 360 Dossier & Conversions
  getCustomerDossier: (customerId: string) =>
    apiClient.get<CustomerDossier>(`/crm/customers/${customerId}/dossier`),

  convertDealToProject: (dealId: string, data: { projectName?: string | undefined; scope?: string | undefined; estimatedBudget?: number | undefined }) =>
    apiClient.post<{ projectId: string; dealId: string; message: string }>(`/crm/deals/${dealId}/convert-project`, data),

  convertDealToOrder: (dealId: string, data: { itemsDescription?: string | undefined; totalAmount?: number | undefined }) =>
    apiClient.post<{ orderId: string; orderNumber: string; dealId: string; message: string }>(`/crm/deals/${dealId}/convert-order`, data),

  // Standard Customer Profile Management
  createCustomerProfile: (data: Partial<CustomerProfile>) =>
    apiClient.post<CustomerProfile>('/crm/customers', data),

  getCustomerProfile: (id: string) =>
    apiClient.get<CustomerProfile>(`/crm/customers/${id}`),

  updateCustomerProfile: (id: string, data: Partial<CustomerProfile>) =>
    apiClient.patch<CustomerProfile>(`/crm/customers/${id}`, data),

  getCustomerProfileByUserId: (userId: string) =>
    apiClient.get<CustomerProfile>(`/crm/customers/user/${userId}`),

  recordLeadActivity: (data: { 
    leadId: string; 
    type: string; 
    summary: string; 
    direction?: string | undefined; 
    outcome?: string | undefined; 
    performedBy: string; 
    scheduledFollowUpAt?: string | undefined;
    metadata?: Record<string, unknown> | undefined 
  }) =>
    apiClient.post<LeadActivity>('/crm/lead-activities', data),

  getLeadActivities: (leadId: string) =>
    apiClient.get<LeadActivity[]>(`/crm/lead-activities/${leadId}`),

  trackLeadStatusTransition: (data: { leadId: string; fromStatus: string; toStatus: string; reason?: string | undefined }) =>
    apiClient.post<LeadStatusHistory>('/crm/lead-status-history', data),

  getLeadStatusHistory: (leadId: string) =>
    apiClient.get<LeadStatusHistory[]>(`/crm/lead-status-history/${leadId}`),
};

