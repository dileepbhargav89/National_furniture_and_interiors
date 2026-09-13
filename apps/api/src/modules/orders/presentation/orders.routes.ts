import { Router, RequestHandler } from 'express';
import { createRateLimiter } from '../../../core/security';
import { OrdersController } from './orders.controller';

export function createOrdersRouter(
  controller: OrdersController,
  authMiddleware: RequestHandler,
  requirePermission: (permission: string) => RequestHandler
): Router {
  const router = Router();

  const standardLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 100,
    keyPrefix: 'orders'
  });

  router.use(standardLimiter);
  router.use(authMiddleware);

  // Own-order endpoints
  router.get(
    '/me',
    requirePermission('orders.read_self'),
    controller.getMyOrders
  );

  router.get(
    '/my-orders',
    requirePermission('orders.read_self'),
    controller.getMyOrders
  );

  router.post(
    '/checkout',
    requirePermission('orders.read_self'),
    controller.checkout
  );

  router.get(
    '/:id',
    requirePermission('orders.read_self'),
    controller.getOrderById
  );

  // Admin endpoints
  router.get(
    '/',
    requirePermission('orders.read'),
    controller.getAllOrders
  );

  router.patch(
    '/:id/fulfillment',
    requirePermission('orders.write'),
    controller.updateFulfillment
  );

  router.patch(
    '/:id/fulfillment-status',
    requirePermission('orders.write'),
    controller.updateFulfillment
  );

  return router;
}
