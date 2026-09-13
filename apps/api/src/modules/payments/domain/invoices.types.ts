// invoices.types.ts — Domain layer for the payments module's invoice sub-entity.
// docs/03_database_design.md §9.3.6 (invoices collection schema).
// Immutable/append-only: IInvoiceRepository exposes no update or delete methods once AVAILABLE.

export enum InvoiceStatus {
  GENERATING = 'GENERATING',
  AVAILABLE = 'AVAILABLE',
  FAILED = 'FAILED',
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  paymentId: string;
  orderId?: string | undefined;
  amount: number; // in paise
  currency: string;
  fileUrl: string; // Cloudinary or S3 URL
  status: InvoiceStatus;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceParams {
  invoiceNumber: string;
  paymentId: string;
  orderId?: string | undefined;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  fileUrl?: string | undefined;
  issuedAt: Date;
}

export interface UpdateInvoiceStatusParams {
  status: InvoiceStatus;
  fileUrl?: string | undefined;
}

export interface IInvoiceRepository {
  create(params: CreateInvoiceParams): Promise<Invoice>;
  findById(id: string): Promise<Invoice | null>;
  findByPaymentId(paymentId: string): Promise<Invoice | null>;
  findByOrderId(orderId: string): Promise<Invoice | null>;
  updateStatus(id: string, params: UpdateInvoiceStatusParams): Promise<Invoice | null>;
  findAll(limit: number, offset: number): Promise<Invoice[]>;
}
