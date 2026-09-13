// payments.types.ts — Domain layer for the payments module.
// docs/03_database_design.md §9.3.6 (payments collection schema).
// docs/02_enterprise_architecture.md §11 (Order Flow — polymorphic payment pattern).
// Immutable/append-only: IPaymentRepository exposes no update or delete methods.

export enum PayableType {
  ORDER = 'ORDER',
  DESIGN_PROJECT = 'DESIGN_PROJECT',
}

export enum PaymentGateway {
  RAZORPAY = 'RAZORPAY',
  MANUAL_BANK_TRANSFER = 'MANUAL_BANK_TRANSFER',
  WHITE_GLOVE_OFFLINE = 'WHITE_GLOVE_OFFLINE',
}

export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'CARD',
  NETBANKING = 'NETBANKING',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
  EMI = 'EMI',
  COD = 'COD',
}

// docs/03 §9.3.6 — status lifecycle for a single payment record.
export enum PaymentRecordStatus {
  CREATED = 'CREATED',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface ReconciliationDetails {
  utrNumber: string;
  bankName?: string | undefined;
  verifiedBy?: string | undefined;
  reconciledAt: Date;
  notes?: string | undefined;
}

export interface RefundDetails {
  amount: number; // paise
  reason: string;
  refundReference?: string | undefined;
  refundedAt: Date;
}

// docs/03 §9.3.6 — full payment document shape.
export interface Payment {
  id: string;
  payableType: PayableType;
  payableId: string; // orderId or designProjectId
  gateway: PaymentGateway;
  gatewayOrderId: string;              // Razorpay order_id or internal bank ref
  gatewayPaymentId?: string | undefined;
  gatewaySignature?: string | undefined;
  amount: number;                       // in paise (integer, never float)
  currency: string;
  method?: PaymentMethod | undefined;
  status: PaymentRecordStatus;
  reconciliationDetails?: ReconciliationDetails | undefined;
  refundDetails?: RefundDetails | undefined;
  rawWebhookPayload?: Record<string, unknown> | undefined;
  attemptedAt?: Date | undefined;
  capturedAt?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentParams {
  payableType: PayableType;
  payableId: string;
  gateway: PaymentGateway;
  gatewayOrderId: string;
  amount: number; // paise
  currency: string;
  status: PaymentRecordStatus;
  attemptedAt?: Date | undefined;
}

export interface UpdatePaymentCapturedParams {
  gatewayPaymentId: string;
  gatewaySignature: string;
  method?: PaymentMethod | undefined;
  rawWebhookPayload?: Record<string, unknown> | undefined;
  capturedAt: Date;
}

export interface PaymentMetrics {
  totalRevenue: number;
  pendingCount: number;
  capturedCount: number;
  failedCount: number;
  refundedCount: number;
  totalCount: number;
  averageOrderValue: number;
}

// IPaymentRepository — append-only by design (docs/03 §3.1).
// No update/delete methods. Corrections are new compensating records.
export interface IPaymentRepository {
  create(params: CreatePaymentParams): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  /** Idempotency check — used by webhook handler before processing. */
  findByGatewayOrderId(gatewayOrderId: string): Promise<Payment | null>;
  /** Update status and capture metadata — used only by webhook confirmation. */
  markCaptured(gatewayOrderId: string, params: UpdatePaymentCapturedParams): Promise<Payment | null>;
  /** Manual White-Glove NEFT reconciliation */
  updateReconciliation(id: string, details: ReconciliationDetails): Promise<Payment | null>;
  /** Record transaction refund */
  recordRefund(id: string, details: RefundDetails): Promise<Payment | null>;
  /** Admin paginated list. */
  findAll(limit: number, offset: number): Promise<Payment[]>;
  /** Financial and operational KPIs */
  getMetrics?(): Promise<PaymentMetrics>;
}

