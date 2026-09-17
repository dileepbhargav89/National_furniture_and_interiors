// Coupon domain types — docs/03_database_design.md §9.3.3 & §9.3.4.
// Framework-free: zero imports from express/mongoose.

export type CouponType = 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
export const COUPON_TYPES: CouponType[] = ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'];

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: CouponType;
  /** Percentage (e.g. 10 for 10%) or fixed amount in paise. */
  value: number;
  /** Minimum subtotal in paise required to qualify. */
  minOrderValue: number;
  /** Maximum discount ceiling in paise (especially for PERCENTAGE). */
  maxDiscountAmount: number | null;
  applicableCategoryIds: string[];
  applicableProductIds: string[];
  usageLimitTotal: number;
  usageLimitPerUser: number;
  usedCount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  userId: string;
  orderId: string;
  discountAmount: number; // paise
  redeemedAt: Date;
}

export interface CouponValidationResult {
  isValid: boolean;
  code: string;
  discountAmount: number; // paise
  message?: string;
  coupon?: Coupon;
}

/**
 * Calculates discount amount in paise based on coupon rules and subtotal.
 */
export function calculateCouponDiscount(coupon: Coupon, subtotalPaise: number): number {
  if (!coupon.isActive || coupon.isDeleted) return 0;
  if (subtotalPaise < coupon.minOrderValue) return 0;

  const now = new Date();
  if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) return 0;

  if (coupon.usageLimitTotal > 0 && coupon.usedCount >= coupon.usageLimitTotal) return 0;

  let calculated = 0;
  if (coupon.type === 'PERCENTAGE') {
    calculated = Math.round((subtotalPaise * coupon.value) / 100);
    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
      calculated = Math.min(calculated, coupon.maxDiscountAmount);
    }
  } else if (coupon.type === 'FIXED') {
    calculated = Math.min(coupon.value, subtotalPaise);
  } else if (coupon.type === 'FREE_SHIPPING') {
    // Shipping is complimentary for Bengaluru, but represented as 0
    calculated = 0;
  }

  return Math.max(0, calculated);
}
