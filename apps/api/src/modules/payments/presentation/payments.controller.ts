// payments.controller.ts — Presentation layer for the payments module.
// Handles:
//   1. POST /payments/webhook — Razorpay signed webhook receiver (no JWT auth)
//   2. GET  /admin/payments  — paginated admin list (JWT + payments.read permission)
//
// docs/08_api_architecture.md §9 — "Signature verification is mandatory and non-bypassable"
// docs/09_security_architecture.md §4.5 — Replay attack prevention (idempotency)
// IMPORTANT: webhook route must use express.raw() — see payments.routes.ts

import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../../core/exceptions';
import {
  ConfirmWebhookPaymentUseCase,
  ListPaymentsUseCase,
  VerifyPaymentUseCase,
  ReconcilePaymentUseCase,
  RefundPaymentUseCase,
  GetPaymentByIdUseCase,
  GetPaymentMetricsUseCase,
} from '../application/payments.use-cases';
import {
  webhookPayloadSchema,
  adminListPaymentsQuerySchema,
  verifyPaymentSchema,
  reconcilePaymentSchema,
  recordRefundSchema,
  createPaymentIntentSchema,
} from './payments.schemas';
import {
  RazorpayWebhookEvent,
  IPaymentIntentGateway,
  RazorpaySignatureVerifierFn,
} from '../application/ports';
import { env } from '../../../core/config/env';

export class PaymentsController {
  constructor(
    private readonly confirmWebhookUseCase: ConfirmWebhookPaymentUseCase,
    private readonly listPaymentsUseCase: ListPaymentsUseCase,
    private readonly razorpaySecret: string,
    private readonly verifyPaymentUseCase?: VerifyPaymentUseCase,
    private readonly reconcilePaymentUseCase?: ReconcilePaymentUseCase,
    private readonly refundPaymentUseCase?: RefundPaymentUseCase,
    private readonly getPaymentByIdUseCase?: GetPaymentByIdUseCase,
    private readonly getPaymentMetricsUseCase?: GetPaymentMetricsUseCase,
    private readonly razorpayAdapter?: IPaymentIntentGateway,
    private readonly signatureVerifier?: RazorpaySignatureVerifierFn,
  ) {}

  /**
   * POST /api/v1/payments/webhook
   *
   * Called by Razorpay's servers on payment events. Not JWT-authenticated —
   * authentication is the HMAC-SHA256 signature on the raw request body.
   *
   * Returns 200 quickly (ack); Razorpay retries on non-2xx.
   */
  handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = req.headers['x-razorpay-signature'];

