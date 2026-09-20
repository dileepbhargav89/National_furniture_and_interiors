import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  Customer,
  LeadActivity,
  LeadStatusTransition,
  SalesRepresentative,
} from '../domain/crm.types';

// ---------------- Customer Schema ----------------

export interface ICustomerDocument extends Omit<Customer, 'id' | 'userId'>, Document {
  userId?: Types.ObjectId;
}

const customerSchema = new Schema<ICustomerDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  customerCode: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  tags: { type: [String], default: [] },
  clientTier: {
    type: String,
    enum: ['VIP_PLATINUM', 'HIGH_NET_WORTH', 'COMMERCIAL', 'RETAIL', 'PROSPECT'],
    default: 'PROSPECT',
  },
  preferredStudio: {
    type: String,
    enum: ['INDIRANAGAR', 'WHITEFIELD', 'HSR_LAYOUT', 'VIRTUAL'],
  },
  consultationBooking: {
    consultationType: {
      type: String,
      enum: ['STUDIO_VISIT', 'ON_SITE_SURVEY', 'VIRTUAL_VIDEO_CALL'],
    },
    studioLocation: {
      type: String,
      enum: ['INDIRANAGAR', 'WHITEFIELD', 'HSR_LAYOUT', 'VIKAS_MARG', 'ON_SITE', 'VIRTUAL'],
    },
    scheduledDate: { type: String },
    timeSlot: { type: String },
    propertyType: { type: String },
    meetingNotes: { type: String },
    calendarInviteSent: { type: Boolean, default: false },
  },
  swatchKitOrder: {
    kitType: {
      type: String,
      enum: ['HARDWOOD_VENEERS', 'FABRICS_LEATHER', 'MODULAR_KITCHEN', 'COMPLETE_MASTER_BOX'],
    },
    deliveryAddress: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    depositAmount: { type: Number, default: 49900 },
    isDepositRefundable: { type: Boolean, default: true },
    dispatchStatus: {
      type: String,
      enum: ['ORDERED', 'PACKED', 'DISPATCHED', 'DELIVERED'],
      default: 'ORDERED',
    },
    courierTrackingNumber: { type: String },
  },
  propertyDetails: {
    community: { type: String },
    configuration: { type: String },
    estimatedAreaSqFt: { type: Number },
    possessionDate: { type: String },
  },
  estimatedDealValue: { type: Number, default: 0 },
  currentPipelineStage: {
    type: String,
    default: 'NEW_INQUIRY',
  },
  assignedRepId: { type: String },
  assignedRepName: { type: String },
  lifetimeValue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalDesignProjects: { type: Number, default: 0 },
  preferredContactChannel: { type: String },
  acquisitionSource: { type: String },
  notes: { type: String },

  // Audit
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  version: { type: Number, default: 0 },
});

customerSchema.index(
  { customerCode: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
customerSchema.index({ userId: 1 }, { unique: true, sparse: true });
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ currentPipelineStage: 1 });
customerSchema.index({ assignedRepId: 1 });

export const CustomerModel = mongoose.model<ICustomerDocument>(
  'Customer',
  customerSchema,
  'customers',
);

// Drop legacy non-sparse userId index if it exists in MongoDB
if (process.env.NODE_ENV !== 'test') {
  CustomerModel.collection.dropIndex('userId_1').catch(() => {});
}

// ---------------- Sales Representative Schema ----------------

export interface ISalesRepresentativeDocument extends Omit<SalesRepresentative, 'id'>, Document {}

const salesRepresentativeSchema = new Schema<ISalesRepresentativeDocument>({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  avatarUrl: { type: String },
  specialization: {
    type: String,
    enum: ['LUXURY_RESIDENTIAL', 'COMMERCIAL_OFFICE', 'MODULAR_KITCHEN', 'BESPOKE_FURNITURE'],
    default: 'LUXURY_RESIDENTIAL',
  },
  monthlyTarget: { type: Number, default: 350000000 }, // in paise (e.g. ₹35,00,000)
  achievedRevenue: { type: Number, default: 0 },
  activeLeadsCount: { type: Number, default: 0 },
  maxCapacity: { type: Number, default: 12 },
  wonDealsCount: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'ON_LEAVE', 'INACTIVE'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

salesRepresentativeSchema.index({ status: 1 });
salesRepresentativeSchema.index({ email: 1 }, { unique: true });

export const SalesRepresentativeModel = mongoose.model<ISalesRepresentativeDocument>(
  'SalesRepresentative',
  salesRepresentativeSchema,
  'sales_representatives',
);

// ---------------- Lead Status History Schema ----------------

export interface ILeadStatusTransitionDocument
  extends Omit<LeadStatusTransition, 'id' | 'leadId'>, Document {
  leadId: Types.ObjectId;
}

const leadStatusHistorySchema = new Schema<ILeadStatusTransitionDocument>({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
  fromStatus: { type: String, required: true },
  toStatus: { type: String, required: true },
  changedBy: { type: String, required: true },
  reason: { type: String },
  changedAt: { type: Date, default: Date.now },
});

export const LeadStatusHistoryModel = mongoose.model<ILeadStatusTransitionDocument>(
  'LeadStatusHistory',
  leadStatusHistorySchema,
  'lead_status_history',
);

// ---------------- Lead Activity Schema ----------------

export interface ILeadActivityDocument extends Omit<LeadActivity, 'id' | 'leadId'>, Document {
  leadId: Types.ObjectId;
}

const leadActivitySchema = new Schema<ILeadActivityDocument>({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
  type: { type: String, required: true },
  direction: { type: String },
  summary: { type: String, required: true },
  outcome: { type: String },
  performedBy: { type: String, required: true },
  occurredAt: { type: Date, default: Date.now },
  scheduledFollowUpAt: { type: Date },
  isFollowUpCompleted: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed },
});

leadActivitySchema.index({ leadId: 1, occurredAt: -1 });

export const LeadActivityModel = mongoose.model<ILeadActivityDocument>(
  'LeadActivity',
  leadActivitySchema,
  'lead_activities',
);
