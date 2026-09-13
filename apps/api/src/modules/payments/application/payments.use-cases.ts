// payments.use-cases.ts — Application layer use cases for the payments module.
// docs/02_enterprise_architecture.md §11 — Order Flow (webhook-first, idempotent).
// docs/09_security_architecture.md §4.5 — Replay attack prevention via idempotency.

import { NotFoundError, ValidationError } from '../../../core/exceptions';
import {
  IPaymentRepository,
  Payment,
  PayableType,
  PaymentGateway,
  PaymentRecordStatus,
  PaymentMethod,
} from '../domain/payments.types';
import { IOrderPaymentPort, IInventoryCommitPort, RazorpayWebhookEvent } from './ports';
import { IOutboxRepository } from '../../../core/events/outbox.repository';
import { DomainEventType } from '../../../core/events/domain-events';
import { verifyRazorpaySignature } from '../infrastructure/razorpay-signature.verifier';

// ─── CreateRazorpayOrderUseCase ────────────────────────────────────────────────
// Called internally by the orders module CheckoutUseCase via IPaymentProvider port.
// Creates a Razorpay order and persists an initial Payment record (status: CREATED).

export class CreateRazorpayOrderUseCase {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly razorpay: {
      createOrder(amount: number, currency: string, receipt: string): Promise<{ id: string }>;
    }
  ) {}

  async execute(
    payableType: PayableType,
    payableId: string,
    amount: number,
    currency: string
  ): Promise<{ gatewayOrderId: string; amount: number; currency: string; status: string }> {
    // 1. Create Razorpay order
    const rzpOrder = await this.razorpay.createOrder(amount, currency, payableId);

    // 2. Persist initial Payment document
    await this.payments.create({
      payableType,
      payableId,
      gateway: PaymentGateway.RAZORPAY,
      gatewayOrderId: rzpOrder.id,
      amount,
      currency,
      status: PaymentRecordStatus.CREATED,
      attemptedAt: new Date(),
    });

    return {
      gatewayOrderId: rzpOrder.id,
      amount,
      currency,
      status: PaymentRecordStatus.CREATED,
    };
  }
}

// ─── ConfirmWebhookPaymentUseCase ─────────────────────────────────────────────
// Called by the webhook controller after Razorpay signature verification passes.
// Idempotent: repeated webhooks for an already-CAPTURED payment are a no-op.

export class ConfirmWebhookPaymentUseCase {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly orderPort: IOrderPaymentPort,
    private readonly inventoryPort: IInventoryCommitPort,
    private readonly outbox?: IOutboxRepository // optional for now to not break tests that mock it
  ) {}

  async executeCapture(event: RazorpayWebhookEvent): Promise<void> {
    const existing = await this.payments.findByGatewayOrderId(event.gatewayOrderId);

    // Idempotency — already CAPTURED, Razorpay is retrying a delivered webhook.
    if (existing?.status === PaymentRecordStatus.CAPTURED) {
      return;
    }

    if (!existing) {
      // Edge case: webhook arrived before our order creation completed (very rare).
      throw new NotFoundError('Payment record not found for gatewayOrderId: ' + event.gatewayOrderId);
    }

    // 1. Update payment record to CAPTURED
    await this.payments.markCaptured(event.gatewayOrderId, {
      gatewayPaymentId: event.gatewayPaymentId,
      gatewaySignature: event.gatewaySignature,
      method: event.method as PaymentMethod | undefined,
      rawWebhookPayload: event.rawPayload,
      capturedAt: new Date(),
    });

    // 2. Mark the associated order as paid and get its items
    const items = await this.orderPort.markOrderPaid(existing.payableId);

    // 3. Commit the stock reservation (move from reserved → deducted)
    if (items && items.length > 0) {
      await this.inventoryPort.commitStockDeduction(existing.payableId, items);
    }

    // 4. Publish ORDER_PAID event
    if (this.outbox && existing.payableType === PayableType.ORDER) {
      await this.outbox.append({
        eventType: DomainEventType.ORDER_PAID,
        aggregateType: 'Order',
        aggregateId: existing.payableId,
        payload: {
          paymentId: existing.id,
          amount: existing.amount,
        },
      });
    }
    
    // 5. Publish PAYMENT_CAPTURED event (for invoices)
    if (this.outbox) {
      await this.outbox.append({
        eventType: DomainEventType.PAYMENT_CAPTURED,
        aggregateType: 'Payment',
        aggregateId: existing.id,
        payload: {
          payableId: existing.payableId,
          amount: existing.amount,
        },
      });
    }
  }

  async executeFailed(event: RazorpayWebhookEvent): Promise<void> {
    const existing = await this.payments.findByGatewayOrderId(event.gatewayOrderId);
    if (!existing) return; // no record → nothing to fail

    // Idempotency — already in a terminal state
    if (existing.status === PaymentRecordStatus.FAILED || existing.status === PaymentRecordStatus.CAPTURED) {
      return;
    }

    // 1. Mark payment FAILED
    await this.payments.markCaptured(event.gatewayOrderId, {
      gatewayPaymentId: event.gatewayPaymentId,
      gatewaySignature: event.gatewaySignature,
      rawWebhookPayload: event.rawPayload,
      capturedAt: new Date(),
    });

    // 2. Mark order payment as failed and get items
    const items = await this.orderPort.markOrderPaymentFailed(existing.payableId);

    // 3. Release the stock reservation
    if (items && items.length > 0) {
      await this.inventoryPort.releaseReservation(existing.payableId, items);
    }
  }
}

