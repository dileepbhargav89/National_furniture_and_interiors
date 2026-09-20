import { apiClient } from './client';
import type { ConsultationBooking, SwatchKitOrder } from './crm';

// ── Domain Types ─────────────────────────────────────────────────────────────

export type LeadSource = 'WEBSITE_FORM' | 'WHATSAPP' | 'CALL' | 'WALK_IN' | 'REFERRAL' | 'CAMPAIGN';
export type LeadInterestType = 'INTERIOR_DESIGN' | 'FURNITURE_PURCHASE' | 'BOTH';
export type LeadProjectType =
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'MODULAR_KITCHEN'
  | 'BEDROOM'
  | 'LIVING_ROOM'
  | 'HOTEL'
  | 'RESTAURANT'
  | 'INSTITUTION';
export type LeadTimeline = 'IMMEDIATE' | '1_3_MONTHS' | '3_6_MONTHS' | 'EXPLORING';
export type LeadPriority = 'HOT' | 'WARM' | 'COLD';
export type LeadStatus =
  | 'NEW'
  | 'QUALIFIED'
  | 'CONTACTED'
  | 'CONSULTATION_SCHEDULED'
  | 'CONVERTED'
  | 'DISQUALIFIED'
  | 'LOST';
export type MarketingChannel = 'SMS' | 'WHATSAPP' | 'EMAIL';

export interface SubmitLeadRequest {
  source: LeadSource;
  sourceDetail?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  name: string;
  email?: string;
  phone: string;
  interestType: LeadInterestType;
  projectType?: LeadProjectType;
  budgetRange?: { min: number; max: number };
  timeline?: LeadTimeline;
  consultationBooking?: ConsultationBooking | undefined;
  swatchKitOrder?: SwatchKitOrder | undefined;
  marketingConsent: {
    granted: boolean;
    source?: string;
    channels: MarketingChannel[];
  };
  captchaToken: string;
}

export interface LeadResponse {
  id: string;
  source: LeadSource;
  name: string;
  email?: string;
  phone: string;
  interestType: LeadInterestType;
  projectType?: LeadProjectType;
  budgetRange?: { min: number; max: number };
  timeline?: LeadTimeline;
  consultationBooking?: ConsultationBooking | undefined;
  swatchKitOrder?: SwatchKitOrder | undefined;
  score: number;
  priority: LeadPriority;
  status: LeadStatus;
  createdAt: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const LeadService = {
  /**
   * Submit a new lead inquiry from the public storefront.
   * Maps to: POST /api/v1/leads (leads.routes.ts — public, rate-limited 10/min)
   */
  submitLead: async (data: SubmitLeadRequest) => {
    return apiClient.post<LeadResponse>('/api/v1/leads', data);
  },

  listLeads: async (params?: {
    limit?: number;
    offset?: number;
    status?: string;
    priority?: string;
    assignedToId?: string;
  }) => {
    return apiClient.get<{ items: LeadResponse[]; total: number }>('/api/v1/leads', {
      ...(params ? { params: params as Record<string, unknown> } : {}),
    });
  },

  assignLead: async (id: string, assignedToId: string, expectedVersion: number) => {
    return apiClient.patch<LeadResponse>(`/api/v1/leads/${id}/assign`, {
      assignedToId,
      expectedVersion,
    });
  },

  updateLeadStatus: async (id: string, status: string, expectedVersion: number) => {
    return apiClient.patch<LeadResponse>(`/api/v1/leads/${id}/status`, { status, expectedVersion });
  },
};
