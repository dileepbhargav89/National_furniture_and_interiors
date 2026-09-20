export type LeadStatusTransition = {
  id: string;
  leadId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  reason?: string | undefined;
  changedAt: Date;
};

export type LeadActivityType =
  'CALL' | 'EMAIL' | 'WHATSAPP' | 'NOTE' | 'STATUS_CHANGE' | 'MEETING' | 'STUDIO_VISIT';
export type LeadActivityDirection = 'INBOUND' | 'OUTBOUND';
export type LeadActivityOutcome =
  | 'CONNECTED'
  | 'LEFT_VOICEMAIL'
  | 'WHATSAPP_SENT'
  | 'MEETING_COMPLETED'
  | 'RESCHEDULED'
  | 'NO_ANSWER';

export interface LeadActivity {
  id: string;
  leadId: string;
  type: LeadActivityType;
  direction?: LeadActivityDirection | undefined;
  summary: string;
  outcome?: LeadActivityOutcome | undefined;
  performedBy: string;
  occurredAt: Date;
  scheduledFollowUpAt?: Date | undefined;
  isFollowUpCompleted?: boolean | undefined;
  metadata?: Record<string, unknown> | undefined;
}

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

export type LeadPriority = 'HOT' | 'WARM' | 'COLD';

export type ConsultationType = 'STUDIO_VISIT' | 'ON_SITE_SURVEY' | 'VIRTUAL_VIDEO_CALL';

export interface ConsultationBooking {
  consultationType: ConsultationType;
  studioLocation?:
    'INDIRANAGAR' | 'WHITEFIELD' | 'HSR_LAYOUT' | 'VIKAS_MARG' | 'ON_SITE' | 'VIRTUAL' | undefined;
  scheduledDate: string; // ISO format: YYYY-MM-DD
  timeSlot: string; // e.g. "11:00 AM - 12:30 PM"
  propertyType?: string | undefined;
  meetingNotes?: string | undefined;
  calendarInviteSent?: boolean | undefined;
}

export type SwatchKitType =
  'HARDWOOD_VENEERS' | 'FABRICS_LEATHER' | 'MODULAR_KITCHEN' | 'COMPLETE_MASTER_BOX';

export interface SwatchKitAddress {
  line1: string;
  line2?: string | undefined;
  city: string;
  state: string;
  pincode: string;
}

export interface SwatchKitOrder {
  kitType: SwatchKitType;
  deliveryAddress: SwatchKitAddress;
  depositAmount: number; // in paise (e.g. 49900 = ₹499)
  isDepositRefundable: boolean;
  dispatchStatus: 'ORDERED' | 'PACKED' | 'DISPATCHED' | 'DELIVERED';
  courierTrackingNumber?: string | undefined;
}

export interface PropertyDetails {
  community?: string | undefined;
  configuration?: string | undefined; // e.g. 3BHK, 4BHK Villa, Penthouse
  estimatedAreaSqFt?: number | undefined;
  possessionDate?: string | undefined;
}

export interface Customer {
  id: string;
  userId?: string | undefined;
  customerCode: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  clientTier: ClientTier;
  preferredStudio?: PreferredStudio | undefined;
  consultationBooking?: ConsultationBooking | undefined;
  swatchKitOrder?: SwatchKitOrder | undefined;
  propertyDetails?: PropertyDetails | undefined;
  estimatedDealValue: number; // in paise
  currentPipelineStage: PipelineStageId;
  assignedRepId?: string | undefined;
  assignedRepName?: string | undefined;
  lifetimeValue: number; // in paise
  totalOrders: number;
  totalDesignProjects: number;
  preferredContactChannel?: string | undefined;
  acquisitionSource?: string | undefined;
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

export type UpdateCustomerInput = {
  name?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  tags?: string[] | undefined;
  clientTier?: ClientTier | undefined;
  preferredStudio?: PreferredStudio | undefined;
  consultationBooking?: ConsultationBooking | undefined;
  swatchKitOrder?: SwatchKitOrder | undefined;
  propertyDetails?: PropertyDetails | undefined;
  estimatedDealValue?: number | undefined;
  currentPipelineStage?: PipelineStageId | undefined;
  assignedRepId?: string | undefined;
  assignedRepName?: string | undefined;
  lifetimeValue?: number | undefined;
  totalOrders?: number | undefined;
  totalDesignProjects?: number | undefined;
  preferredContactChannel?: string | undefined;
  acquisitionSource?: string | undefined;
  notes?: string | undefined;
};

export type SalesRepSpecialization =
  'LUXURY_RESIDENTIAL' | 'COMMERCIAL_OFFICE' | 'MODULAR_KITCHEN' | 'BESPOKE_FURNITURE';
export type SalesRepStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';

export interface SalesRepresentative {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string | undefined;
  specialization: SalesRepSpecialization;
  monthlyTarget: number; // in paise
  achievedRevenue: number; // in paise
  activeLeadsCount: number;
  maxCapacity: number;
  wonDealsCount: number;
  conversionRate: number; // percentage, e.g. 34.5
  status: SalesRepStatus;
  createdAt: Date;
  updatedAt: Date;
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
  probability: number; // percentage e.g. 10, 30, 50, 75, 90, 100, 0
  clientTier: ClientTier;
  priority: LeadPriority;
  consultationBooking?: ConsultationBooking | undefined;
  swatchKitOrder?: SwatchKitOrder | undefined;
  assignedRepId?: string | undefined;
  assignedRepName?: string | undefined;
  daysInStage: number;
  nextFollowUpAt?: Date | undefined;
  notes?: string | undefined;
  createdAt?: Date | undefined;
  acquisitionSource?: string | undefined;
  updatedAt: Date;
}

export interface PipelineStageInfo {
  id: PipelineStageId;
  label: string;
  probability: number;
  totalValue: number; // in paise
  count: number;
  deals: PipelineDeal[];
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

export interface CustomerDossier {
  customer: Customer;
  deal?: PipelineDeal | undefined;
  activities: LeadActivity[];
  statusHistory: LeadStatusTransition[];
  designProjects: Array<{ id: string; title: string; stage: string; estimatedBudget: number }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }>;
}
