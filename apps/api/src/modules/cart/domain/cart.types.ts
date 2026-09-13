// Cart domain types — docs/03_database_design.md §9.3.1.
// Framework-free: zero imports from express/mongoose/ioredis.

export type CartStatus = 'ACTIVE' | 'CONVERTED' | 'ABANDONED';
export const CART_STATUSES: CartStatus[] = ['ACTIVE', 'CONVERTED', 'ABANDONED'];

/**
 * docs/03 §9.3.1 — cart item prices are DISPLAY SNAPSHOTS. Never trusted as final amount;
 * re-validated against live catalog at checkout.
 */
export interface CartItem {
  readonly productId: string;
  readonly variantId: string;
  readonly sku: string;
  readonly name: string;
  readonly image: string;
  /** Snapshot price in paise — docs/03 §2. */
  readonly unitPrice: number;
  readonly quantity: number;
  readonly addedAt: Date;
}

export interface Cart {
  readonly id: string;
  readonly userId: string | null; // null for guest carts
  readonly sessionId: string | null;
  readonly items: ReadonlyArray<CartItem>;
  readonly couponCode: string | null;
  readonly subtotal: number; // paise
  readonly discount: number; // paise
  readonly total: number; // paise
  readonly status: CartStatus;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ---- Domain helpers -------------------------------------------------------------------------

const MAX_ITEMS_PER_CART = 50;

/** Recalculates subtotal/total from current items. */
export function calculateCartTotals(items: ReadonlyArray<CartItem>, discount = 0): {
  subtotal: number;
  discount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total };
}

/** Validates adding an item won't exceed the cart limit. */
export function canAddItem(cart: Cart, additionalQty = 1): boolean {
  const totalItems = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  return totalItems + additionalQty <= MAX_ITEMS_PER_CART;
}
