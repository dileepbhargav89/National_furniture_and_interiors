// Express application factory — docs/06_project_structure.md §4.1.
//
// Middleware pipeline order is docs/07 §4.2's documented sequence, applied once here and never
// varied per module: request-id -> security headers -> CORS -> cookies -> body -> routes ->
// error handler (which must be LAST, since Express only invokes 4-arg middleware for errors).
import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import { isCacheConnected } from './core/cache';
import { isDatabaseConnected } from './core/database';
import { buildAppContext } from './core/di';
import { errorHandlerMiddleware } from './core/exceptions';
import { requestIdMiddleware } from './core/logger/request-id';
import { corsPolicy, securityHeaders } from './core/security';

import { createAuthController } from './modules/auth/presentation/auth.controller';
import { createAuthMiddleware } from './modules/auth/presentation/auth.middleware';
import { createAuthRoutes } from './modules/auth/presentation/auth.routes';
import { createAdminRoutes } from './modules/admin/presentation/admin.routes';
import { createUsersRoutes } from './modules/users/presentation/users.routes';
import { createOnboardingRoutes } from './modules/users/presentation/onboarding.routes';
import { createCatalogController } from './modules/catalog/presentation/catalog.controller';
import { createCatalogRoutes } from './modules/catalog/presentation/catalog.routes';
import { createMediaController } from './modules/media/presentation/media.controller';
import { createMediaRoutes } from './modules/media/presentation/media.routes';
import { createCartController } from './modules/cart/presentation/cart.controller';
import { createCartRoutes } from './modules/cart/presentation/cart.routes';
import { createLeadsController } from './modules/leads/presentation/leads.controller';
import { createLeadsRoutes } from './modules/leads/presentation/leads.routes';
import { DesignProjectsController } from './modules/design-projects/presentation/design-projects.controller';
import { createDesignProjectsRouter } from './modules/design-projects/presentation/design-projects.routes';
import { OrdersController } from './modules/orders/presentation/orders.controller';
import { createOrdersRouter } from './modules/orders/presentation/orders.routes';
import { PaymentsController } from './modules/payments/presentation/payments.controller';
import { InvoicesController } from './modules/payments/presentation/invoices.controller';
import { createPaymentsRouter } from './modules/payments/presentation/payments.routes';
import { NotificationsController } from './modules/notifications/presentation/notifications.controller';
import { createNotificationsRouter } from './modules/notifications/presentation/notifications.routes';

// ---- Sprint 8: CMS -----------------------------------------------------------------
import { CmsController } from './modules/cms/presentation/cms.controller';
import { createCmsRouter, createCmsAdminRouter } from './modules/cms/presentation/cms.routes';

import { CrmController } from './modules/crm/presentation/controllers/crm.controller';
import { createCrmRoutes } from './modules/crm/presentation/routes/crm.routes';

import { ReviewsController } from './modules/reviews/presentation/controllers/reviews.controller';
import { createReviewsRoutes } from './modules/reviews/presentation/routes/reviews.routes';

import { AnalyticsAdminController } from './modules/analytics/presentation/analytics-admin.controller';
import { createAnalyticsAdminRouter } from './modules/analytics/presentation/analytics-admin.routes';

import { requirePermissions } from './core/security/rbac.middleware';
import { env } from './core/config/env';

/**
 * @param mountBusinessRoutes false in unit tests that only exercise the probes, so no Redis-backed
 * rate limiter is constructed where no Redis is available.
 */
