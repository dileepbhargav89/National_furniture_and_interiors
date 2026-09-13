// payments.routes.ts — Express router for the payments module.
//
// CRITICAL — Webhook raw body requirement (docs/09 §4.5, §08 §9):
//   The Razorpay signature is computed over the RAW request body bytes.
//   If express.json() parses the body first, the raw buffer is consumed and
//   signature verification will ALWAYS fail.
//   Solution: scope express.raw({ type: 'application/json' }) directly on
//   the webhook route — it takes precedence over the global json middleware.
//
// Routes:
//   POST /payments/webhook  — no JWT auth, raw body, Razorpay signature check
//   GET  /admin/payments    — JWT + payments.read permission

import { Router, RequestHandler, raw } from 'express';
import { createRateLimiter } from '../../../core/security';
import { PaymentsController } from './payments.controller';
import { InvoicesController } from './invoices.controller';

export function createPaymentsRouter(
  controller: PaymentsController,
  invoicesController: InvoicesController,
  authMiddleware: RequestHandler,
  requirePermission: (permission: string) => RequestHandler
): Router {
  const router = Router();

  const standardLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 120,
    keyPrefix: 'payments',
  });

  // ── Webhook endpoint ──────────────────────────────────────────────────────
  // No authMiddleware — Razorpay authenticates via HMAC-SHA256 signature.
  // express.raw() captures the raw Buffer before any JSON parsing.
  router.post(
    '/payments/webhook',
    raw({ type: 'application/json' }),
    controller.handleWebhook
  );

  // ── Customer endpoints ────────────────────────────────────────────────────
  router.post(
    '/payments/create-intent',
    standardLimiter,
    controller.createPaymentIntent
  );

  router.post(
    '/payments/verify',
    standardLimiter,
    controller.verifyPayment
  );

  router.get(
    '/payments/:paymentId/invoice',
    standardLimiter,
    authMiddleware,
    invoicesController.getInvoice
  );

  router.get(
    '/orders/:orderId/invoice',
    standardLimiter,
    authMiddleware,
    invoicesController.getInvoiceByOrderId
  );

  // ── Admin endpoints ───────────────────────────────────────────────────────
  router.get(
    '/admin/payments/kpis',
    standardLimiter,
    authMiddleware,
    requirePermission('payments.read'),
    controller.getPaymentKpis
  );

  router.get(
    '/admin/payments',
    standardLimiter,
    authMiddleware,
    requirePermission('payments.read'),
    controller.listPayments
  );

  router.get(
    '/admin/payments/:id',
    standardLimiter,
    authMiddleware,
    requirePermission('payments.read'),
    controller.getPaymentById
  );

  router.post(
    '/admin/payments/:id/reconcile',
    standardLimiter,
    authMiddleware,
    requirePermission('payments.manage'),
    controller.reconcilePayment
  );

  router.post(
    '/admin/payments/:id/refund',
    standardLimiter,
    authMiddleware,
    requirePermission('payments.manage'),
    controller.recordRefund
  );

  router.get(
    '/admin/payments/:paymentId/invoice',
    standardLimiter,
    authMiddleware,
    requirePermission('payments.read'),
    invoicesController.getInvoice
  );

  return router;
}
