// Cart routes — docs/08 §8: Bearer or guest-session.
// docs/08 §4.4: Standard authenticated = 120 req/min.
import { Router } from 'express';
import { createRateLimiter } from '../../../core/security';
import type { RequestHandler } from 'express';
import type { createCartController } from './cart.controller';

export function createCartRoutes(
  controller: ReturnType<typeof createCartController>,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  const standardLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 120,
    keyPrefix: 'cart-standard',
  });

  // Cart supports both authenticated and guest sessions — authMiddleware is NOT applied here
  // globally. Instead, identity is resolved per-request in the controller from JWT or session ID.
  // The /cart/merge endpoint does require auth (enforced in the controller).
  router.get('/cart', standardLimiter, controller.getCart);
  router.post('/cart/items', standardLimiter, controller.addItem);
  router.delete('/cart/items/:variantId', standardLimiter, controller.removeItem);
  router.patch('/cart/items/:variantId', standardLimiter, controller.updateItem);

  // Merge requires an authenticated user — enforced explicitly in the controller.
  router.post('/cart/merge', standardLimiter, authMiddleware, controller.mergeCart);

  return router;
}
