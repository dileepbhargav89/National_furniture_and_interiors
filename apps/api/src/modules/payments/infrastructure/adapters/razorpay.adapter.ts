// razorpay.adapter.ts — Implements IPaymentProvider (from orders/application/ports.ts).
// This is the concrete Razorpay integration that replaces the mock in composition-root.
// docs/02_enterprise_architecture.md §11 — Order Flow (createPaymentIntent step).
// docs/07_technology_decision_record.md §10 — Razorpay as the payment gateway.
// No direct Razorpay SDK dependency in this file to keep tests simple — the SDK client
// is injected via constructor, following the Dependency Inversion principle.

import { IPaymentProvider } from '../../../orders/application/ports';
import { IPaymentRepository, PayableType, PaymentGateway, PaymentRecordStatus } from '../../domain/payments.types';

/** Minimal shape of the Razorpay SDK orders API used by this adapter. */
export interface IRazorpayClient {
  orders: {
    create(params: {
      amount: number;
      currency: string;
      receipt: string;
    }): Promise<{ id: string; amount: number; currency: string; status: string }>;
  };
}

export class RazorpayPaymentAdapter implements IPaymentProvider {
  constructor(
    private readonly razorpay: IRazorpayClient,
    private readonly paymentRepository: IPaymentRepository
  ) {}

  /**
   * Creates a Razorpay order and persists an initial Payment record.
   * Called by CheckoutUseCase in the orders module via the IPaymentProvider port.
   */
  async createPaymentIntent(
    orderId: string,
    amount: number,
    currency: string
  ): Promise<{ gatewayOrderId: string; status: string }> {
    // 1. Create Razorpay order
    const rzpOrder = await this.razorpay.orders.create({
      amount,   // in paise
      currency,
      receipt: orderId, // Our order ID used as the Razorpay receipt reference
    });

    // 2. Persist initial Payment record (status: CREATED)
    await this.paymentRepository.create({
      payableType: PayableType.ORDER,
      payableId: orderId,
      gateway: PaymentGateway.RAZORPAY,
      gatewayOrderId: rzpOrder.id,
      amount,
      currency,
      status: PaymentRecordStatus.CREATED,
      attemptedAt: new Date(),
    });

    return {
      gatewayOrderId: rzpOrder.id,
      status: PaymentRecordStatus.CREATED,
    };
  }
}
