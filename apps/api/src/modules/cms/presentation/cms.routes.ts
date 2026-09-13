import { Router, RequestHandler } from 'express';
import { CmsController } from './cms.controller';

export function createCmsRouter(
  controller: CmsController,
  authMiddleware: RequestHandler,
  rbacMiddleware: (permission: string) => RequestHandler
): Router {
  const router = Router();

  // --- Public Endpoints ---
  
  // Blogs
  router.get('/blogs', controller.listBlogs);
  router.get('/blogs/:slug', controller.getBlogBySlug);

  // Banners
  router.get('/banners', controller.listBanners);
  router.post('/banners/:id/click', controller.trackBannerClick);
  router.post('/banners/:id/impression', controller.trackBannerImpression);

  // Testimonials
  router.get('/testimonials', controller.listTestimonials);
  router.post('/testimonials', controller.createTestimonial);

  // Newsletter
  router.post('/newsletter', controller.subscribeNewsletter);


  // --- Admin Endpoints (Backward compatible prefix under /api/v1/cms/admin) ---

  const requireAdmin = [authMiddleware, rbacMiddleware('cms.write')];

  // Blogs
  router.post('/admin/blogs', requireAdmin, controller.createBlog);
  router.put('/admin/blogs/:id', requireAdmin, controller.updateBlog);

  // Banners
  router.get('/admin/banners', requireAdmin, controller.adminListBanners);
  router.get('/admin/banners/:id', requireAdmin, controller.adminGetBanner);
  router.post('/admin/banners', requireAdmin, controller.createBanner);
  router.put('/admin/banners/:id', requireAdmin, controller.updateBanner);
  router.patch('/admin/banners/:id', requireAdmin, controller.updateBanner);
  router.patch('/admin/banners/:id/status', requireAdmin, controller.toggleBannerStatus);
  router.delete('/admin/banners/:id', requireAdmin, controller.deleteBanner);

  // Newsletter
  router.get('/admin/newsletter', requireAdmin, controller.listNewsletterSubscribers);

  return router;
}

export function createCmsAdminRouter(
  controller: CmsController,
  authMiddleware: RequestHandler,
  rbacMiddleware: (permission: string) => RequestHandler
): Router {
  const router = Router();
  const requireAdmin = [authMiddleware, rbacMiddleware('cms.write')];

  // Blogs
  router.post('/blogs', requireAdmin, controller.createBlog);
  router.put('/blogs/:id', requireAdmin, controller.updateBlog);

  // Banners
  router.get('/banners', requireAdmin, controller.adminListBanners);
  router.get('/banners/:id', requireAdmin, controller.adminGetBanner);
  router.post('/banners', requireAdmin, controller.createBanner);
  router.put('/banners/:id', requireAdmin, controller.updateBanner);
  router.patch('/banners/:id', requireAdmin, controller.updateBanner);
  router.patch('/banners/:id/status', requireAdmin, controller.toggleBannerStatus);
  router.delete('/banners/:id', requireAdmin, controller.deleteBanner);

  // Newsletter
  router.get('/newsletter', requireAdmin, controller.listNewsletterSubscribers);

  return router;
}
