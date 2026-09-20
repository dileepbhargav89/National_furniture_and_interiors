import type { Lead, LeadStatus, LeadPriority } from '../domain/leads.types';

export interface CreateLeadInput {
  source: Lead['source'];
  sourceDetail?: Lead['sourceDetail'] | undefined;
  name: string;
  email?: string | undefined;
  phone: string;
  interestType: Lead['interestType'];
  projectType?: Lead['projectType'] | undefined;
  budgetRange?: Lead['budgetRange'] | undefined;
  timeline?: Lead['timeline'] | undefined;
  consultationBooking?: Lead['consultationBooking'] | undefined;
  swatchKitOrder?: Lead['swatchKitOrder'] | undefined;
  marketingConsent: Lead['marketingConsent'];
  score: number;
  priority: LeadPriority;
  status: LeadStatus;
}

export interface UpdateLeadInput {
  status?: LeadStatus | undefined;
  score?: number | undefined;
  priority?: LeadPriority | undefined;
  assignedToId?: string | undefined;
  notes?: string | undefined;
}

export interface ListLeadsFilters {
  status?: LeadStatus | undefined;
  priority?: LeadPriority | undefined;
  assignedToId?: string | undefined;
}

export interface ILeadRepository {
  create(input: CreateLeadInput): Promise<Lead>;
  findById(id: string): Promise<Lead | null>;
  find(
    filters: ListLeadsFilters,
    limit?: number,
    offset?: number,
  ): Promise<{ leads: Lead[]; total: number }>;
  update(id: string, updates: UpdateLeadInput, expectedVersion: number): Promise<Lead | null>;
  getFunnelMetrics(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalLeads: number;
    newLeads: number;
    contactedLeads: number;
    qualifiedLeads: number;
    convertedLeads: number;
  }>;
}
