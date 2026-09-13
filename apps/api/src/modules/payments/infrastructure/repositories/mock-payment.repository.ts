// mock-payment.repository.ts — In-memory implementation of IPaymentRepository for unit tests.
// No database dependency — tests run without MongoDB.

import {
  IPaymentRepository,
  Payment,
  CreatePaymentParams,
  UpdatePaymentCapturedParams,
  PaymentRecordStatus,
} from '../../domain/payments.types';

export class MockPaymentRepository implements IPaymentRepository {
  private store: Map<string, Payment> = new Map();
  private nextId = 1;

  async create(params: CreatePaymentParams): Promise<Payment> {
    const id = `mock-pay-${this.nextId++}`;
    const now = new Date();
    const payment: Payment = {
      id,
      payableType: params.payableType,
      payableId: params.payableId,
      gateway: params.gateway,
      gatewayOrderId: params.gatewayOrderId,
      amount: params.amount,
      currency: params.currency,
      status: params.status,
      attemptedAt: params.attemptedAt,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(params.gatewayOrderId, payment);
    return payment;
  }

  async findByGatewayOrderId(gatewayOrderId: string): Promise<Payment | null> {
    return this.store.get(gatewayOrderId) ?? null;
  }

  async findById(id: string): Promise<Payment | null> {
    return [...this.store.values()].find(p => p.id === id) ?? null;
  }

  async markCaptured(gatewayOrderId: string, params: UpdatePaymentCapturedParams): Promise<Payment | null> {
    const existing = this.store.get(gatewayOrderId);
    if (!existing) return null;
    const updated: Payment = {
      ...existing,
      gatewayPaymentId: params.gatewayPaymentId,
      gatewaySignature: params.gatewaySignature,
      method: params.method,
      rawWebhookPayload: params.rawWebhookPayload,
      capturedAt: params.capturedAt,
      status: PaymentRecordStatus.CAPTURED,
      updatedAt: new Date(),
    };
    this.store.set(gatewayOrderId, updated);
    return updated;
  }

  async findAll(limit: number, offset: number): Promise<Payment[]> {
    return [...this.store.values()].slice(offset, offset + limit);
  }

  async updateReconciliation(id: string, details: any): Promise<Payment | null> {
    const payment = await this.findById(id);
    if (!payment) return null;
    payment.status = PaymentRecordStatus.CAPTURED;
    payment.capturedAt = details.reconciledAt || new Date();
    payment.reconciliationDetails = details;
    payment.updatedAt = new Date();
    return payment;
  }

  async recordRefund(id: string, details: any): Promise<Payment | null> {
    const payment = await this.findById(id);
    if (!payment) return null;
    payment.status = PaymentRecordStatus.REFUNDED;
    payment.refundDetails = details;
    payment.updatedAt = new Date();
    return payment;
  }

  async getMetrics(): Promise<any> {
    const payments = [...this.store.values()];
    let totalRevenue = 0;
    let pendingCount = 0;
    let capturedCount = 0;
    let failedCount = 0;
    let refundedCount = 0;

    for (const p of payments) {
      if (p.status === PaymentRecordStatus.CAPTURED) {
        totalRevenue += p.amount;
        capturedCount++;
      } else if (p.status === PaymentRecordStatus.CREATED || p.status === PaymentRecordStatus.AUTHORIZED) {
        pendingCount++;
      } else if (p.status === PaymentRecordStatus.FAILED) {
        failedCount++;
      } else if (p.status === PaymentRecordStatus.REFUNDED) {
        refundedCount++;
      }
    }

    return {
      totalRevenue,
      pendingCount,
      capturedCount,
      failedCount,
      refundedCount,
      totalCount: payments.length,
      averageOrderValue: capturedCount > 0 ? Math.round(totalRevenue / capturedCount) : 0,
    };
  }

  /** Test helper — reset between tests. */
  reset(): void {
    this.store.clear();
    this.nextId = 1;
  }
}
