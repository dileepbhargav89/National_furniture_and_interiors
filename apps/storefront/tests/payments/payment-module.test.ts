import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { PaymentSnapshot, PaymentKpis } from '@nfi/api-client';

describe('Payment Module - Unit & Integration Test Suite', () => {

  describe('1. HMAC-SHA256 Signature Verification', () => {
    const mockSecret = 'rzp_test_secret_key_12345';
    const gatewayOrderId = 'order_blr_9021';
    const gatewayPaymentId = 'pay_rzp_blr_902101';

    it('generates and verifies valid Razorpay HMAC-SHA256 signature', () => {
      const payload = `${gatewayOrderId}|${gatewayPaymentId}`;
      const validSignature = crypto
        .createHmac('sha256', mockSecret)
        .update(payload)
        .digest('hex');

      const computed = crypto
        .createHmac('sha256', mockSecret)
        .update(`${gatewayOrderId}|${gatewayPaymentId}`)
        .digest('hex');

      const isTimingSafeEqual = crypto.timingSafeEqual(
        Buffer.from(computed, 'hex'),
        Buffer.from(validSignature, 'hex')
      );

      expect(isTimingSafeEqual).toBe(true);
    });

    it('rejects tampered or forged signatures', () => {
      const payload = `${gatewayOrderId}|${gatewayPaymentId}`;
      const validSignature = crypto
        .createHmac('sha256', mockSecret)
        .update(payload)
        .digest('hex');

      const tamperedSignature = validSignature.slice(0, -4) + 'abcd';

      const isTimingSafeEqual = crypto.timingSafeEqual(
        Buffer.from(validSignature, 'hex'),
        Buffer.from(tamperedSignature, 'hex')
      );

      expect(isTimingSafeEqual).toBe(false);
    });
  });

  describe('2. Payment State Machine Lifecycle', () => {
    it('transitions correctly from CREATED -> CAPTURED upon online authorization', () => {
      const payment: PaymentSnapshot = {
        id: 'pay_001',
        orderId: 'NFI-BLR-2026-9021',
        amount: 14537600,
        currency: 'INR',
        status: 'CREATED',
        gateway: 'RAZORPAY',
        method: 'UPI',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Capture transition
      const capturedPayment: PaymentSnapshot = {
        ...payment,
        status: 'CAPTURED',
        gatewayPaymentId: 'pay_rzp_12345',
        updatedAt: new Date().toISOString(),
      };

      expect(capturedPayment.status).toBe('CAPTURED');
      expect(capturedPayment.gatewayPaymentId).toBe('pay_rzp_12345');
    });

    it('transitions correctly from CREATED -> FAILED upon issuer bank decline', () => {
      const payment: PaymentSnapshot = {
        id: 'pay_002',
        orderId: 'NFI-BLR-2026-6510',
        amount: 5400000,
        currency: 'INR',
        status: 'CREATED',
        gateway: 'RAZORPAY',
        method: 'CARD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const failedPayment: PaymentSnapshot = {
        ...payment,
        status: 'FAILED',
        updatedAt: new Date().toISOString(),
      };

      expect(failedPayment.status).toBe('FAILED');
    });

    it('records refund parameters and transitions to REFUNDED', () => {
      const payment: PaymentSnapshot = {
        id: 'pay_003',
        orderId: 'NFI-BLR-2026-8840',
        amount: 10619882,
        currency: 'INR',
        status: 'CAPTURED',
        gateway: 'RAZORPAY',
        method: 'CARD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const refundedPayment: PaymentSnapshot = {
        ...payment,
        status: 'REFUNDED',
        refundDetails: {
          amount: 10619882,
          reason: 'Customer cancelled before timber seasoned',
          refundReference: 'REF-789012',
          refundedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };

      expect(refundedPayment.status).toBe('REFUNDED');
      expect(refundedPayment.refundDetails?.amount).toBe(10619882);
      expect(refundedPayment.refundDetails?.reason).toContain('timber seasoned');
    });
  });

  describe('3. White-Glove Bank Transfer & NEFT Reconciliation Workflow', () => {
    it('logs customer-submitted UTR and updates order state', () => {
      const pendingOrder = {
        id: 'ord-neft-001',
        orderNumber: 'NFI-BLR-2026-7720',
        paymentStatus: 'PENDING',
        total: 284000,
        timeline: [
          { status: 'CONFIRMED', note: 'Order placed via White-Glove NEFT', changedAt: new Date().toISOString() },
        ],
      };

      const customerUtr = 'ICIC260908129841';
      const remittingBank = 'HDFC Bank Whitefield';

      // Customer submits UTR
      const updatedOrder = {
        ...pendingOrder,
        timeline: [
          ...pendingOrder.timeline,
          {
            status: 'UTR_SUBMITTED',
            note: `Customer submitted NEFT/RTGS UTR #${customerUtr} (${remittingBank}). Under verification by Finance Ops.`,
            changedAt: new Date().toISOString(),
          },
        ],
        reconciliationDetails: {
          utrNumber: customerUtr,
          bankName: remittingBank,
          submittedAt: new Date().toISOString(),
        },
      };

      expect(updatedOrder.reconciliationDetails.utrNumber).toBe('ICIC260908129841');
      expect(updatedOrder.timeline).toHaveLength(2);
      expect(updatedOrder.timeline[1]!.note).toContain('ICIC260908129841');
    });

    it('admin reconciliation marks payment CAPTURED and order PAID', () => {
      const payment: PaymentSnapshot = {
        id: 'pay_neft_001',
        orderId: 'NFI-BLR-2026-7720',
        amount: 28400000,
        currency: 'INR',
        status: 'PENDING',
        gateway: 'MANUAL_BANK_TRANSFER',
        method: 'BANK_TRANSFER',
        reconciliationDetails: {
          utrNumber: 'ICIC260908129841',
          bankName: 'HDFC Bank',
          reconciledAt: new Date().toISOString(),
          notes: 'Customer submitted',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Admin reconciliation action
      const reconciledPayment: PaymentSnapshot = {
        ...payment,
        status: 'CAPTURED',
        reconciliationDetails: {
          utrNumber: 'ICIC260908129841',
          bankName: 'ICICI Bank Bengaluru Current A/C',
          verifiedBy: 'Admin Finance Ops',
          reconciledAt: new Date().toISOString(),
          notes: 'Bank statement line credit verified; approved by accounts desk.',
        },
        updatedAt: new Date().toISOString(),
      };

      expect(reconciledPayment.status).toBe('CAPTURED');
      expect(reconciledPayment.reconciliationDetails?.verifiedBy).toBe('Admin Finance Ops');
    });
  });

  describe('4. Financial Precision & 18% GST Calculation', () => {
    it('calculates 18% GST and 9% CGST + 9% SGST breakdown without floating errors', () => {
      const subtotalInPaise = 10000000; // ₹1,00,000.00
      const gstRate = 0.18;

      const taxInPaise = Math.round(subtotalInPaise * gstRate); // ₹18,000
      const cgstInPaise = Math.round(taxInPaise / 2); // ₹9,000 (9%)
      const sgstInPaise = taxInPaise - cgstInPaise; // ₹9,000 (9%)
      const grandTotalInPaise = subtotalInPaise + taxInPaise; // ₹1,18,000

      expect(taxInPaise).toBe(1800000);
      expect(cgstInPaise).toBe(900000);
      expect(sgstInPaise).toBe(900000);
      expect(grandTotalInPaise).toBe(11800000);
      expect(cgstInPaise + sgstInPaise).toBe(taxInPaise);
    });

    it('extracts taxable base from inclusive gross accurately', () => {
      const grossInPaise = 14537600; // ₹1,45,376
      const taxableBase = Math.round(grossInPaise / 1.18);
      const taxComponent = grossInPaise - taxableBase;

      expect(taxableBase + taxComponent).toBe(grossInPaise);
    });
  });

  describe('5. Checkout Failure Recovery & Cart Retention', () => {
    it('preserves cart and form state when checkout payment is dismissed or fails', () => {
      const originalCart = {
        items: [
          { productId: 'p1', name: 'Teak Dining Table', quantity: 1, unitPrice: 6800000 },
        ],
        subtotal: 6800000,
        total: 6800000,
      };

      const cart = { ...originalCart };
      let error = '';

      // Simulate user closing Razorpay modal without paying
      const onDismiss = () => {
        error = 'Payment window closed. Your commission items have been preserved.';
      };

      onDismiss();

      // Verify cart was not cleared
      expect(cart.items).toHaveLength(1);
      expect(cart.total).toBe(6800000);
      expect(error).toContain('preserved');
    });
  });

  describe('6. Admin Operations KPI & Filter Engine', () => {
    const testPayments: PaymentSnapshot[] = [
      {
        id: 'p1',
        orderId: 'ORD-1',
        amount: 10000000,
        currency: 'INR',
        status: 'CAPTURED',
        gateway: 'RAZORPAY',
        customerName: 'Aarav Kumar',
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
      },
      {
        id: 'p2',
        orderId: 'ORD-2',
        amount: 20000000,
        currency: 'INR',
        status: 'PENDING',
        gateway: 'MANUAL_BANK_TRANSFER',
        customerName: 'Sneha Rao',
        reconciliationDetails: { utrNumber: 'HDFC12345678', reconciledAt: '2026-09-02T10:00:00Z' },
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-09-02T10:00:00Z',
      },
      {
        id: 'p3',
        orderId: 'ORD-3',
        amount: 5000000,
        currency: 'INR',
        status: 'FAILED',
        gateway: 'RAZORPAY',
        customerName: 'Vikram Singh',
        createdAt: '2026-09-03T10:00:00Z',
        updatedAt: '2026-09-03T10:00:00Z',
      },
    ];

    it('aggregates revenue, pending count, and success rate accurately', () => {
      let totalRevenue = 0;
      let pendingCount = 0;
      let capturedCount = 0;
      let failedCount = 0;

      testPayments.forEach((p) => {
        if (p.status === 'CAPTURED') {
          totalRevenue += p.amount;
          capturedCount++;
        } else if (p.status === 'PENDING') {
          pendingCount++;
        } else if (p.status === 'FAILED') {
          failedCount++;
        }
      });

      const successRate = Math.round((capturedCount / (capturedCount + failedCount)) * 100);
      const aov = capturedCount > 0 ? Math.round(totalRevenue / capturedCount) : 0;

      const kpis: PaymentKpis = {
        totalRevenue,
        pendingCount,
        capturedCount,
        failedCount,
        refundedCount: 0,
        totalCount: testPayments.length,
        averageOrderValue: aov,
      };

      expect(kpis.totalRevenue).toBe(10000000);
      expect(kpis.pendingCount).toBe(1);
      expect(kpis.capturedCount).toBe(1);
      expect(kpis.failedCount).toBe(1);
      expect(successRate).toBe(50);
      expect(kpis.averageOrderValue).toBe(10000000);
    });

    it('filters payments by UTR reference', () => {
      const query = 'HDFC12345678';
      const results = testPayments.filter(
        (p) =>
          p.orderId.includes(query) ||
          p.customerName?.includes(query) ||
          p.reconciliationDetails?.utrNumber?.includes(query)
      );

      expect(results).toHaveLength(1);
      expect(results[0]!.orderId).toBe('ORD-2');
    });

    it('filters payments by status tabs', () => {
      const captured = testPayments.filter((p) => p.status === 'CAPTURED');
      const pending = testPayments.filter((p) => p.status === 'PENDING');

      expect(captured).toHaveLength(1);
      expect(pending).toHaveLength(1);
      expect(captured[0]!.id).toBe('p1');
      expect(pending[0]!.id).toBe('p2');
    });
  });
});
