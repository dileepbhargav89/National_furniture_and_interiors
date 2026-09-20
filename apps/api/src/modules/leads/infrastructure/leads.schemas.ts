import { Schema, model, Document, Types } from 'mongoose';
import type { Lead } from '../domain/leads.types';

// Omit id because mongoose uses _id
export interface ILeadDocument extends Omit<Lead, 'id'>, Document {
  _id: Types.ObjectId;
}

const MarketingConsentSchema = new Schema(
  {
    granted: { type: Boolean, required: true },
    grantedAt: { type: Date },
    source: { type: String },
    channels: [{ type: String, enum: ['SMS', 'WHATSAPP', 'EMAIL'] }],
  },
  { _id: false },
);

const LeadSchema = new Schema<ILeadDocument>(
  {
    source: {
      type: String,
      required: true,
      enum: ['WEBSITE_FORM', 'WHATSAPP', 'CALL', 'WALK_IN', 'REFERRAL', 'CAMPAIGN'],
    },
    sourceDetail: {
      utmSource: String,
      utmMedium: String,
      utmCampaign: String,
    },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    interestType: {
      type: String,
      required: true,
      enum: ['INTERIOR_DESIGN', 'FURNITURE_PURCHASE', 'BOTH'],
    },
    projectType: {
      type: String,
      enum: [
        'RESIDENTIAL',
        'COMMERCIAL',
        'MODULAR_KITCHEN',
        'BEDROOM',
        'LIVING_ROOM',
        'HOTEL',
        'RESTAURANT',
        'INSTITUTION',
      ],
    },
    budgetRange: {
      min: { type: Number },
      max: { type: Number },
    },
    timeline: {
      type: String,
      enum: ['IMMEDIATE', '1_3_MONTHS', '3_6_MONTHS', 'EXPLORING'],
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
    marketingConsent: { type: MarketingConsentSchema, required: true },
    score: { type: Number, required: true, default: 0 },
    priority: { type: String, required: true, enum: ['HOT', 'WARM', 'COLD'], default: 'COLD' },
    status: {
      type: String,
      required: true,
      enum: [
        'NEW',
        'QUALIFIED',
        'CONTACTED',
        'CONSULTATION_SCHEDULED',
        'CONVERTED',
        'DISQUALIFIED',
        'LOST',
      ],
      default: 'NEW',
    },
    assignedToId: { type: String },
    convertedCustomerId: { type: String },
    convertedDesignProjectId: { type: String },
    convertedOrderId: { type: String },
    notes: { type: String },

    // Audit fields
    createdBy: { type: String },
    updatedBy: { type: String },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    version: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    versionKey: 'version',
  },
);

// Indexes
LeadSchema.index({ phone: 1, isDeleted: 1 });
LeadSchema.index({ email: 1, isDeleted: 1 });
LeadSchema.index({ status: 1, priority: 1 });
LeadSchema.index({ assignedToId: 1 });

export const LeadModel = model<ILeadDocument>('Lead', LeadSchema, 'leads');
