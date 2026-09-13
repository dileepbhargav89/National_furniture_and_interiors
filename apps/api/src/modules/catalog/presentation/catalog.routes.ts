// Catalog routes — docs/08 §8 catalog row:
//   - None on public GETs (unauthenticated catalog reads)
//   - Bearer + catalog.write on admin mutations
//   - docs/08 §4.4: Public read = 60 req/min per IP; Admin = Standard authenticated = 120 req/min
import { Router } from 'express';
import { createRateLimiter } from '../../../core/security';
import type { RequestHandler } from 'express';
import type { createCatalogController } from './catalog.controller';

export function createCatalogRoutes(
  controller: ReturnType<typeof createCatalogController>,
  authMiddleware: RequestHandler,
  rbacMiddleware: (permission: string) => RequestHandler,
): Router {
  const router = Router();

  const publicReadLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 60,
    keyPrefix: 'catalog-public',
  });
  const standardLimiter = createRateLimiter({
    windowMs: 60_000,
    max: 120,
    keyPrefix: 'catalog-standard',
  });

  // ---- Public routes (no auth) ---------------------------------------------------------------
  router.get('/categories', publicReadLimiter, controller.listCategories);
  router.get('/categories/:slug', publicReadLimiter, controller.getCategory);
  router.get('/products', publicReadLimiter, controller.listProducts);
  router.get('/products/:id', publicReadLimiter, controller.getProduct);
  router.get('/collections', publicReadLimiter, controller.listCollections);
  router.get('/collections/:slug', publicReadLimiter, controller.getCollection);

  // ---- Admin routes (auth + catalog.write permission) ----------------------------------------
  router.get(
    '/admin/products',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminListProducts,
  );
  router.get(
    '/admin/products/:id',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminGetProduct,
  );
  router.post(
    '/admin/products',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminCreateProduct,
  );
  router.patch(
    '/admin/products/:id',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminUpdateProduct,
  );
  router.delete(
    '/admin/products/:id',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminArchiveProduct,
  );
  router.post(
    '/admin/categories',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminCreateCategory,
  );
  router.patch(
    '/admin/categories/:id',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminUpdateCategory,
  );
  router.get(
    '/admin/categories/:id',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminGetCategory,
  );
  router.delete(
    '/admin/categories/:id',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminDeleteCategory,
  );
  router.post(
    '/admin/inventory/adjust',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminAdjustInventory,
  );

  router.get(
    '/admin/collections',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminListCollections,
  );
  router.get(
    '/admin/collections/:id',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminGetCollection,
  );
  router.post(
    '/admin/collections',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminCreateCollection,
  );
  router.patch(
    '/admin/collections/:id',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminUpdateCollection,
  );
  router.delete(
    '/admin/collections/:id',
    standardLimiter,
    authMiddleware,
    rbacMiddleware('catalog.write'),
    controller.adminDeleteCollection,
  );

  return router;
}
