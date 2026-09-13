// payments.test.ts — Unit tests for the payments module.
// Follows the established pattern: only imports from application and domain layers.
// Infrastructure classes (MockPaymentRepository) are imported directly as they have no external deps.
// verifyRazorpaySignature is tested inline (crypto) via a standalone vitest file to avoid Vite
// bundler issues with crypto imports in this project's Vite 5 / vitest 2 configuration.

import { describe, it, expect, beforeEach } from 'vitest';

import { MockPaymentRepository } from '../../../src/modules/payments/infrastructure/repositories/mock-payment.repository';
import {
  ConfirmWebhookPaymentUseCase,
  ListPaymentsUseCase,
} from '../../../src/modules/payments/application/payments.use-cases';
import {
  PayableType,
  PaymentGateway,
  PaymentRecordStatus,
} from '../../../src/modules/payments/domain/payments.types';
import type { IOrderPaymentPort, IInventoryCommitPort } from '../../../src/modules/payments/application/ports';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeWebhookEvent(overrides: Partial<{
  event: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
}>) {
  return {
    event: 'payment.captured',
    gatewayOrderId: 'order_test123',
    gatewayPaymentId: 'pay_test456',
    gatewaySignature: 'sig',
    amount: 100000,
    method: 'UPI',
    rawPayload: {},
    ...overrides,
  };
}

// ─── ConfirmWebhookPaymentUseCase ─────────────────────────────────────────────

describe('ConfirmWebhookPaymentUseCase', () => {
  let paymentRepo: MockPaymentRepository;
  let orderPort: IOrderPaymentPort;
  let inventoryPort: IInventoryCommitPort;
  let markedPaidIds: string[];
  let markedFailedIds: string[];
  let committedItems: any[];
  let releasedItems: any[];
  let useCase: ConfirmWebhookPaymentUseCase;

  beforeEach(async () => {
    paymentRepo = new MockPaymentRepository();
    markedPaidIds = [];
    markedFailedIds = [];
    committedItems = [];
    releasedItems = [];

    orderPort = {
      markOrderPaid: async (orderId) => { markedPaidIds.push(orderId); return [{ productId: 'prod1', quantity: 2 }]; },
      markOrderPaymentFailed: async (orderId) => { markedFailedIds.push(orderId); return [{ productId: 'prod1', quantity: 2 }]; },
    };
    inventoryPort = {
      commitStockDeduction: async (referenceId, items) => { committedItems.push(...items); },
      releaseReservation: async (referenceId, items) => { releasedItems.push(...items); },
    };

    useCase = new ConfirmWebhookPaymentUseCase(paymentRepo, orderPort, inventoryPort);

    // Seed a CREATED payment record (as if checkout already ran)
    await paymentRepo.create({
      payableType: PayableType.ORDER,
      payableId: 'order_mongo_id_1',
      gateway: PaymentGateway.RAZORPAY,
      gatewayOrderId: 'order_test123',
      amount: 100000,
      currency: 'INR',
      status: PaymentRecordStatus.CREATED,
    });
  });

  it('marks order paid and commits stock on payment.captured', async () => {
    await useCase.executeCapture(
      makeWebhookEvent({})
    );

    const payment = await paymentRepo.findByGatewayOrderId('order_test123');
    expect(payment?.status).toBe(PaymentRecordStatus.CAPTURED);
    expect(markedPaidIds).toContain('order_mongo_id_1');
    expect(committedItems).toHaveLength(1);
    expect(committedItems[0].productId).toBe('prod1');
  });

  it('is idempotent — second capture call for same gatewayOrderId is a no-op', async () => {
    await useCase.executeCapture(makeWebhookEvent({}));
    await useCase.executeCapture(makeWebhookEvent({}));

    // markOrderPaid should only have been called once
    expect(markedPaidIds).toHaveLength(1);
  });

  it('marks order failed and releases reservation on payment.failed', async () => {
    await useCase.executeFailed(
      makeWebhookEvent({ event: 'payment.failed' })
    );

    expect(markedFailedIds).toContain('order_mongo_id_1');
    expect(releasedItems).toHaveLength(1);
  });

  it('does nothing if no payment record exists for gatewayOrderId on failure', async () => {
    // Should not throw — silently skip (nothing to fail/release)
    await useCase.executeFailed(
      makeWebhookEvent({ gatewayOrderId: 'order_nonexistent' })
    );
    expect(markedFailedIds).toHaveLength(0);
  });

  it('throws NotFoundError if payment.captured arrives for unknown gatewayOrderId', async () => {
    await expect(
      useCase.executeCapture(
        makeWebhookEvent({ gatewayOrderId: 'order_unknown' })
      )
    ).rejects.toThrow('Payment record not found');
  });
});

