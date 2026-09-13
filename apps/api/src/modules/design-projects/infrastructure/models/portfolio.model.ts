import mongoose, { Schema, Document } from 'mongoose';
import { IPortfolioProject } from '../../domain/portfolio.types';

export interface IPortfolioProjectDocument extends Omit<IPortfolioProject, '_id' | 'id'>, Document {}

const MaterialSpecSchema = new Schema(
  {
    category: { type: String, required: true },
    detail: { type: String, required: true },
  },
  { _id: false }
);

const ClientTestimonialSchema = new Schema(
  {
    clientName: { type: String, required: true },
    society: { type: String, required: true },
    quote: { type: String, required: true },
    rating: { type: Number, required: true, default: 5 },
  },
  { _id: false }
);

const PortfolioProjectSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    community: { type: String, required: true },
    locality: { type: String, required: true, index: true },
    city: { type: String, required: true, default: 'Bengaluru' },
    sector: {
      type: String,
      enum: ['residential', 'commercial'],
      required: true,
      default: 'residential',
      index: true,
    },
    category: {
      type: String,
      enum: ['3bhk-4bhk', '2bhk', 'villa', 'kitchen', 'penthouse', 'office', 'restaurant', 'hotel', 'retail'],
      required: true,
      index: true,
    },
    categoryLabel: { type: String, required: true },
    areaSqFt: { type: Number, required: true },
    budgetInLakhs: { type: Number, required: true },
    budgetString: { type: String, required: true },
    turnaroundDays: { type: Number, required: true },
    style: { type: String, required: true },
    coverImage: { type: String, required: true },
    galleryImages: [{ type: String }],
    scope: [{ type: String }],
    materials: [MaterialSpecSchema],
    designerNotes: { type: String, default: '' },
    clientTestimonial: { type: ClientTestimonialSchema, default: null },
    isPublished: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0, index: true },
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id?.toString();
        return ret;
      },
    },
  }
);

export const PortfolioProjectModel = mongoose.model<IPortfolioProjectDocument>(
  'PortfolioProject',
  PortfolioProjectSchema,
  'portfolios'
);
