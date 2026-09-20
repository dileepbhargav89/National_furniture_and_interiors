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

export type ConsultationType = 'STUDIO_VISIT' | 'ON_SITE_SURVEY' | 'VIRTUAL_VIDEO_CALL';

export interface ConsultationBooking {
  consultationType: ConsultationType;
  studioLocation?:
    'INDIRANAGAR' | 'WHITEFIELD' | 'HSR_LAYOUT' | 'VIKAS_MARG' | 'ON_SITE' | 'VIRTUAL' | undefined;
  scheduledDate: string;
  timeSlot: string;
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
  depositAmount: number;
  isDepositRefundable: boolean;
  dispatchStatus: 'ORDERED' | 'PACKED' | 'DISPATCHED' | 'DELIVERED';
  courierTrackingNumber?: string | undefined;
}

export interface MarketingConsent {
  granted: boolean;
  grantedAt?: Date | undefined;
  source?: string | undefined;
  channels: MarketingChannel[];
}

export interface Lead {
  id: string;
  source: LeadSource;
  sourceDetail?:
    | {
        utmSource?: string | undefined;
        utmMedium?: string | undefined;
        utmCampaign?: string | undefined;
      }
    | undefined;
  name: string;
  email?: string | undefined;
  phone: string;
  interestType: LeadInterestType;
  projectType?: LeadProjectType | undefined;
  budgetRange?:
    | {
        min: number;
        max: number;
      }
    | undefined;
  timeline?: LeadTimeline | undefined;
  consultationBooking?: ConsultationBooking | undefined;
  swatchKitOrder?: SwatchKitOrder | undefined;
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
