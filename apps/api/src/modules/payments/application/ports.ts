// ports.ts — Application-layer ports consumed by this module's use cases.
// These are abstract interfaces implemented in infrastructure — the Application layer
// never imports concrete classes (docs/02_enterprise_architecture.md §5 dependency rule).

/** Port to the orders module — update an order's payment status after webhook confirmation. */
export interface IOrderPaymentPort {
  markOrderPaid(orderId: string): Promise<Array<{ productId: string; variantId?: string | undefined; quantity: number }>>;
  markOrderPaymentFailed(orderId: string): Promise<Array<{ productId: string; variantId?: string | undefined; quantity: number }>>;
}

/** Port to the catalog/inventory module — commit or release a stock reservation. */
export interface IInventoryCommitPort {
  commitStockDeduction(
    referenceId: string,
    items: Array<{ productId: string; variantId?: string | undefined; quantity: number }>
  ): Promise<void>;
  releaseReservation(
    referenceId: string,
    items: Array<{ productId: string; variantId?: string | undefined; quantity: number }>
  ): Promise<void>;
}

/** Parsed, verified webhook event from Razorpay. */
export interface RazorpayWebhookEvent {
  event: string;            // e.g. 'payment.captured', 'payment.failed'
  gatewayOrderId: string;   // razorpay_order_id
  gatewayPaymentId: string; // razorpay_payment_id
  gatewaySignature: string;
  amount: number;           // paise
  method?: string | undefined;
  rawPayload: Record<string, unknown>;
}

/** Port for uploading generated PDFs */
export interface IFileUploaderPort {
  uploadPdf(buffer: Buffer, filename: string): Promise<string>;
}
