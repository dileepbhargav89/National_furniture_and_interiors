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

export interface MarketingConsent {
  granted: boolean;
  grantedAt?: Date | undefined;
  source?: string | undefined;
  channels: MarketingChannel[];
}

export interface Lead {
  id: string;
  source: LeadSource;
  sourceDetail?: {
    utmSource?: string | undefined;
    utmMedium?: string | undefined;
    utmCampaign?: string | undefined;
  } | undefined;
  name: string;
  email?: string | undefined;
  phone: string;
  interestType: LeadInterestType;
  projectType?: LeadProjectType | undefined;
  budgetRange?: {
    min: number;
    max: number;
  } | undefined;
  timeline?: LeadTimeline | undefined;
  marketingConsent: MarketingConsent;
  score: number;
  priority: LeadPriority;
  status: LeadStatus;
  assignedToId?: string | undefined;
  convertedCustomerId?: string | undefined;
  convertedDesignProjectId?: string | undefined;
  convertedOrderId?: string | undefined;
  notes?: string | undefined;
  
  // Standard audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | undefined;
  updatedBy?: string | undefined;
  isDeleted: boolean;
  deletedAt?: Date | undefined;
  version: number;
}
