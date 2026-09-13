import mongoose, { Schema, Document } from 'mongoose';
import { 
  DesignProjectType, 
  DesignProjectStage, 
  MilestoneStatus, 
  IDesignProject 
} from '../../domain/design-projects.types';

export interface IDesignProjectDocument extends Omit<IDesignProject, '_id'>, Document {}

const QuotationItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true }, // paise
  total: { type: Number, required: true } // paise
}, { _id: false });

const QuotationSchema = new Schema({
  version: { type: Number, required: true },
  boqItems: [QuotationItemSchema],
  totalAmount: { type: Number, required: true }, // paise
  sentAt: { type: Date, default: null },
  approvedAt: { type: Date, default: null },
  eSignatureRef: { type: String, default: null }
});

const MilestoneSchema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true }, // paise
  dueDate: { type: Date, required: true },
  status: { type: String, enum: Object.values(MilestoneStatus), required: true },
  paymentId: { type: String, default: null }
});

const StageHistoryEventSchema = new Schema({
  stage: { type: String, enum: Object.values(DesignProjectStage), required: true },
  changedAt: { type: Date, required: true },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, default: null }
}, { _id: false });

const DesignProjectSchema = new Schema({
  projectCode: { type: String, required: true, unique: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectType: { type: String, enum: Object.values(DesignProjectType), required: true },
  stage: { type: String, enum: Object.values(DesignProjectStage), required: true },
  assignedDesignerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  budgetRange: {
    min: { type: Number, required: true }, // paise
    max: { type: Number, required: true }  // paise
  },
  propertyAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  propertyDetails: {
    areaSqft: { type: Number, required: true },
    rooms: { type: Number, default: null },
    bhk: { type: Number, default: null }
  },
  quotations: [QuotationSchema],
  milestones: [MilestoneSchema],
  stageHistory: [StageHistoryEventSchema],
  
  // Audit fields
  version: { type: Number, default: 1 },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

// Optimistic concurrency control for `version`
DesignProjectSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version = (this.version || 1) + 1;
  }
  next();
});

export const DesignProjectModel = mongoose.model<IDesignProjectDocument>('DesignProject', DesignProjectSchema, 'design_projects');
