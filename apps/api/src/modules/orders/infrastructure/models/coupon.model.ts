import mongoose, { Schema, Document } from 'mongoose';
import { COUPON_TYPES, CouponType } from '../../domain/coupons.types';

export interface ICouponDocument extends Document {
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  applicableCategoryIds: mongoose.Types.ObjectId[];
  applicableProductIds: mongoose.Types.ObjectId[];
  usageLimitTotal: number;
  usageLimitPerUser: number;
  usedCount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, required: true },
    type: { type: String, enum: COUPON_TYPES, required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    maxDiscountAmount: { type: Number, default: null },
    applicableCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'categories' }],
    applicableProductIds: [{ type: Schema.Types.ObjectId, ref: 'products' }],
    usageLimitTotal: { type: Number, default: 0 }, // 0 = unlimited
    usageLimitPerUser: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'coupons',
  },
);

// Partial unique index filtered on isDeleted: false per docs/03 §10.2
CouponSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
CouponSchema.index({ isActive: 1, isDeleted: 1 });

export const CouponModel =
  (mongoose.models.Coupon as mongoose.Model<ICouponDocument>) ||
  mongoose.model<ICouponDocument>('Coupon', CouponSchema);
