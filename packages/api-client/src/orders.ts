import { apiClient } from './client';
import { PaginatedResponse } from '@nfi/shared';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum FulfillmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export interface AddressSnapshot {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface OrderPricing {
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  currency: string;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface StatusEvent {
  status: string;
  note?: string;
  changedBy?: string;
  changedAt: string;
}

export interface Order {
  id: string;
  _id?: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  pricing: OrderPricing;
  couponCode?: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  warehouseId?: string;
  timeline: StatusEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  items: Omit<OrderItem, 'lineTotal'>[];
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  couponCode?: string;
  // Note: the backend might calculate pricing, but if frontend needs to send it:
  pricing?: OrderPricing; 
}

export const OrdersService = {
  // Storefront methods
  createOrder: (data: CreateOrderRequest, idempotencyKey?: string) => {
    const key = idempotencyKey || `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return apiClient.post<{ order: Order; paymentIntent: Record<string, unknown> }>('/api/v1/orders', data, {
      headers: { 'idempotency-key': key }
    });
  },
    
  getMyOrders: () =>
    apiClient.get<{ orders: Order[] }>('/api/v1/orders/my-orders'),
    
  getOrder: (id: string) =>
    apiClient.get<{ order: Order }>(`/api/v1/orders/${id}`),
    
  getOrderInvoice: (id: string) =>
    apiClient.get<{ id: string; url: string; status: string }>(`/api/v1/orders/${id}/invoice`),

  // Admin methods
  getAllOrders: (params?: { status?: FulfillmentStatus; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Order>>('/api/v1/admin/orders', params ? { params: params as Record<string, unknown> } : undefined),
    
  getAdminOrder: (id: string) =>
    apiClient.get<{ order: Order }>(`/api/v1/admin/orders/${id}`),

  updateFulfillmentStatus: (id: string, status: FulfillmentStatus, note?: string) =>
    apiClient.patch<{ order: Order }>(`/api/v1/admin/orders/${id}/fulfillment-status`, { status, note }),
    
  updatePaymentStatus: (id: string, status: PaymentStatus) =>
    apiClient.patch<{ order: Order }>(`/api/v1/admin/orders/${id}/payment-status`, { status }),
};
