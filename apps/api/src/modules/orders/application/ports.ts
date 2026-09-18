import { AddressSnapshot } from '../domain/orders.types';

export interface CheckoutInput {
  userId: string;
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  couponCode?: string | undefined;
  companyName?: string | undefined;
  customerGstin?: string | undefined;
  paymentPlan?: 'FULL' | 'MILESTONE_50_50' | undefined;
  idempotencyKey: string;
}

export interface CartSnapshotItem {
  productId: string;
  variantId?: string | undefined;
  sku: string;
  name: string;
  image?: string | undefined;
  unitPrice: number;
  quantity: number;
  hsnCode?: string | undefined;
}

export interface CartSnapshot {
  items: CartSnapshotItem[];
  subtotal: number;
  discount: number;
  total: number;
}

export interface ICartProvider {
  getUserCart(userId: string): Promise<CartSnapshot | null>;
  clearCart(userId: string): Promise<void>;
}

export interface IPaymentProvider {
  createPaymentIntent(
    orderId: string,
    amount: number,
    currency: string,
  ): Promise<{ gatewayOrderId: string; status: string }>;
}

export interface IInventoryProvider {
  reserveStock(
    referenceId: string,
    items: { productId: string; variantId?: string | undefined; quantity: number }[],
  ): Promise<boolean>;
}
