import mongoose, { Schema, Document } from 'mongoose';
import {
  DesignProjectType,
  DesignProjectStage,
  MilestoneStatus,
  IDesignProject,
} from '../../domain/design-projects.types';

export interface IDesignProjectDocument extends Omit<IDesignProject, '_id'>, Document {}

const QuotationItemSchema = new Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true }, // paise
    total: { type: Number, required: true }, // paise
    id: { type: String, default: null },
    roomName: { type: String, default: null },
    category: { type: String, default: null },
    dimensions: {
      widthFt: { type: Number, default: null },
      heightFt: { type: Number, default: null },
      depthFt: { type: Number, default: null },
      areaSqft: { type: Number, default: null },
      rft: { type: Number, default: null },
    },
    coreMaterial: { type: String, default: null },
    finish: { type: String, default: null },
    hardwareBrand: { type: String, default: null },
    hardwareDetails: { type: String, default: null },
    ratePerUnit: { type: Number, default: null },
    hardwareAddonPaise: { type: Number, default: 0 },
    notes: { type: String, default: null },
  },
  { _id: false },
);

const QuotationSchema = new Schema({
  version: { type: Number, required: true },
  boqItems: [QuotationItemSchema],
  totalAmount: { type: Number, required: true }, // paise
  financialBreakdown: {
    baseJoineryAmount: { type: Number, default: null },
    hardwareAmount: { type: Number, default: null },
    finishingPolishAmount: { type: Number, default: null },
    designFeePercent: { type: Number, default: null },
    designFeeAmount: { type: Number, default: null },
    gstRate: { type: Number, default: null },
    gstAmount: { type: Number, default: null },
    grandTotal: { type: Number, default: null },
  },
  milestoneSchedule: [
    {
      stageName: { type: String },
      percentage: { type: Number },
      amount: { type: Number },
      dueTrigger: { type: String },
    },
  ],
  status: { type: String, default: 'SENT' },
  sentAt: { type: Date, default: null },
  approvedAt: { type: Date, default: null },
  eSignatureRef: { type: String, default: null },
  pdfUrl: { type: String, default: null },
});

const MilestoneSchema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true }, // paise
  dueDate: { type: Date, required: true },
  status: { type: String, enum: Object.values(MilestoneStatus), required: true },
  paymentId: { type: String, default: null },
});

const StageHistoryEventSchema = new Schema(
  {
    stage: { type: String, enum: Object.values(DesignProjectStage), required: true },
    changedAt: { type: Date, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: null },
  },
  { _id: false },
);

const SitePhotoStreamItemSchema = new Schema(
  {
    id: { type: String, required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String, default: null },
    roomName: { type: String, required: true },
    caption: { type: String, required: true },
    workPhase: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    isClientVisible: { type: Boolean, default: true },
    tags: [{ type: String }],
  },
  { _id: false },
);

const SnagChecklistItemSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    roomName: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['CRITICAL', 'MODERATE', 'COSMETIC'], required: true },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLIENT_VERIFIED'],
      default: 'OPEN',
    },
    reportedBy: { type: String, required: true },
    assignedTo: { type: String, default: null },
    reportedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: String, default: null },
    resolutionNote: { type: String, default: null },
    beforePhotoUrl: { type: String, default: null },
    afterPhotoUrl: { type: String, default: null },
  },
  { _id: false },
);

const SiteInspectionReportSchema = new Schema(
  {
    id: { type: String, required: true },
    inspectionDate: { type: Date, required: true },
    inspectorName: { type: String, required: true },
    inspectorRole: { type: String, required: true },
    currentPhase: { type: String, required: true },
    workCompletedToday: { type: String, required: true },
    manpowerCount: {
      carpenters: { type: Number, default: 0 },
      polishers: { type: Number, default: 0 },
      electricians: { type: Number, default: 0 },
      helpers: { type: Number, default: 0 },
    },
    materialDeliveriesVerified: [{ type: String }],
    siteCleanlinessRating: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'NEEDS_ATTENTION', 'FAILED'],
      default: 'GOOD',
    },
    blockersOrDelays: { type: String, default: null },
    photos: [SitePhotoStreamItemSchema],
    snagsLogged: [SnagChecklistItemSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const DesignProjectSchema = new Schema(
  {
    projectCode: { type: String, required: true, unique: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectType: { type: String, enum: Object.values(DesignProjectType), required: true },
    stage: { type: String, enum: Object.values(DesignProjectStage), required: true },
    assignedDesignerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    budgetRange: {
      min: { type: Number, required: true }, // paise
      max: { type: Number, required: true }, // paise
    },
    propertyAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    propertyDetails: {
      areaSqft: { type: Number, required: true },
      rooms: { type: Number, default: null },
      bhk: { type: Number, default: null },
    },
    quotations: [QuotationSchema],
    milestones: [MilestoneSchema],
    stageHistory: [StageHistoryEventSchema],
    siteInspections: [SiteInspectionReportSchema],
    sitePhotos: [SitePhotoStreamItemSchema],
    snagItems: [SnagChecklistItemSchema],

    // Audit fields
    version: { type: Number, default: 1 },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

// Optimistic concurrency control for `version`
DesignProjectSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.version = (this.version || 1) + 1;
  }
  next();
});

export const DesignProjectModel = mongoose.model<IDesignProjectDocument>(
  'DesignProject',
  DesignProjectSchema,
  'design_projects',
);