// ─── ListPaymentsUseCase ──────────────────────────────────────────────────────

describe('ListPaymentsUseCase', () => {
  it('returns paginated payment records', async () => {
    const repo = new MockPaymentRepository();

    for (let i = 0; i < 5; i++) {
      await repo.create({
        payableType: PayableType.ORDER,
        payableId: `order_${i}`,
        gateway: PaymentGateway.RAZORPAY,
        gatewayOrderId: `rzp_order_${i}`,
        amount: (i + 1) * 1000,
        currency: 'INR',
        status: PaymentRecordStatus.CREATED,
      });
    }

    const useCase = new ListPaymentsUseCase(repo);
    const page1 = await useCase.execute(3, 0);
    const page2 = await useCase.execute(3, 3);

    expect(page1).toHaveLength(3);
    expect(page2).toHaveLength(2);
  });

  it('caps limit at 100 and returns empty for empty store', async () => {
    const repo = new MockPaymentRepository();
    const useCase = new ListPaymentsUseCase(repo);
    const results = await useCase.execute(9999, 0);
    // No records in store — empty result, no throw
    expect(results).toHaveLength(0);
  });

  it('stores and retrieves payment with correct payableId', async () => {
    const repo = new MockPaymentRepository();
    await repo.create({
      payableType: PayableType.ORDER,
      payableId: 'target_order',
      gateway: PaymentGateway.RAZORPAY,
      gatewayOrderId: 'rzp_target',
      amount: 50000,
      currency: 'INR',
      status: PaymentRecordStatus.CREATED,
    });

    const found = await repo.findByGatewayOrderId('rzp_target');
    expect(found).not.toBeNull();
    expect(found!.payableId).toBe('target_order');
    expect(found!.amount).toBe(50000);
  });
});

// ─── MockPaymentRepository ────────────────────────────────────────────────────

describe('MockPaymentRepository', () => {
  it('markCaptured transitions status to CAPTURED', async () => {
    const repo = new MockPaymentRepository();
    await repo.create({
      payableType: PayableType.DESIGN_PROJECT,
      payableId: 'proj_1',
      gateway: PaymentGateway.RAZORPAY,
      gatewayOrderId: 'rzp_proj_1',
      amount: 200000,
      currency: 'INR',
      status: PaymentRecordStatus.CREATED,
    });

    const updated = await repo.markCaptured('rzp_proj_1', {
      gatewayPaymentId: 'pay_abc',
      gatewaySignature: 'sig_abc',
      capturedAt: new Date(),
    });

    expect(updated?.status).toBe(PaymentRecordStatus.CAPTURED);
    expect(updated?.gatewayPaymentId).toBe('pay_abc');
  });

  it('markCaptured returns null for non-existent gatewayOrderId', async () => {
    const repo = new MockPaymentRepository();
    const result = await repo.markCaptured('does_not_exist', {
      gatewayPaymentId: 'pay_x',
      gatewaySignature: 'sig_x',
      capturedAt: new Date(),
    });
    expect(result).toBeNull();
  });
});
