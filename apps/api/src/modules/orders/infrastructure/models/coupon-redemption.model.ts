import mongoose, { Schema, Document } from 'mongoose';

export interface ICouponRedemptionDocument extends Document {
  couponId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  discountAmount: number; // in paise
  redeemedAt: Date;
}

const CouponRedemptionSchema = new Schema(
  {
    couponId: { type: Schema.Types.ObjectId, ref: 'coupons', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'users', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'orders', required: true },
    discountAmount: { type: Number, required: true, min: 0 },
    redeemedAt: { type: Date, default: () => new Date() },
  },
  {
    timestamps: true,
    collection: 'coupon_redemptions',
  },
);

// Compound index for per-user limit lookup & user redemption history
CouponRedemptionSchema.index({ couponId: 1, userId: 1 });
CouponRedemptionSchema.index({ userId: 1, redeemedAt: -1 });

export const CouponRedemptionModel =
  (mongoose.models.CouponRedemption as mongoose.Model<ICouponRedemptionDocument>) ||
  mongoose.model<ICouponRedemptionDocument>('CouponRedemption', CouponRedemptionSchema);
