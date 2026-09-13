// Media routes — docs/08 §8: Bearer + media.upload on all endpoints.
import { Router } from 'express';
import { createRateLimiter } from '../../../core/security';
import type { RequestHandler } from 'express';
import type { createMediaController } from './media.controller';

export function createMediaRoutes(
  controller: ReturnType<typeof createMediaController>,
  authMiddleware: RequestHandler,
  rbacMiddleware: (permission: string) => RequestHandler,
): Router {
  const router = Router();

  const standardLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 120,
    keyPrefix: 'media-standard',
  });

  router.post(
    '/media/signature',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('media.upload'),
    controller.generateSignature,
  );
  router.post(
    '/media/confirm',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('media.upload'),
    controller.confirmUpload,
  );
  router.get(
    '/media',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('media.manage'),
    controller.listByOwner,
  );

  return router;
}
