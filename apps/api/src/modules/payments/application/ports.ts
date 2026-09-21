// ports.ts — Application-layer ports consumed by this module's use cases.
// These are abstract interfaces implemented in infrastructure — the Application layer
// never imports concrete classes (docs/02_enterprise_architecture.md §5 dependency rule).

export interface OrderPaymentDetails {
  orderId: string;
  orderNumber: string;
  userId: string;
  customerEmail?: string | undefined;
  customerName?: string | undefined;
  items: Array<{
    productId: string;
    variantId?: string | undefined;
    quantity: number;
    name?: string | undefined;
    unitPrice?: number | undefined;
  }>;
  totalAmount: number;
  paymentPlan?: 'FULL' | 'MILESTONE_50_50' | undefined;
  shippingAddress?:
    | {
        label?: string | undefined;
        line1: string;
        city: string;
        state: string;
        pincode: string;
      }
    | undefined;
}

/** Port to the orders module — update an order's payment status after webhook confirmation. */
export interface IOrderPaymentPort {
  markOrderPaid(
    orderId: string,
  ): Promise<Array<{ productId: string; variantId?: string | undefined; quantity: number }>>;
  markOrderPaymentFailed(
    orderId: string,
  ): Promise<Array<{ productId: string; variantId?: string | undefined; quantity: number }>>;
  getOrderDetails?(orderId: string): Promise<OrderPaymentDetails | null>;
}

/** Port to the catalog/inventory module — commit or release a stock reservation. */
export interface IInventoryCommitPort {
  commitStockDeduction(
    referenceId: string,
    items: Array<{ productId: string; variantId?: string | undefined; quantity: number }>,
  ): Promise<void>;
  releaseReservation(
    referenceId: string,
    items: Array<{ productId: string; variantId?: string | undefined; quantity: number }>,
  ): Promise<void>;
}

/** Parsed, verified webhook event from Razorpay. */
export interface RazorpayWebhookEvent {
  event: string; // e.g. 'payment.captured', 'payment.failed'
  gatewayOrderId: string; // razorpay_order_id
  gatewayPaymentId: string; // razorpay_payment_id
  gatewaySignature: string;
  amount: number; // paise
  method?: string | undefined;
  rawPayload: Record<string, unknown>;
}

/** Port for uploading generated PDFs */
export interface IFileUploaderPort {
  uploadPdf(buffer: Buffer, filename: string): Promise<string>;
}

/** Port for creating payment intents with the payment gateway. */
export interface IPaymentIntentGateway {
  createPaymentIntent(
    orderId: string,
    amount: number,
    currency: string,
  ): Promise<{ gatewayOrderId: string; status: string }>;
}

/** Function type for verifying webhook cryptographic signatures. */
export type RazorpaySignatureVerifierFn = (
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
) => boolean;
