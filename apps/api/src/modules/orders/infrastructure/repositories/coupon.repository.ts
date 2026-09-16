import mongoose from 'mongoose';
import { CouponModel } from '../models/coupon.model';
import { CouponRedemptionModel } from '../models/coupon-redemption.model';
import type { Coupon } from '../../domain/coupons.types';

function toCoupon(doc: Record<string, unknown>): Coupon {
  return {
    id: String(doc._id),
    code: String(doc.code),
    description: String(doc.description),
    type: doc.type as Coupon['type'],
    value: Number(doc.value),
    minOrderValue: Number(doc.minOrderValue || 0),
    maxDiscountAmount: doc.maxDiscountAmount ? Number(doc.maxDiscountAmount) : null,
    applicableCategoryIds: ((doc.applicableCategoryIds as unknown[]) || []).map(String),
    applicableProductIds: ((doc.applicableProductIds as unknown[]) || []).map(String),
    usageLimitTotal: Number(doc.usageLimitTotal || 0),
    usageLimitPerUser: Number(doc.usageLimitPerUser || 1),
    usedCount: Number(doc.usedCount || 0),
    startDate: new Date(doc.startDate as string | Date),
    endDate: new Date(doc.endDate as string | Date),
    isActive: Boolean(doc.isActive),
    createdAt: new Date(doc.createdAt as string | Date),
    updatedAt: new Date(doc.updatedAt as string | Date),
    isDeleted: Boolean(doc.isDeleted),
  };
}

export class MongoCouponRepository {
  async findByCode(code: string): Promise<Coupon | null> {
    const doc = await CouponModel.findOne({
      code: code.trim().toUpperCase(),
      isDeleted: false,
    }).lean<Record<string, unknown> | null>();

    return doc ? toCoupon(doc) : null;
  }

  async findActiveCoupons(): Promise<Coupon[]> {
    const now = new Date();
    const docs = await CouponModel.find({
      isActive: true,
      isDeleted: false,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ minOrderValue: 1 })
      .lean<Record<string, unknown>[]>();

    return docs.map(toCoupon);
  }

  async getUserRedemptionCount(couponId: string, userId: string): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return 0;
    return CouponRedemptionModel.countDocuments({
      couponId: new mongoose.Types.ObjectId(couponId),
      userId: new mongoose.Types.ObjectId(userId),
    });
  }

  async recordRedemption(
    couponId: string,
    userId: string,
    orderId: string,
    discountAmount: number,
  ): Promise<void> {
    await Promise.all([
      CouponRedemptionModel.create({
        couponId: new mongoose.Types.ObjectId(couponId),
        userId: new mongoose.Types.ObjectId(userId),
        orderId: new mongoose.Types.ObjectId(orderId),
        discountAmount,
      }),
      CouponModel.findByIdAndUpdate(couponId, {
        $inc: { usedCount: 1 },
      }),
    ]);
  }

  async upsert(coupon: Partial<Coupon> & { code: string }): Promise<Coupon> {
    const code = coupon.code.trim().toUpperCase();
    const doc = await CouponModel.findOneAndUpdate(
      { code, isDeleted: false },
      {
        $set: {
          ...coupon,
          code,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean<Record<string, unknown>>();

    return toCoupon(doc);
  }
}
