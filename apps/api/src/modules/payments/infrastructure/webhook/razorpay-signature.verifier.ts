// razorpay-signature.verifier.ts — Infrastructure utility for Razorpay HMAC-SHA256 signature verification.
// docs/09_security_architecture.md §4.5 (replay attack prevention) and §1.3 (webhook attack surface).
// docs/08_api_architecture.md §9 — "Signature verification is mandatory and non-bypassable".
// Uses crypto.timingSafeEqual to prevent timing-side-channel attacks.

import crypto from 'crypto';

/**
 * Verifies the HMAC-SHA256 signature Razorpay sends on every webhook.
 *
 * Razorpay's algorithm:
 *   HMAC_SHA256(key=webhook_secret, data="{razorpay_order_id}|{razorpay_payment_id}")
 *
 * @param razorpayOrderId   - from webhook payload (e.g. "order_xxx")
 * @param razorpayPaymentId - from webhook payload (e.g. "pay_xxx")
 * @param signature         - from X-Razorpay-Signature header
 * @param secret            - RAZORPAY_KEY_SECRET environment variable
 * @returns true if signature matches, false otherwise
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  secret: string
): boolean {
  try {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    // timingSafeEqual prevents timing attacks where an attacker could infer the correct
    // signature character-by-character from response-time differences.
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    // Buffer.from() throws if signature is not valid hex → treat as invalid.
    return false;
  }
}
