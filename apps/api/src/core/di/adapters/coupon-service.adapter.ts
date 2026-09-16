import type {
  ICouponService,
  CouponValidationOutput,
  ActiveCouponSummary,
} from '../../../modules/cart/application/ports';
import { MongoCouponRepository } from '../../../modules/orders/infrastructure/repositories/coupon.repository';
import { calculateCouponDiscount } from '../../../modules/orders/domain/coupons.types';

export class CouponServiceAdapter implements ICouponService {
  constructor(private readonly couponRepo: MongoCouponRepository) {}

  async validateAndCalculate(
    code: string,
    subtotal: number,
    userId?: string | null,
  ): Promise<CouponValidationOutput> {
    const formattedCode = code.trim().toUpperCase();
    const coupon = await this.couponRepo.findByCode(formattedCode);

    if (!coupon || !coupon.isActive || coupon.isDeleted) {
      return {
        isValid: false,
        couponCode: formattedCode,
        discountAmount: 0,
        message: 'Invalid or inactive privilege code.',
      };
    }

    const now = new Date();
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return {
        isValid: false,
        couponCode: formattedCode,
        discountAmount: 0,
        message: 'This privilege code has expired or is not yet active.',
      };
    }

    if (subtotal < coupon.minOrderValue) {
      const minINR = Math.round(coupon.minOrderValue / 100).toLocaleString('en-IN');
      return {
        isValid: false,
        couponCode: formattedCode,
        discountAmount: 0,
        message: `Privilege code requires a minimum order of ₹${minINR}.`,
      };
    }

    if (coupon.usageLimitTotal > 0 && coupon.usedCount >= coupon.usageLimitTotal) {
      return {
        isValid: false,
        couponCode: formattedCode,
        discountAmount: 0,
        message: 'This privilege code allocation has been fully claimed.',
      };
    }

    if (userId && coupon.usageLimitPerUser > 0) {
      const userRedemptions = await this.couponRepo.getUserRedemptionCount(coupon.id, userId);
      if (userRedemptions >= coupon.usageLimitPerUser) {
        return {
          isValid: false,
          couponCode: formattedCode,
          discountAmount: 0,
          message: 'You have already redeemed this privilege code.',
        };
      }
    }

    const discountAmount = calculateCouponDiscount(coupon, subtotal);

    return {
      isValid: true,
      couponCode: coupon.code,
      discountAmount,
    };
  }

  async getActiveCoupons(): Promise<ActiveCouponSummary[]> {
    const active = await this.couponRepo.findActiveCoupons();
    return active.map((c) => ({
      code: c.code,
      description: c.description,
      minOrderValue: c.minOrderValue,
      maxDiscountAmount: c.maxDiscountAmount,
      type: c.type,
      value: c.value,
    }));
  }
}
