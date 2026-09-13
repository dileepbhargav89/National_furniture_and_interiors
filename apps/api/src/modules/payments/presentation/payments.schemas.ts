// payments.schemas.ts — Zod validation schemas for payments presentation layer.
import { z } from 'zod';

// Webhook body is not strictly validated field-by-field —
// Razorpay's payload format is verified by the HMAC signature before reaching here.
// We only extract the fields we need from the verified, parsed payload.
export const webhookPayloadSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        order_id: z.string(),
        amount: z.number(),
        currency: z.string(),
        method: z.string().optional(),
      }),
    }),
  }),
}).passthrough(); // allow unknown fields in Razorpay payload

export const adminListPaymentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  gatewayOrderId: z.string().min(1, 'gatewayOrderId is required'),
  gatewayPaymentId: z.string().min(1, 'gatewayPaymentId is required'),
  gatewaySignature: z.string().min(1, 'gatewaySignature is required'),
  orderId: z.string().optional(),
});

export const reconcilePaymentSchema = z.object({
  utrNumber: z.string().min(4, 'UTR number must be at least 4 characters'),
  bankName: z.string().optional(),
  notes: z.string().optional(),
});

export const recordRefundSchema = z.object({
  amount: z.number().int().min(1).optional(),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  refundReference: z.string().optional(),
});

export const createPaymentIntentSchema = z.object({
  amount: z.number().int().positive('Amount must be positive paise'),
  currency: z.string().optional().default('INR'),
  orderId: z.string().min(1, 'orderId is required'),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
export type AdminListPaymentsQuery = z.infer<typeof adminListPaymentsQuerySchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type ReconcilePaymentInput = z.infer<typeof reconcilePaymentSchema>;
export type RecordRefundInput = z.infer<typeof recordRefundSchema>;
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

