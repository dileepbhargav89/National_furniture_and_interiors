import { Router, RequestHandler } from 'express';
import { NotificationsController } from './notifications.controller';

export function createNotificationsRouter(
  controller: NotificationsController,
  authMiddleware: RequestHandler,
  requirePermission: (permission: string) => RequestHandler
): Router {
  const router = Router();

  // ==========================================
  // CUSTOMER / AUTHENTICATED USER ROUTES
  // ==========================================

  // Customer: List their own in-app notifications
  router.get(
    '/my',
    authMiddleware,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    controller.getMyNotifications
  );

  // Customer: Get real-time unread notification count
  router.get(
    '/my/unread-count',
    authMiddleware,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    controller.getUnreadCount
  );

  // Customer: Mark all personal in-app notifications as read
  router.put(
    '/my/read-all',
    authMiddleware,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    controller.markAllAsRead
  );

  // Customer & Admin: Mark a single notification as read
  router.put(
    '/:id/read',
    authMiddleware,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    controller.markAsRead
  );

  // ==========================================
  // ADMIN OPERATIONS & DISPATCH ROUTES
  // ==========================================

  // Admin: Delivery statistics and health overview
  router.get(
    '/stats',
    authMiddleware,
    requirePermission('notifications.read'),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    controller.getStats
  );

  // Admin: Live HTML Email template renderer preview
  router.post(
    '/preview-template',
    authMiddleware,
    requirePermission('notifications.read'),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    controller.previewTemplate
  );

  // Admin: Interactive test-send sandbox across Email, WhatsApp, SMS, In-App
  router.post(
    '/test-send',
    authMiddleware,
    requirePermission('notifications.write'),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    controller.testSend
  );

  // Admin: System broadcast notification
  router.post(
    '/broadcast',
    authMiddleware,
    requirePermission('notifications.write'),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    controller.broadcast
  );

  // Admin: List all system notifications with pagination
  router.get(
    '/',
    authMiddleware,
    requirePermission('notifications.read'),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    controller.list
  );

  // Admin: Direct create notification
  router.post(
    '/',
    authMiddleware,
    requirePermission('notifications.write'),
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    controller.create
  );

  return router;
}
