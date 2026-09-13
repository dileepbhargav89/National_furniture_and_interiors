import { AddressSnapshot, Order, CreateOrderParams, PaymentStatus, FulfillmentStatus } from '../domain/orders.types';

export interface CheckoutInput {
  userId: string;
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  couponCode?: string | undefined;
  idempotencyKey: string;
}

export interface ICartProvider {
  getUserCart(userId: string): Promise<any>;
  clearCart(userId: string): Promise<void>;
}

export interface IPaymentProvider {
  createPaymentIntent(orderId: string, amount: number, currency: string): Promise<{ gatewayOrderId: string; status: string }>;
}

export interface IInventoryProvider {
  reserveStock(referenceId: string, items: { productId: string; variantId?: string | undefined; quantity: number }[]): Promise<boolean>;
}
