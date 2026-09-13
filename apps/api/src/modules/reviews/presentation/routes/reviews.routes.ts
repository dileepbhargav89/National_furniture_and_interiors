import { Router } from 'express';
import { ReviewsController } from '../controllers/reviews.controller';

export function createReviewsRoutes(
  controller: ReviewsController,
  authMiddleware: any,
  rbacMiddleware: any
): Router {
  const router = Router();

  // Public routes
  router.get('/products/:productId/reviews', controller.getProductReviews);
  router.get('/products/:productId/reviews/stats', controller.getProductReviewStats);
  router.post('/products/:productId/reviews/:id/helpful', controller.toggleHelpful);

  // Authenticated customer routes
  router.post(
    '/products/:productId/reviews',
    authMiddleware,
    rbacMiddleware('reviews.write_self'),
    controller.submitReview
  );

  // Admin moderation routes
  router.get(
    '/admin/reviews',
    authMiddleware,
    rbacMiddleware('reviews.moderate'),
    controller.listReviews
  );
  router.patch(
    '/admin/reviews/:id/moderate',
    authMiddleware,
    rbacMiddleware('reviews.moderate'),
    controller.moderateReview
  );
  router.post(
    '/admin/reviews/:id/reply',
    authMiddleware,
    rbacMiddleware('reviews.moderate'),
    controller.adminReply
  );
  router.delete(
    '/admin/reviews/:id',
    authMiddleware,
    rbacMiddleware('reviews.moderate'),
    controller.deleteReview
  );

  return router;
}