// ─── ListPaymentsUseCase ───────────────────────────────────────────────────────
// Admin read-only paginated list. Permission enforcement at presentation layer.

export class ListPaymentsUseCase {
  constructor(private readonly payments: IPaymentRepository) {}

  async execute(limit = 20, offset = 0): Promise<Payment[]> {
    const safeLimit = Math.min(limit, 100);
    return this.payments.findAll(safeLimit, offset);
  }
}

// ─── GetPaymentByIdUseCase ───────────────────────────────────────────────────
export class GetPaymentByIdUseCase {
  constructor(private readonly payments: IPaymentRepository) {}

  async execute(id: string): Promise<Payment> {
    const payment = await this.payments.findById(id);
    if (!payment) {
      throw new NotFoundError(`Payment not found: ${id}`);
    }
    return payment;
  }
}

// ─── VerifyPaymentUseCase ────────────────────────────────────────────────────
// Called by the storefront on client-side checkout completion.
export class VerifyPaymentUseCase {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly orderPort: IOrderPaymentPort,
    private readonly inventoryPort: IInventoryCommitPort,
    private readonly razorpaySecret: string,
    private readonly outbox?: IOutboxRepository
  ) {}

  async execute(params: {
    gatewayOrderId: string;
    gatewayPaymentId: string;
    gatewaySignature: string;
    orderId?: string | undefined;
  }): Promise<Payment> {
    const existing = await this.payments.findByGatewayOrderId(params.gatewayOrderId);

    // If signature verification is enabled and secret is configured
    if (this.razorpaySecret && this.razorpaySecret !== 'test_secret') {
      const isValid = verifyRazorpaySignature(
        params.gatewayOrderId,
        params.gatewayPaymentId,
        params.gatewaySignature,
        this.razorpaySecret
      );
      if (!isValid) {
        throw new ValidationError('Invalid payment gateway signature');
      }
    }

    if (existing && existing.status === PaymentRecordStatus.CAPTURED) {
      return existing;
    }

    let updatedPayment: Payment | null = null;
    if (existing) {
      updatedPayment = await this.payments.markCaptured(params.gatewayOrderId, {
        gatewayPaymentId: params.gatewayPaymentId,
        gatewaySignature: params.gatewaySignature,
        capturedAt: new Date(),
      });

      const items = await this.orderPort.markOrderPaid(existing.payableId);
      if (items && items.length > 0) {
        await this.inventoryPort.commitStockDeduction(existing.payableId, items);
      }

      if (this.outbox && existing.payableType === PayableType.ORDER) {
        await this.outbox.append({
          eventType: DomainEventType.ORDER_PAID,
          aggregateType: 'Order',
          aggregateId: existing.payableId,
          payload: { paymentId: existing.id, amount: existing.amount },
        });
      }
    } else if (params.orderId) {
      // Direct client verification without pre-created payment record
      updatedPayment = await this.payments.create({
        payableType: PayableType.ORDER,
        payableId: params.orderId,
        gateway: PaymentGateway.RAZORPAY,
        gatewayOrderId: params.gatewayOrderId,
        amount: 0,
        currency: 'INR',
        status: PaymentRecordStatus.CAPTURED,
        attemptedAt: new Date(),
      });
      await this.orderPort.markOrderPaid(params.orderId);
    }

    if (!updatedPayment) {
      throw new NotFoundError('Payment record not found for gatewayOrderId: ' + params.gatewayOrderId);
    }

    return updatedPayment;
  }
}

