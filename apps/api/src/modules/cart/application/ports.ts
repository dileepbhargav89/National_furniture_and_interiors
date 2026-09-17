// Cart port interfaces — docs/02 §7.1/§7.3.
import type { Cart, CartItem } from '../domain/cart.types';

export interface AddItemInput {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface ICartRepository {
  findByUser(userId: string): Promise<Cart | null>;
  findBySession(sessionId: string): Promise<Cart | null>;
  /** Creates a new empty cart for the given user or session. */
  create(input: { userId: string | null; sessionId: string | null }): Promise<Cart>;
  /** Replaces items array and recomputes totals. */
  updateItems(cartId: string, items: CartItem[], discount?: number): Promise<Cart>;
  /** Updates active coupon code and discount on the cart. */
  updateCoupon(cartId: string, couponCode: string | null, discount: number): Promise<Cart>;
  markConverted(cartId: string): Promise<void>;
  /** Merges a guest cart's items into a user cart and deletes the guest cart. */
  mergeAndDelete(guestCartId: string, userCartId: string): Promise<Cart>;
}

export interface CouponValidationOutput {
  isValid: boolean;
  couponCode: string;
  discountAmount: number;
  message?: string;
}

export interface ActiveCouponSummary {
  code: string;
  description: string;
  minOrderValue: number;
  maxDiscountAmount: number | null;
  type: string;
  value: number;
}

export interface ICouponService {
  validateAndCalculate(
    code: string,
    subtotal: number,
    userId?: string | null,
  ): Promise<CouponValidationOutput>;
  getActiveCoupons(): Promise<ActiveCouponSummary[]>;
}

/**
 * Cross-module dependency on catalog — docs/06 §4.3 / §1.6.
 * Cart never imports catalog's infrastructure or domain directly.
 */
export interface IProductSnapshotProvider {
  getSnapshot(
    productId: string,
    variantId: string,
  ): Promise<{
    sku: string;
    name: string;
    image: string;
    unitPrice: number;
    isAvailable: boolean;
  } | null>;
}
