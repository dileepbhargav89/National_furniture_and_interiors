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

export interface Money {
  amount: number; // in paise
  currency: string;
}

export interface OrderItem {
  productId: string;
  variantId?: string | undefined;
  sku: string;
  name: string;
  image?: string | undefined;
  unitPrice: number; // in paise
  quantity: number;
  lineTotal: number; // in paise
  hsnCode?: string | undefined;
}

export interface AddressSnapshot {
  label?: string | undefined;
  line1: string;
  line2?: string | undefined;
  city: string;
  state: string;
  pincode: string;
  country: string;
  companyName?: string | undefined;
  gstin?: string | undefined;
}

export interface TaxBreakdown {
  cgst: number; // in paise
  sgst: number; // in paise
  igst: number; // in paise
  rate: number; // e.g. 18 for 18% GST
  isInterState: boolean;
}

export interface OrderPricing {
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
  currency: string;
  taxBreakdown?: TaxBreakdown | undefined;
}

export interface StatusEvent {
  status: string;
  note?: string | undefined;
  changedBy?: string | undefined;
  changedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  pricing: OrderPricing;
  couponCode?: string | undefined;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  companyName?: string | undefined;
  customerGstin?: string | undefined;
  paymentPlan?: 'FULL' | 'MILESTONE_50_50' | undefined;
  warehouseId?: string | undefined;
  timeline: StatusEvent[];

  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  version: number;
}

export interface CreateOrderParams {
  userId: string;
  items: OrderItem[];
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
  pricing: OrderPricing;
  couponCode?: string | undefined;
  companyName?: string | undefined;
  customerGstin?: string | undefined;
  paymentPlan?: 'FULL' | 'MILESTONE_50_50' | undefined;
}

export interface IOrderRepository {
  create(data: CreateOrderParams): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findAll(skip?: number, limit?: number): Promise<Order[]>;
  findUserOrders(userId: string): Promise<Order[]>;
  updateFulfillmentStatus(
    id: string,
    status: FulfillmentStatus,
    note?: string,
  ): Promise<Order | null>;
  updatePaymentStatus(id: string, status: PaymentStatus): Promise<Order | null>;
  getSalesMetrics(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  }>;
}