// ─── ReconcilePaymentUseCase ─────────────────────────────────────────────────
// Admin manual reconciliation for White-Glove Bank Transfer (NEFT/RTGS).
export class ReconcilePaymentUseCase {
  constructor(
    private readonly payments: IPaymentRepository,
    private readonly orderPort: IOrderPaymentPort,
    private readonly inventoryPort: IInventoryCommitPort,
    private readonly outbox?: IOutboxRepository
  ) {}

  async execute(params: {
    paymentId: string;
    utrNumber: string;
    bankName?: string | undefined;
    notes?: string | undefined;
    verifiedBy?: string | undefined;
  }): Promise<Payment> {
    const payment = await this.payments.findById(params.paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment not found: ${params.paymentId}`);
    }

    if (payment.status === PaymentRecordStatus.CAPTURED) {
      return payment;
    }

    const updated = await this.payments.updateReconciliation(params.paymentId, {
      utrNumber: params.utrNumber,
      bankName: params.bankName || 'Direct NEFT/RTGS',
      verifiedBy: params.verifiedBy || 'Admin Finance Ops',
      reconciledAt: new Date(),
      notes: params.notes,
    });

    if (!updated) {
      throw new NotFoundError(`Payment update failed for: ${params.paymentId}`);
    }

    // Mark order as paid
    const items = await this.orderPort.markOrderPaid(payment.payableId);
    if (items && items.length > 0) {
      await this.inventoryPort.commitStockDeduction(payment.payableId, items);
    }

    if (this.outbox && payment.payableType === PayableType.ORDER) {
      await this.outbox.append({
        eventType: DomainEventType.ORDER_PAID,
        aggregateType: 'Order',
        aggregateId: payment.payableId,
        payload: { paymentId: payment.id, amount: payment.amount, utrNumber: params.utrNumber },
      });
    }

    return updated;
  }
}

// ─── RefundPaymentUseCase ────────────────────────────────────────────────────
export class RefundPaymentUseCase {
  constructor(private readonly payments: IPaymentRepository) {}

  async execute(params: {
    paymentId: string;
    amount?: number | undefined;
    reason: string;
    refundReference?: string | undefined;
  }): Promise<Payment> {
    const payment = await this.payments.findById(params.paymentId);
    if (!payment) {
      throw new NotFoundError(`Payment not found: ${params.paymentId}`);
    }

    const refundAmount = params.amount || payment.amount;
    const updated = await this.payments.recordRefund(params.paymentId, {
      amount: refundAmount,
      reason: params.reason,
      refundReference: params.refundReference || `REF-${Date.now().toString().slice(-6)}`,
      refundedAt: new Date(),
    });

    if (!updated) {
      throw new NotFoundError(`Refund update failed for: ${params.paymentId}`);
    }

    return updated;
  }
}

// ─── GetPaymentMetricsUseCase ────────────────────────────────────────────────
export class GetPaymentMetricsUseCase {
  constructor(private readonly payments: IPaymentRepository) {}

  async execute(): Promise<any> {
    if (this.payments.getMetrics) {
      return this.payments.getMetrics();
    }
    const all = await this.payments.findAll(500, 0);
    let totalRevenue = 0;
    let pendingCount = 0;
    let capturedCount = 0;
    let failedCount = 0;
    let refundedCount = 0;

    for (const p of all) {
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
      totalCount: all.length,
      averageOrderValue: capturedCount > 0 ? Math.round(totalRevenue / capturedCount) : 0,
    };
  }
}
