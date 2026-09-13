import mongoose, { Schema, Document, Types } from 'mongoose';
import { Review } from '../domain/reviews.types';

export interface IReviewDocument extends Omit<Review, 'id' | 'productId' | 'userId'>, Document {
  productId: Types.ObjectId;
  userId: Types.ObjectId;
}

const reviewSchema = new Schema<IReviewDocument>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'AuthUser', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true, maxlength: 120 },
  content: { type: String, required: true, maxlength: 2000 },
  images: [{
    url: { type: String, required: true },
    alt: { type: String },
  }],
  helpfulVotes: { type: Number, default: 0 },
  helpfulVoters: [{ type: Schema.Types.ObjectId, ref: 'AuthUser' }],
  status: { type: String, required: true, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  isVerifiedPurchase: { type: Boolean, required: true, default: false },
  isFeatured: { type: Boolean, default: false },
  adminReply: {
    message: { type: String },
    repliedAt: { type: Date },
    repliedBy: { type: String },
  },

  // Audit
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: String },
  version: { type: Number, default: 0 }
});

// Enforce one review per user per product (partial unique index on non-deleted)
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

// Performance indexes for product listing, filtering, and admin moderation
reviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ productId: 1, status: 1, rating: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ isFeatured: 1, status: 1 });

export const ReviewModel: mongoose.Model<IReviewDocument> =
  (mongoose.models.Review as mongoose.Model<IReviewDocument>) ||
  mongoose.model<IReviewDocument>('Review', reviewSchema, 'reviews');