export function createApp(mountBusinessRoutes = true): Express {
  const app = express();
  app.set('trust proxy', 1);

  app.use(requestIdMiddleware);
  app.use(securityHeaders);
  app.use(corsPolicy);
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));

  // Liveness probe — docs/10_devops_architecture.md §10.4: "is the process alive?" only. Never
  // checks a dependency; a Mongo/Redis blip must NOT cause the orchestrator to restart a healthy
  // process. Infrastructure, not a business route (docs/06 §4.2).
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // Readiness probe — docs/10 §10.4: "can this instance currently serve traffic?" A failure
  // removes the instance from load-balancer rotation without restarting it.
  app.get('/ready', (_req, res) => {
    const mongoConnected = isDatabaseConnected();
    const redisConnected = isCacheConnected();
    const ready = mongoConnected && redisConnected;
    res
      .status(ready ? 200 : 503)
      .json({ status: ready ? 'ready' : 'not_ready', mongoConnected, redisConnected });
  });

  if (mountBusinessRoutes) {
    const ctx = buildAppContext();
    const authMiddleware = createAuthMiddleware(ctx.auth.tokenService);

    const authController = createAuthController({
      registerUser: ctx.auth.registerUser,
      loginUser: ctx.auth.loginUser,
      issueSession: ctx.auth.issueSession,
      setupMfa: ctx.auth.setupMfa,
      verifyMfa: ctx.auth.verifyMfa,
      refreshToken: ctx.auth.refreshToken,
      logoutUser: ctx.auth.logoutUser,
      resolveRoleName: (roleId: string) => ctx.admin.permissionResolver.resolveRoleName(roleId),
      resolveRoleIdForUser: (userId: string) =>
        ctx.authUserRepository.findById(userId).then((u) => u!.roleId.toString()),
      authenticateWithGoogle: ctx.auth.authenticateWithGoogle,
      authenticateWithFacebook: ctx.auth.authenticateWithFacebook,
      sendPhoneOtp: ctx.auth.sendPhoneOtp,
      verifyPhoneOtp: ctx.auth.verifyPhoneOtp,
    });

    // docs/08 §3.17 — URI-based versioning from day one.
    app.use('/api/v1/auth', createAuthRoutes(authController, authMiddleware));

    app.use(
      '/api/v1/onboarding',
      createOnboardingRoutes({
        verifyOnboardingToken: ctx.users.verifyOnboardingToken,
        completeOnboarding: ctx.users.completeOnboarding,
        recordAudit: (input) => ctx.admin.auditLogger.record(input),
      }),
    );

    app.use(
      '/api/v1',
      createUsersRoutes(
        {
          getOwnProfile: ctx.users.getOwnProfile,
          updateOwnProfile: ctx.users.updateOwnProfile,
          adminListUsers: ctx.users.adminListUsers,
          adminListUsersWithFilters: ctx.users.adminListUsersWithFilters,
          adminGetUserDetail: ctx.users.adminGetUserDetail,
          adminCreateUser: ctx.users.adminCreateUser,
          adminOnboardUser: ctx.users.adminOnboardUser,
          adminResendOnboarding: ctx.users.adminResendOnboarding,
          adminResetUserPassword: ctx.users.adminResetUserPassword,
          adminUpdateUserStatus: ctx.users.adminUpdateUserStatus,
          listLeads: ctx.leads.listLeads,
          hashPassword: (plaintext) => ctx.auth.passwordHasher.hash(plaintext),
          resolveRoleIdByName: async (name) =>
            (await ctx.admin.roleRepository.findByName(name))?.id ?? null,
          recordAudit: (input) => ctx.admin.auditLogger.record(input),
        },
        authMiddleware,
      ),
    );

    app.use(
      '/api/v1/admin',
      createAdminRoutes(
        {
          listRoles: ctx.admin.listRoles,
          listPermissions: ctx.admin.listPermissions,
          listAuditLogs: ctx.admin.listAuditLogs,
        },
        authMiddleware,
      ),
    );

    // ---- Sprint 2: Catalog, Media, Cart --------------------------------------------------
    const rbacMiddleware = (permission: string) => requirePermissions(permission);

    const catalogController = createCatalogController({
      listCategories: ctx.catalog.listCategories,
      listProducts: ctx.catalog.listProducts,
      getProductDetail: ctx.catalog.getProductDetail,
      getCategory: ctx.catalog.getCategory,
      adminListProducts: ctx.catalog.adminListProducts,
      adminCreateProduct: ctx.catalog.adminCreateProduct,
      adminUpdateProduct: ctx.catalog.adminUpdateProduct,
      adminGetProduct: ctx.catalog.adminGetProduct,
      adminArchiveProduct: ctx.catalog.adminArchiveProduct,
      adminCreateCategory: ctx.catalog.adminCreateCategory,
      adminUpdateCategory: ctx.catalog.adminUpdateCategory,
      adminGetCategory: ctx.catalog.adminGetCategory,
      adminDeleteCategory: ctx.catalog.adminDeleteCategory,
      adminAdjustInventory: ctx.catalog.adminAdjustInventory,
      listCollections: ctx.catalog.listCollections,
      getCollectionDetail: ctx.catalog.getCollectionDetail,
      adminListCollections: ctx.catalog.adminListCollections,
      adminGetCollection: ctx.catalog.adminGetCollection,
      adminCreateCollection: ctx.catalog.adminCreateCollection,
      adminUpdateCollection: ctx.catalog.adminUpdateCollection,
      adminDeleteCollection: ctx.catalog.adminDeleteCollection,
    });
    app.use('/api/v1', createCatalogRoutes(catalogController, authMiddleware, rbacMiddleware));

    const mediaController = createMediaController({
      generateUploadSignature: ctx.media.generateUploadSignature,
      confirmUpload: ctx.media.confirmUpload,
      listMediaByOwner: ctx.media.listMediaByOwner,
    });
    app.use('/api/v1', createMediaRoutes(mediaController, authMiddleware, rbacMiddleware));

    const cartController = createCartController({
      getCart: ctx.cart.getCart,
      addItemToCart: ctx.cart.addItemToCart,
      removeItemFromCart: ctx.cart.removeItemFromCart,
      updateItemQuantity: ctx.cart.updateItemQuantity,
      mergeGuestCart: ctx.cart.mergeGuestCart,
      applyCouponToCart: ctx.cart.applyCouponToCart,
      removeCouponFromCart: ctx.cart.removeCouponFromCart,
      getActiveCoupons: ctx.cart.getActiveCoupons,
    });
    app.use('/api/v1', createCartRoutes(cartController, authMiddleware));

    // ---- Sprint 3: Leads ---------------------------------------------------------------------
    const leadsController = createLeadsController({
      submitLeadUseCase: ctx.leads.submitLead,
      listLeadsUseCase: ctx.leads.listLeads,
      assignLeadUseCase: ctx.leads.assignLead,
      updateLeadStatusUseCase: ctx.leads.updateLeadStatus,
    });
    app.use('/api/v1', createLeadsRoutes(leadsController, authMiddleware, rbacMiddleware));

    // ---- Sprint 4: Design Projects -----------------------------------------------------------
    const designProjectsController = new DesignProjectsController({
      createDesignProject: ctx.designProjects.createDesignProject,
      advanceProjectStage: ctx.designProjects.advanceProjectStage,
      addQuotation: ctx.designProjects.addQuotation,
      approveQuotation: ctx.designProjects.approveQuotation,
      listDesignProjects: ctx.designProjects.listDesignProjects,
      getDesignProjectById: ctx.designProjects.getDesignProjectById,
      getFunnelMetrics: ctx.designProjects.getFunnelMetrics,
      portfolioRepository: ctx.designProjects.portfolioRepository,
    });
    app.use(
      '/api/v1/design-projects',
      createDesignProjectsRouter(designProjectsController, authMiddleware, rbacMiddleware),
    );

    // ---- Sprint 5: Orders -----------------------------------------------------------
    const ordersController = new OrdersController(
      ctx.orders.checkout,
      ctx.orders.getOrders,
      ctx.orders.updateOrderStatus,
      ctx.orders.getOrderById,
    );
    app.use('/api/v1/orders', createOrdersRouter(ordersController, authMiddleware, rbacMiddleware));
    app.use(
      '/api/v1/admin/orders',
      createOrdersRouter(ordersController, authMiddleware, rbacMiddleware),
    );
    app.use('/orders', createOrdersRouter(ordersController, authMiddleware, rbacMiddleware));
    app.use('/admin/orders', createOrdersRouter(ordersController, authMiddleware, rbacMiddleware));

    // ---- Sprint 6: Payments ---------------------------------------------------------
    const paymentsController = new PaymentsController(
      ctx.payments.confirmWebhook,
      ctx.payments.listPayments,
      env.RAZORPAY_WEBHOOK_SECRET,
      ctx.payments.verifyPayment,
      ctx.payments.reconcilePayment,
      ctx.payments.refundPayment,
      ctx.payments.getPaymentById,
      ctx.payments.getPaymentMetrics,
      ctx.payments.razorpayAdapter,
    );
    // InvoicesController is now imported at the top of the file
    const invoicesController = new InvoicesController(ctx.payments.getInvoice);

    // NOTE: the router contains express.raw() scoped only to the webhook route,
    // overriding the global express.json() for that endpoint only.
    app.use(
      '/api/v1',
      createPaymentsRouter(paymentsController, invoicesController, authMiddleware, rbacMiddleware),
    );
    app.use(
      '/',
      createPaymentsRouter(paymentsController, invoicesController, authMiddleware, rbacMiddleware),
    );

    // ---- Sprint 7: Notifications ----------------------------------------------------
    const notificationsController = new NotificationsController(
      ctx.notifications.listNotificationsUseCase,
      ctx.notifications.markNotificationAsReadUseCase,
      ctx.notifications.createAndSendUseCase,
      ctx.notifications.getMyNotificationsUseCase,
      ctx.notifications.getUnreadCountUseCase,
      ctx.notifications.markAllAsReadUseCase,
      ctx.notifications.sendTestNotificationUseCase,
      ctx.notifications.getDeliveryStatsUseCase,
    );
    app.use(
      '/api/v1/notifications',
      createNotificationsRouter(notificationsController, authMiddleware, rbacMiddleware),
    );

    // ---- Sprint 8: CMS --------------------------------------------------------------
    const cmsController = new CmsController(
      ctx.cms.listBlogsUseCase,
      ctx.cms.getBlogBySlugUseCase,
      ctx.cms.createBlogUseCase,
      ctx.cms.updateBlogUseCase,
      ctx.cms.listBannersUseCase,
      ctx.cms.listAdminBannersUseCase,
      ctx.cms.getBannerByIdUseCase,
      ctx.cms.createBannerUseCase,
      ctx.cms.updateBannerUseCase,
      ctx.cms.deleteBannerUseCase,
      ctx.cms.toggleBannerStatusUseCase,
      ctx.cms.trackBannerClickUseCase,
      ctx.cms.trackBannerImpressionUseCase,
      ctx.cms.listTestimonialsUseCase,
      ctx.cms.createTestimonialUseCase,
      ctx.cms.subscribeNewsletterUseCase,
      ctx.cms.listNewsletterSubscribersUseCase,
    );
    app.use('/api/v1/cms', createCmsRouter(cmsController, authMiddleware, rbacMiddleware));
    app.use(
      '/api/v1/admin/cms',
      createCmsAdminRouter(cmsController, authMiddleware, rbacMiddleware),
    );

    // ---- Sprint 9: Analytics --------------------------------------------------------
    const analyticsAdminController = new AnalyticsAdminController(ctx.analytics.useCases);
    const analyticsRouter = createAnalyticsAdminRouter(analyticsAdminController);
    app.use('/api/v1/admin/analytics', authMiddleware, analyticsRouter);
    app.use('/api/v1/analytics', authMiddleware, analyticsRouter);

    // ---- Sprint 11: CRM -------------------------------------------------------------
    const crmController = new CrmController(ctx.crm.useCases);
    app.use(
      '/api/v1/crm',
      createCrmRoutes(crmController, authMiddleware, (perm: string) => requirePermissions(perm)),
    );

    // ---- Sprint 12: Reviews ---------------------------------------------------------
    const reviewsController = new ReviewsController(
      ctx.reviews.submitReview,
      ctx.reviews.moderateReview,
      ctx.reviews.getProductReviews,
      ctx.reviews.listReviews,
      ctx.reviews.adminReplyReview,
      ctx.reviews.toggleHelpfulVote,
      ctx.reviews.getProductReviewStats,
      ctx.reviews.deleteReview,
    );
    app.use('/api/v1', createReviewsRoutes(reviewsController, authMiddleware, rbacMiddleware));
  }

  // Must be registered last — docs/02 §16's centralized error middleware.
  app.use(errorHandlerMiddleware);

  return app;
}
