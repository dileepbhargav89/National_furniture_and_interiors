import { Customer, LeadActivity, LeadStatusTransition, SalesRepresentative, UpdateCustomerInput } from '../domain/crm.types';

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findByUserId(userId: string): Promise<Customer | null>;
  findAll(filter?: { stage?: string; repId?: string; search?: string }): Promise<Customer[]>;
  save(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'isDeleted' | 'deletedAt'>): Promise<Customer>;
  update(id: string, updates: UpdateCustomerInput): Promise<Customer | null>;
  count(): Promise<number>;
}

export interface SalesRepresentativeRepository {
  findAll(filter?: { status?: string }): Promise<SalesRepresentative[]>;
  findById(id: string): Promise<SalesRepresentative | null>;
  findByUserId(userId: string): Promise<SalesRepresentative | null>;
  save(rep: Omit<SalesRepresentative, 'id' | 'createdAt' | 'updatedAt'>): Promise<SalesRepresentative>;
  update(id: string, updates: Partial<SalesRepresentative>): Promise<SalesRepresentative | null>;
  findLeastLoadedRep(specialization?: string): Promise<SalesRepresentative | null>;
}

export interface LeadActivityRepository {
  findByLeadId(leadId: string): Promise<LeadActivity[]>;
  save(activity: Omit<LeadActivity, 'id' | 'occurredAt'>): Promise<LeadActivity>;
  findAllRecent(limit?: number): Promise<LeadActivity[]>;
}

export interface LeadStatusHistoryRepository {
  findByLeadId(leadId: string): Promise<LeadStatusTransition[]>;
  save(transition: Omit<LeadStatusTransition, 'id' | 'changedAt'>): Promise<LeadStatusTransition>;
}