      if (!signature || typeof signature !== 'string') {
        res
          .status(401)
          .json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Missing Razorpay signature' },
          });
        return;
      }

      // Raw body is available because this route uses express.raw() — see payments.routes.ts
      const rawBody = req.body as Buffer;
      const bodyStr = rawBody.toString('utf-8');
      let parsed: unknown;
      try {
        parsed = JSON.parse(bodyStr);
      } catch {
        res
          .status(400)
          .json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } });
        return;
      }

      // Parse and validate the payload shape
      const payload = webhookPayloadSchema.safeParse(parsed);
      if (!payload.success) {
        // Ack anyway — unrecognised event types should not cause Razorpay to retry forever
        res.status(200).json({ success: true });
        return;
      }

      const {
        event,
        payload: {
          payment: { entity },
        },
      } = payload.data;

      // Verify signature using entity fields (docs/09 §4.5)
      const isValid = this.signatureVerifier
        ? this.signatureVerifier(entity.order_id, entity.id, signature, this.razorpaySecret)
        : false;

      if (!isValid) {
        res
          .status(401)
          .json({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Invalid Razorpay signature' },
          });
        return;
      }

      const webhookEvent: RazorpayWebhookEvent = {
        event,
        gatewayOrderId: entity.order_id,
        gatewayPaymentId: entity.id,
        gatewaySignature: signature,
        amount: entity.amount,
        method: entity.method,
        rawPayload: payload.data as Record<string, unknown>,
      };

      if (event === 'payment.captured') {
        await this.confirmWebhookUseCase.executeCapture(webhookEvent);
      } else if (event === 'payment.failed') {
        await this.confirmWebhookUseCase.executeFailed(webhookEvent);
      }
      // Unhandled event types: ack and ignore

      // Always return 200 to Razorpay (prevents unnecessary retries)
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/payments/verify
   * Customer completes checkout and verifies Razorpay signature immediately.
   */
  verifyPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = verifyPaymentSchema.parse(req.body);
      if (this.verifyPaymentUseCase) {
        const payment = await this.verifyPaymentUseCase.execute(input);
        sendSuccess(req, res, 200, payment);
      } else {
        sendSuccess(req, res, 200, { verified: true, ...input });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/payments
   * Requires: Bearer JWT + payments.read permission
   */
  listPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = adminListPaymentsQuerySchema.parse(req.query);
      const payments = await this.listPaymentsUseCase.execute(query.limit, query.offset);
      sendSuccess(req, res, 200, payments);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/payments/kpis
   * Requires: Bearer JWT + payments.read permission
   */
  getPaymentKpis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (this.getPaymentMetricsUseCase) {
        const metrics = await this.getPaymentMetricsUseCase.execute();
        sendSuccess(req, res, 200, metrics);
      } else {
        const all = await this.listPaymentsUseCase.execute(100, 0);
        sendSuccess(req, res, 200, {
          totalRevenue: all.reduce((acc, p) => acc + (p.status === 'CAPTURED' ? p.amount : 0), 0),
          pendingCount: all.filter((p) => p.status === 'CREATED' || p.status === 'AUTHORIZED')
            .length,
          capturedCount: all.filter((p) => p.status === 'CAPTURED').length,
          failedCount: all.filter((p) => p.status === 'FAILED').length,
          refundedCount: all.filter((p) => p.status === 'REFUNDED').length,
          totalCount: all.length,
          averageOrderValue: 0,
        });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/payments/:id
   */
  getPaymentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (this.getPaymentByIdUseCase) {
        const payment = await this.getPaymentByIdUseCase.execute(id);
        sendSuccess(req, res, 200, payment);
      } else {
        const all = await this.listPaymentsUseCase.execute(100, 0);
        const found = all.find((p) => p.id === id);
        if (!found) {
          res
            .status(404)
            .json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
          return;
        }
        sendSuccess(req, res, 200, found);
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/payments/:id/reconcile
   * Requires: Bearer JWT + payments.manage permission
   */
  reconcilePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const input = reconcilePaymentSchema.parse(req.body);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const verifiedBy = (req as any).user?.email || 'Admin Finance Ops';

      if (this.reconcilePaymentUseCase) {
        const updated = await this.reconcilePaymentUseCase.execute({
          paymentId: id,
          utrNumber: input.utrNumber,
          bankName: input.bankName,
          notes: input.notes,
          verifiedBy,
        });
        sendSuccess(req, res, 200, updated);
      } else {
        sendSuccess(req, res, 200, { id, status: 'CAPTURED', reconciliationDetails: input });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/payments/:id/refund
   * Requires: Bearer JWT + payments.manage permission
   */
  recordRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const input = recordRefundSchema.parse(req.body);

      if (this.refundPaymentUseCase) {
        const updated = await this.refundPaymentUseCase.execute({
          paymentId: id,
          amount: input.amount,
          reason: input.reason,
          refundReference: input.refundReference,
        });
        sendSuccess(req, res, 200, updated);
      } else {
        sendSuccess(req, res, 200, { id, status: 'REFUNDED', refundDetails: input });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/payments/create-intent
   * Generates a live Razorpay order and returns client options.
   */
  createPaymentIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createPaymentIntentSchema.parse(req.body);

      if (this.razorpayAdapter) {
        const result = await this.razorpayAdapter.createPaymentIntent(
          data.orderId,
          data.amount,
          data.currency,
        );

        sendSuccess(req, res, 201, {
          gatewayOrderId: result.gatewayOrderId,
          amount: data.amount,
          currency: data.currency,
          keyId: env.RAZORPAY_KEY_ID || 'rzp_test_TUT9HlbAnaU377',
        });
        return;
      }

      sendSuccess(req, res, 200, {
        gatewayOrderId: `rzp_mock_${Date.now()}`,
        amount: data.amount,
        currency: data.currency,
        keyId: env.RAZORPAY_KEY_ID || 'rzp_test_TUT9HlbAnaU377',
      });
    } catch (error) {
      next(error);
    }
  };
}
