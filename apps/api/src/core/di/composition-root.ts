// The composition root — docs/02_enterprise_architecture.md §7.3 (manual composition, not a DI
// framework), docs/06_project_structure.md §4.2: "the ONLY place concrete Infrastructure
// implementations are wired into Application-layer use-cases… this file only wires, it never
// decides".
//
// Note on module boundaries: this file legitimately imports from every module's application/ and
// infrastructure/ layers, because composition is precisely its job. The rule it must not break is
// the reverse one — no module may import another module's infrastructure/domain. Cross-module
// dependencies below are satisfied by passing `admin`'s PermissionResolver/AuditLogger into
// `auth`'s constructor as the INTERFACE `auth` declares in its own ports.ts (docs/06 §4.3/§1.6).
import type { Redis } from 'ioredis';
import mongooseInstance from 'mongoose';
import type mongoose from 'mongoose';
import type { Logger } from 'pino';
import { redisClient } from '../cache';
import { logger } from '../logger';

import {
  AuditLogger,
  ListAuditLogs,
  ListPermissions,
  ListRoles,
} from '../../modules/admin/application/audit-logger';
import { PermissionResolver } from '../../modules/admin/application/permission-resolver';
import {
  MongoAuditLogRepository,
  MongoPermissionRepository,
  MongoRoleRepository,
} from '../../modules/admin/infrastructure/admin.repositories';

import { IssueSession } from '../../modules/auth/application/issue-session.use-case';
import { LoginUser } from '../../modules/auth/application/login-user.use-case';
import { SetupMfa, VerifyMfa } from '../../modules/auth/application/mfa.use-cases';
import { RegisterUser } from '../../modules/auth/application/register-user.use-case';
import {
  LogoutUser,
  RefreshTokenUseCase,
} from '../../modules/auth/application/refresh-token.use-case';
import { MongoAuthUserRepository } from '../../modules/auth/infrastructure/auth-user.repository';
import { BcryptPasswordHasher } from '../../modules/auth/infrastructure/bcrypt-password-hasher';
import { JwtTokenService } from '../../modules/auth/infrastructure/jwt-token.service';
import { MongoRefreshTokenRepository } from '../../modules/auth/infrastructure/refresh-token.repository';
import { OtplibTotpService } from '../../modules/auth/infrastructure/totp.service';
import { GoogleAuthService } from '../../modules/auth/infrastructure/google-auth.service';
import { FacebookAuthService } from '../../modules/auth/infrastructure/facebook-auth.service';
import { MockSmsService as AuthSmsService } from '../../modules/auth/infrastructure/sms.service';
import {
  AuthenticateWithGoogle,
  AuthenticateWithFacebook,
} from '../../modules/auth/application/social-auth.use-cases';
import { SendPhoneOtp, VerifyPhoneOtp } from '../../modules/auth/application/otp-auth.use-cases';

import {
  AdminCreateUser,
  AdminGetUserDetail,
  AdminListUsers,
  AdminListUsersWithFilters,
  AdminOnboardUser,
  AdminResendOnboarding,
  AdminResetUserPassword,
  AdminUpdateUserStatus,
  CompleteOnboarding,
  GetOwnProfile,
  UpdateOwnProfile,
  VerifyOnboardingToken,
} from '../../modules/users/application/user.use-cases';
import { MongoUserProfileRepository } from '../../modules/users/infrastructure/user-profile.repository';

// ---- Sprint 2: Catalog, Media, Cart ---------------------------------------------------------
import {
  AdminAdjustInventory,
  AdminCreateCategory,
  AdminUpdateCategory,
  AdminGetCategory,
  AdminDeleteCategory,
  GetCategory,
  AdminCreateProduct,
  AdminListProducts,
  AdminUpdateProduct,
  AdminGetProduct,
  AdminArchiveProduct,
  GetProductDetail,
  ListCategories,
  ListProducts,
  ListCollections,
  GetCollectionDetail,
  AdminListCollections,
  AdminGetCollection,
  AdminCreateCollection,
  AdminUpdateCollection,
  AdminDeleteCollection,
} from '../../modules/catalog/application/catalog.use-cases';
import {
  MongoCategoryRepository,
  MongoInventoryMovementRepository,
  MongoInventoryRepository,
  MongoProductRepository,
  MongoWarehouseRepository,
  MongoProductCollectionRepository,
} from '../../modules/catalog/infrastructure/catalog.repositories';

import {
  ConfirmUpload,
  GenerateUploadSignature,
  ListMediaByOwner,
} from '../../modules/media/application/media.use-cases';
import { CloudinaryMediaService } from '../../modules/media/infrastructure/services/cloudinary-media.service';
import { MongoMediaAssetRepository } from '../../modules/media/infrastructure/media-asset.repository';

import {
  AddItemToCart,
  GetCart,
  MergeGuestCart,
  RemoveItemFromCart,
  UpdateItemQuantity,
  ApplyCouponToCart,
  RemoveCouponFromCart,
  GetActiveCoupons,
} from '../../modules/cart/application/cart.use-cases';
import { MongoCartRepository } from '../../modules/cart/infrastructure/cart.repository';
import { CatalogProductSnapshotProvider } from '../../modules/cart/infrastructure/catalog-snapshot.provider';
import { CouponServiceAdapter } from './adapters/coupon-service.adapter';
import { MongoCouponRepository } from '../../modules/orders/infrastructure/repositories/coupon.repository';

import {
  SubmitLeadUseCase,
  ListLeadsUseCase,
  AssignLeadUseCase,
  UpdateLeadStatusUseCase,
  GetLeadsFunnelUseCase,
} from '../../modules/leads/application/leads.use-cases';
import { MongoLeadRepository } from '../../modules/leads/infrastructure/leads.repository';

// ---- Sprint 4: Design Projects -------------------------------------------------------------
import {
  CreateDesignProjectUseCase,
  AdvanceProjectStageUseCase,
  AddQuotationUseCase,
  ApproveQuotationUseCase,
  ListDesignProjectsUseCase,
  GetDesignFunnelUseCase,
  GetDesignProjectByIdUseCase,
} from '../../modules/design-projects/application/design-projects.use-cases';
import { MongoDesignProjectRepository } from '../../modules/design-projects/infrastructure/repositories/mongo-design-project.repository';
import { MongoPortfolioRepository } from '../../modules/design-projects/infrastructure/repositories/mongo-portfolio.repository';
import { DEFAULT_PORTFOLIO_PROJECTS } from '../../modules/design-projects/domain/default-portfolio-data';

// ---- Sprint 5: Orders -------------------------------------------------------------
import {
  CheckoutUseCase,
  GetOrdersUseCase,
  UpdateOrderStatusUseCase,
  GetSalesMetricsUseCase,
  GetOrderByIdUseCase,
} from '../../modules/orders/application/orders.use-cases';
import { MongoOrderRepository } from '../../modules/orders/infrastructure/repositories/mongo-order.repository';
import {
  CartProviderAdapter,
  CatalogInventoryAdapter,
} from '../../modules/orders/infrastructure/orders.adapters';
import { PaymentStatus } from '../../modules/orders/domain/orders.types';

// ---- Sprint 6: Payments ------------------------------------------------------------
import {
  ConfirmWebhookPaymentUseCase,
  ListPaymentsUseCase,
  VerifyPaymentUseCase,
  ReconcilePaymentUseCase,
  RefundPaymentUseCase,
  GetPaymentByIdUseCase,
  GetPaymentMetricsUseCase,
} from '../../modules/payments/application/payments.use-cases';
import { GenerateInvoiceUseCase } from '../../modules/payments/application/generate-invoice.use-case';
import { GetInvoiceUseCase } from '../../modules/payments/application/get-invoice.use-case';
import { MongoPaymentRepository } from '../../modules/payments/infrastructure/repositories/mongo-payment.repository';
import { MongoInvoiceRepository } from '../../modules/payments/infrastructure/repositories/mongo-invoice.repository';
import { RazorpayPaymentAdapter } from '../../modules/payments/infrastructure/adapters/razorpay.adapter';
import { PdfGeneratorAdapter } from '../../modules/payments/infrastructure/adapters/pdf-generator.adapter';
import { CloudinaryInvoiceUploaderAdapter } from '../../modules/payments/infrastructure/adapters/cloudinary-invoice-uploader.adapter';
import { IOrderPaymentPort, IInventoryCommitPort } from '../../modules/payments/application/ports';
import { env } from '../config/env';

// ---- Sprint 7: Notifications & Outbox ----------------------------------------------
import { MongoOutboxRepository } from '../events/outbox.repository';
import { MongoNotificationRepository } from '../../modules/notifications/infrastructure/repositories/mongo-notification.repository';
import { ResendEmailAdapter } from '../../modules/notifications/infrastructure/adapters/resend-email.adapter';
import { Msg91SmsAdapter } from '../../modules/notifications/infrastructure/adapters/msg91-sms.adapter';
import { WhatsAppCloudAdapter } from '../../modules/notifications/infrastructure/adapters/whatsapp-cloud.adapter';
import {
  ProcessOutboxRelayUseCase,
  ListNotificationsUseCase,
  GetMyNotificationsUseCase,
  GetUnreadCountUseCase,
  MarkNotificationAsReadUseCase,
  MarkAllAsReadUseCase,
  CreateAndSendNotificationUseCase,
  SendNotificationByIdUseCase,
  SendTestNotificationUseCase,
  GetDeliveryStatsUseCase,
} from '../../modules/notifications/application/notifications.use-cases';
import { OutboxPoller } from '../../modules/notifications/infrastructure/workers/outbox-poller';

// ---- Sprint 8: CMS -----------------------------------------------------------------
import {
  MongoBlogRepository,
  MongoBannerRepository,
  MongoTestimonialRepository,
  MongoNewsletterRepository,
} from '../../modules/cms/infrastructure/repositories/mongo-cms.repository';
import {
  ListBlogsUseCase,
  GetBlogBySlugUseCase,
  CreateBlogUseCase,
  UpdateBlogUseCase,
  ListBannersUseCase,
  ListAdminBannersUseCase,
  GetBannerByIdUseCase,
  CreateBannerUseCase,
  UpdateBannerUseCase,
  DeleteBannerUseCase,
  ToggleBannerStatusUseCase,
  TrackBannerClickUseCase,
  TrackBannerImpressionUseCase,
  ListTestimonialsUseCase,
  CreateTestimonialUseCase,
  SubscribeNewsletterUseCase,
  ListNewsletterSubscribersUseCase,
} from '../../modules/cms/application/cms.use-cases';

// ---- Sprint 9: Analytics -----------------------------------------------------------
import { AnalyticsUseCases } from '../../modules/analytics/application/analytics.use-cases';
import { AnalyticsJobProcessor } from '../../modules/analytics/infrastructure/analytics.job-processor';

// ---- Sprint 11: CRM ----------------------------------------------------------------
import { CrmUseCases } from '../../modules/crm/application/crm.use-cases';
import {
  MongoCustomerRepository,
  MongoLeadActivityRepository,
  MongoLeadStatusHistoryRepository,
  MongoSalesRepresentativeRepository,
} from '../../modules/crm/infrastructure/crm.repositories';
import { DEFAULT_SALES_REPRESENTATIVES } from '../../modules/crm/domain/default-crm-data';

// ---- Sprint 12: Reviews ------------------------------------------------------------
import {
  SubmitReviewUseCase,
  ModerateReviewUseCase,
  GetProductReviewsUseCase,
  ListReviewsUseCase,
  AdminReplyReviewUseCase,
  ToggleHelpfulVoteUseCase,
  GetProductReviewStatsUseCase,
  DeleteReviewUseCase,
} from '../../modules/reviews/application/reviews.use-cases';
import { MongoReviewRepository } from '../../modules/reviews/infrastructure/reviews.repository';
import {
  OrderPurchaseProvider,
  CatalogRatingProvider,
} from '../../modules/reviews/infrastructure/reviews.adapters';

export interface AppContext {
  readonly logger: Logger;
  readonly cache: Redis;
  readonly mongoose: typeof mongoose;

  readonly auth: {
    registerUser: RegisterUser;
    loginUser: LoginUser;
    issueSession: IssueSession;
    setupMfa: SetupMfa;
    verifyMfa: VerifyMfa;
    refreshToken: RefreshTokenUseCase;
    logoutUser: LogoutUser;
    tokenService: JwtTokenService;
    passwordHasher: BcryptPasswordHasher;
    authenticateWithGoogle: AuthenticateWithGoogle;
    authenticateWithFacebook: AuthenticateWithFacebook;
    sendPhoneOtp: SendPhoneOtp;
    verifyPhoneOtp: VerifyPhoneOtp;
  };
  readonly users: {
    getOwnProfile: GetOwnProfile;
    updateOwnProfile: UpdateOwnProfile;
    adminListUsers: AdminListUsers;
    adminListUsersWithFilters: AdminListUsersWithFilters;
    adminGetUserDetail: AdminGetUserDetail;
    adminCreateUser: AdminCreateUser;
    adminOnboardUser: AdminOnboardUser;
    adminResendOnboarding: AdminResendOnboarding;
    adminResetUserPassword: AdminResetUserPassword;
    adminUpdateUserStatus: AdminUpdateUserStatus;
    verifyOnboardingToken: VerifyOnboardingToken;
    completeOnboarding: CompleteOnboarding;
    userProfileRepository: MongoUserProfileRepository;
  };
  readonly admin: {
    listRoles: ListRoles;
    listPermissions: ListPermissions;
    listAuditLogs: ListAuditLogs;
    permissionResolver: PermissionResolver;
    auditLogger: AuditLogger;
    roleRepository: MongoRoleRepository;
  };
  readonly authUserRepository: MongoAuthUserRepository;
  readonly catalog: {
    listCategories: ListCategories;
    listProducts: ListProducts;
    getProductDetail: GetProductDetail;
    adminListProducts: AdminListProducts;
    adminCreateProduct: AdminCreateProduct;
    adminUpdateProduct: AdminUpdateProduct;
    adminGetProduct: AdminGetProduct;
    adminArchiveProduct: AdminArchiveProduct;
    adminCreateCategory: AdminCreateCategory;
    adminUpdateCategory: AdminUpdateCategory;
    adminGetCategory: AdminGetCategory;
    adminDeleteCategory: AdminDeleteCategory;
    getCategory: GetCategory;
    adminAdjustInventory: AdminAdjustInventory;
    listCollections: ListCollections;
    getCollectionDetail: GetCollectionDetail;
    adminListCollections: AdminListCollections;
    adminGetCollection: AdminGetCollection;
    adminCreateCollection: AdminCreateCollection;
    adminUpdateCollection: AdminUpdateCollection;
    adminDeleteCollection: AdminDeleteCollection;
  };
  readonly media: {
    generateUploadSignature: GenerateUploadSignature;
    confirmUpload: ConfirmUpload;
    listMediaByOwner: ListMediaByOwner;
  };
  readonly cart: {
    getCart: GetCart;
    addItemToCart: AddItemToCart;
    removeItemFromCart: RemoveItemFromCart;
    updateItemQuantity: UpdateItemQuantity;
    mergeGuestCart: MergeGuestCart;
    applyCouponToCart: ApplyCouponToCart;
    removeCouponFromCart: RemoveCouponFromCart;
    getActiveCoupons: GetActiveCoupons;
  };
  readonly leads: {
    submitLead: SubmitLeadUseCase;
    listLeads: ListLeadsUseCase;
    assignLead: AssignLeadUseCase;
    updateLeadStatus: UpdateLeadStatusUseCase;
  };
  readonly designProjects: {
    createDesignProject: CreateDesignProjectUseCase;
    advanceProjectStage: AdvanceProjectStageUseCase;
    addQuotation: AddQuotationUseCase;
    approveQuotation: ApproveQuotationUseCase;
    listDesignProjects: ListDesignProjectsUseCase;
    getDesignProjectById: GetDesignProjectByIdUseCase;
    getFunnelMetrics: GetDesignFunnelUseCase;
    portfolioRepository: MongoPortfolioRepository;
  };
  readonly orders: {
    checkout: CheckoutUseCase;
    getOrders: GetOrdersUseCase;
    getOrderById: GetOrderByIdUseCase;
    updateOrderStatus: UpdateOrderStatusUseCase;
    getSalesMetrics: GetSalesMetricsUseCase;
  };
  readonly payments: {
    confirmWebhook: ConfirmWebhookPaymentUseCase;
    listPayments: ListPaymentsUseCase;
    verifyPayment: VerifyPaymentUseCase;
    reconcilePayment: ReconcilePaymentUseCase;
    refundPayment: RefundPaymentUseCase;
    getPaymentById: GetPaymentByIdUseCase;
    getPaymentMetrics: GetPaymentMetricsUseCase;
    razorpayAdapter: RazorpayPaymentAdapter;
    generateInvoice: import('../../modules/payments/application/generate-invoice.use-case').GenerateInvoiceUseCase;
    getInvoice: import('../../modules/payments/application/get-invoice.use-case').GetInvoiceUseCase;
  };
  readonly notifications: {
    listNotificationsUseCase: ListNotificationsUseCase;
    markNotificationAsReadUseCase: MarkNotificationAsReadUseCase;
    createAndSendUseCase: CreateAndSendNotificationUseCase;
    sendNotificationByIdUseCase: SendNotificationByIdUseCase;
    getMyNotificationsUseCase: GetMyNotificationsUseCase;
    getUnreadCountUseCase: GetUnreadCountUseCase;
    markAllAsReadUseCase: MarkAllAsReadUseCase;
    sendTestNotificationUseCase: SendTestNotificationUseCase;
    getDeliveryStatsUseCase: GetDeliveryStatsUseCase;
    emailAdapter: ResendEmailAdapter;
    smsAdapter: Msg91SmsAdapter;
    whatsappAdapter: WhatsAppCloudAdapter;
  };
  readonly cms: {
    listBlogsUseCase: ListBlogsUseCase;
    getBlogBySlugUseCase: GetBlogBySlugUseCase;
    createBlogUseCase: CreateBlogUseCase;
    updateBlogUseCase: UpdateBlogUseCase;
    listBannersUseCase: ListBannersUseCase;
    listAdminBannersUseCase: ListAdminBannersUseCase;
    getBannerByIdUseCase: GetBannerByIdUseCase;
    createBannerUseCase: CreateBannerUseCase;
    updateBannerUseCase: UpdateBannerUseCase;
    deleteBannerUseCase: DeleteBannerUseCase;
    toggleBannerStatusUseCase: ToggleBannerStatusUseCase;
    trackBannerClickUseCase: TrackBannerClickUseCase;
    trackBannerImpressionUseCase: TrackBannerImpressionUseCase;
    listTestimonialsUseCase: ListTestimonialsUseCase;
    createTestimonialUseCase: CreateTestimonialUseCase;
    subscribeNewsletterUseCase: SubscribeNewsletterUseCase;
    listNewsletterSubscribersUseCase: ListNewsletterSubscribersUseCase;
  };
  readonly analytics: {
    useCases: import('../../modules/analytics/application/analytics.use-cases').AnalyticsUseCases;
    jobProcessor: import('../../modules/analytics/infrastructure/analytics.job-processor').AnalyticsJobProcessor;
  };
  readonly crm: {
    useCases: CrmUseCases;
  };
  readonly reviews: {
    submitReview: SubmitReviewUseCase;
    moderateReview: ModerateReviewUseCase;
    getProductReviews: GetProductReviewsUseCase;
    listReviews: ListReviewsUseCase;
    adminReplyReview: AdminReplyReviewUseCase;
    toggleHelpfulVote: ToggleHelpfulVoteUseCase;
    getProductReviewStats: GetProductReviewStatsUseCase;
    deleteReview: DeleteReviewUseCase;
  };
}

let appContext: AppContext | undefined;

/** Builds (once) and returns the wired application graph. Idempotent. */
export function buildAppContext(): AppContext {
  if (appContext) {
    return appContext;
  }

  // ---- Infrastructure ------------------------------------------------------------------------
  const roleRepository = new MongoRoleRepository();
  const permissionRepository = new MongoPermissionRepository();
  const auditLogRepository = new MongoAuditLogRepository();
  const authUserRepository = new MongoAuthUserRepository();
  const refreshTokenRepository = new MongoRefreshTokenRepository();
  const userProfileRepository = new MongoUserProfileRepository();

  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService();
  const totpService = new OtplibTotpService();
  const googleAuthService = new GoogleAuthService();
  const facebookAuthService = new FacebookAuthService();
  const authSmsService = new AuthSmsService();

  // ---- admin: the two interfaces every other module consumes ---------------------------------
  const permissionResolver = new PermissionResolver(roleRepository, permissionRepository);
  const auditLogger = new AuditLogger(auditLogRepository);

  // ---- auth ----------------------------------------------------------------------------------
  const resolveCustomerRoleId = async (): Promise<string> => {
    const role = await roleRepository.findByName('CUSTOMER');
    if (!role) {
      throw new Error('CUSTOMER role is missing — run packages/database migrations 0002 and 0003');
    }
    return role.id;
  };

  const resolveRoleName = (roleId: string): Promise<string> =>
    permissionResolver.resolveRoleName(roleId);

  const auth = {
    registerUser: new RegisterUser(
      authUserRepository,
      passwordHasher,
      permissionResolver,
      resolveCustomerRoleId,
    ),
    loginUser: new LoginUser(authUserRepository, passwordHasher),
    issueSession: new IssueSession(
      authUserRepository,
      refreshTokenRepository,
      tokenService,
      permissionResolver,
    ),
    setupMfa: new SetupMfa(authUserRepository, totpService),
    verifyMfa: new VerifyMfa(authUserRepository, totpService),
    refreshToken: new RefreshTokenUseCase(
      refreshTokenRepository,
      authUserRepository,
      tokenService,
      auditLogger,
      resolveRoleName,
    ),
    logoutUser: new LogoutUser(refreshTokenRepository, tokenService),
    tokenService,
    passwordHasher,
    authenticateWithGoogle: new AuthenticateWithGoogle(
      authUserRepository,
      googleAuthService,
      resolveCustomerRoleId,
    ),
    authenticateWithFacebook: new AuthenticateWithFacebook(
      authUserRepository,
      facebookAuthService,
      resolveCustomerRoleId,
    ),
    sendPhoneOtp: new SendPhoneOtp(authUserRepository, authSmsService),
    verifyPhoneOtp: new VerifyPhoneOtp(authUserRepository, resolveCustomerRoleId),
  };

  // ---- users ---------------------------------------------------------------------------------
  const users = {
    getOwnProfile: new GetOwnProfile(userProfileRepository),
    updateOwnProfile: new UpdateOwnProfile(userProfileRepository),
    adminListUsers: new AdminListUsers(userProfileRepository),
    adminListUsersWithFilters: new AdminListUsersWithFilters(userProfileRepository),
    adminGetUserDetail: new AdminGetUserDetail(userProfileRepository),
    adminCreateUser: new AdminCreateUser(userProfileRepository),
    adminOnboardUser: new AdminOnboardUser(userProfileRepository, (p) => passwordHasher.hash(p)),
    adminResendOnboarding: new AdminResendOnboarding(userProfileRepository),
    adminResetUserPassword: new AdminResetUserPassword(userProfileRepository, (p) =>
      passwordHasher.hash(p),
    ),
    adminUpdateUserStatus: new AdminUpdateUserStatus(userProfileRepository),
    verifyOnboardingToken: new VerifyOnboardingToken(userProfileRepository),
    completeOnboarding: new CompleteOnboarding(
      userProfileRepository,
      (p) => passwordHasher.hash(p),
      async (userId, roleId, deviceInfo) => {
        const roleName = (await permissionResolver.resolveRoleName(roleId)) || 'CUSTOMER';
        return auth.issueSession.execute({ userId, roleName, deviceInfo });
      },
    ),
    userProfileRepository,
  };

  // ---- admin read surface --------------------------------------------------------------------
  const admin = {
    listRoles: new ListRoles(roleRepository),
    listPermissions: new ListPermissions(permissionRepository),
    listAuditLogs: new ListAuditLogs(auditLogRepository),
    permissionResolver,
    auditLogger,
    roleRepository,
  };

  // ---- Sprint 2: Catalog ------------------------------------------------------------------
  const productRepository = new MongoProductRepository();
  const categoryRepository = new MongoCategoryRepository();
  const productCollectionRepository = new MongoProductCollectionRepository();
  const inventoryRepository = new MongoInventoryRepository();
  const inventoryMovementRepository = new MongoInventoryMovementRepository();
  const warehouseRepository = new MongoWarehouseRepository();

  const catalog = {
    listCategories: new ListCategories(categoryRepository),
    listProducts: new ListProducts(productRepository),
    getProductDetail: new GetProductDetail(productRepository),
    adminListProducts: new AdminListProducts(productRepository),
    adminCreateProduct: new AdminCreateProduct(productRepository),
    adminUpdateProduct: new AdminUpdateProduct(productRepository),
    adminGetProduct: new AdminGetProduct(productRepository),
    adminArchiveProduct: new AdminArchiveProduct(productRepository),
    adminCreateCategory: new AdminCreateCategory(categoryRepository),
    adminUpdateCategory: new AdminUpdateCategory(categoryRepository),
    adminGetCategory: new AdminGetCategory(categoryRepository),
    adminDeleteCategory: new AdminDeleteCategory(categoryRepository, productRepository),
    getCategory: new GetCategory(categoryRepository),
    adminAdjustInventory: new AdminAdjustInventory(
      inventoryRepository,
      inventoryMovementRepository,
      warehouseRepository,
    ),
    listCollections: new ListCollections(productCollectionRepository),
    getCollectionDetail: new GetCollectionDetail(productCollectionRepository),
    adminListCollections: new AdminListCollections(productCollectionRepository),
    adminGetCollection: new AdminGetCollection(productCollectionRepository),
    adminCreateCollection: new AdminCreateCollection(productCollectionRepository),
    adminUpdateCollection: new AdminUpdateCollection(productCollectionRepository),
    adminDeleteCollection: new AdminDeleteCollection(productCollectionRepository),
  };

  // ---- Sprint 2: Media --------------------------------------------------------------------
  const cloudinaryService = new CloudinaryMediaService();
  const mediaAssetRepository = new MongoMediaAssetRepository();

  const media = {
    generateUploadSignature: new GenerateUploadSignature(cloudinaryService),
    confirmUpload: new ConfirmUpload(mediaAssetRepository),
    listMediaByOwner: new ListMediaByOwner(mediaAssetRepository),
  };

  // ---- Sprint 2: Cart ---------------------------------------------------------------------
  const cartRepository = new MongoCartRepository();
  const couponRepository = new MongoCouponRepository();
  const couponService = new CouponServiceAdapter(couponRepository);
  // Cross-module dependency: Cart -> Catalog resolved through IProductSnapshotProvider.
  const productSnapshotProvider = new CatalogProductSnapshotProvider(
    productRepository,
    inventoryRepository,
  );

  const cart = {
    getCart: new GetCart(cartRepository),
    addItemToCart: new AddItemToCart(cartRepository, productSnapshotProvider),
    removeItemFromCart: new RemoveItemFromCart(cartRepository),
    updateItemQuantity: new UpdateItemQuantity(cartRepository),
    mergeGuestCart: new MergeGuestCart(cartRepository),
    applyCouponToCart: new ApplyCouponToCart(cartRepository, couponService),
    removeCouponFromCart: new RemoveCouponFromCart(cartRepository),
    getActiveCoupons: new GetActiveCoupons(couponService),
  };

  // ---- Sprint 7: Outbox & Notifications ----------------------------------------------------
  const outboxRepository = new MongoOutboxRepository();
  const notificationRepository = new MongoNotificationRepository();
  const emailAdapter = new ResendEmailAdapter();
  const smsAdapter = new Msg91SmsAdapter();
  const whatsappAdapter = new WhatsAppCloudAdapter();

  const processOutboxRelayUseCase = new ProcessOutboxRelayUseCase(
    outboxRepository,
    notificationRepository,
    emailAdapter,
    smsAdapter,
    whatsappAdapter,
  );
  const listNotificationsUseCase = new ListNotificationsUseCase(notificationRepository);
  const getMyNotificationsUseCase = new GetMyNotificationsUseCase(notificationRepository);
  const getUnreadCountUseCase = new GetUnreadCountUseCase(notificationRepository);
  const markNotificationAsReadUseCase = new MarkNotificationAsReadUseCase(notificationRepository);
  const markAllAsReadUseCase = new MarkAllAsReadUseCase(notificationRepository);
  const createAndSendUseCase = new CreateAndSendNotificationUseCase(
    notificationRepository,
    emailAdapter,
    smsAdapter,
    whatsappAdapter,
  );

  const sendNotificationByIdUseCase = new SendNotificationByIdUseCase(
    notificationRepository,
    emailAdapter,
    smsAdapter,
    whatsappAdapter,
  );

  const sendTestNotificationUseCase = new SendTestNotificationUseCase(
    createAndSendUseCase,
    sendNotificationByIdUseCase,
  );

  const getDeliveryStatsUseCase = new GetDeliveryStatsUseCase(notificationRepository);

  const notifications = {
    listNotificationsUseCase,
    markNotificationAsReadUseCase,
    createAndSendUseCase,
    sendNotificationByIdUseCase,
    getMyNotificationsUseCase,
    getUnreadCountUseCase,
    markAllAsReadUseCase,
    sendTestNotificationUseCase,
    getDeliveryStatsUseCase,
    emailAdapter,
    smsAdapter,
    whatsappAdapter,
  };

  const outboxPoller = new OutboxPoller(processOutboxRelayUseCase, 10000);
  // Do not start the poller in tests, only when actually running the app (handled in app.ts ideally, but ok to start here if we manage teardown, for MVP we start here)
  if (process.env.NODE_ENV !== 'test') {
    outboxPoller.start();
  }

  // ---- Sprint 11: CRM Repositories (Initialized early for omnichannel lead sync) ---
  const customerRepository = new MongoCustomerRepository();
  const leadActivityRepository = new MongoLeadActivityRepository();
  const leadStatusHistoryRepository = new MongoLeadStatusHistoryRepository();
  const salesRepresentativeRepository = new MongoSalesRepresentativeRepository();

  if (process.env.NODE_ENV !== 'test') {
    salesRepresentativeRepository.seedIfEmpty(DEFAULT_SALES_REPRESENTATIVES).catch((err) => {
      logger.warn(`Failed to seed default sales representatives: ${err?.message}`);
    });
  }

  // ---- Sprint 3: Leads ---------------------------------------------------------------------
  const leadRepository = new MongoLeadRepository();

  const leads = {
    submitLead: new SubmitLeadUseCase(leadRepository, outboxRepository, customerRepository),
    listLeads: new ListLeadsUseCase(leadRepository),
    assignLead: new AssignLeadUseCase(leadRepository),
    updateLeadStatus: new UpdateLeadStatusUseCase(leadRepository),
  };

  // ---- Sprint 4: Design Projects -----------------------------------------------------------
  const designProjectRepository = new MongoDesignProjectRepository();
  const portfolioRepository = new MongoPortfolioRepository();

  if (process.env.NODE_ENV !== 'test') {
    portfolioRepository.seedIfEmpty(DEFAULT_PORTFOLIO_PROJECTS).catch((err) => {
      logger.warn(`Failed to seed default portfolio projects: ${err?.message}`);
    });
  }

  const designProjects = {
    createDesignProject: new CreateDesignProjectUseCase(designProjectRepository),
    advanceProjectStage: new AdvanceProjectStageUseCase(designProjectRepository),
    addQuotation: new AddQuotationUseCase(designProjectRepository),
    approveQuotation: new ApproveQuotationUseCase(designProjectRepository),
    listDesignProjects: new ListDesignProjectsUseCase(designProjectRepository),
    getDesignProjectById: new GetDesignProjectByIdUseCase(designProjectRepository),
    getFunnelMetrics: new GetDesignFunnelUseCase(designProjectRepository),
    portfolioRepository,
  };

  // ---- Sprint 5: Orders -----------------------------------------------------------
  const orderRepository = new MongoOrderRepository();
  const cartProvider = new CartProviderAdapter(cartRepository);
  const inventoryProvider = new CatalogInventoryAdapter(inventoryRepository);

  // ---- Sprint 6: Payments ---------------------------------------------------------
  const paymentRepository = new MongoPaymentRepository();

  // Razorpay SDK client — injected as interface so the adapter stays testable.
  // The SDK is only instantiated here (in the composition root), never inside module code.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Razorpay = require('razorpay');
  const razorpayClient = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });

  const razorpayAdapter = new RazorpayPaymentAdapter(razorpayClient, paymentRepository);

  // Order payment port — adapts IOrderPaymentPort by delegating to MongoOrderRepository.
  const orderPaymentPort: IOrderPaymentPort = {
    markOrderPaid: async (orderId: string) => {
      const order = await orderRepository.updatePaymentStatus(orderId, PaymentStatus.PAID);
      return order?.items || [];
    },
    markOrderPaymentFailed: async (orderId: string) => {
      const order = await orderRepository.updatePaymentStatus(orderId, PaymentStatus.FAILED);
      return order?.items || [];
    },
  };

  // Inventory commit port — stub (real implementation when catalog is wired for reservations).
  const inventoryCommitPort: IInventoryCommitPort = {
    commitStockDeduction: async (
      referenceId: string,
      items: Array<{ productId: string; variantId?: string | undefined; quantity: number }>,
    ) => {
      for (const item of items) {
        const invs = await inventoryRepository.findByProduct(item.productId);
        const inv = invs.find((i) => !item.variantId || i.variantId === item.variantId);
        if (inv) {
          await inventoryRepository.atomicCommit(inv.id, item.quantity, referenceId);
        }
      }
    },
    releaseReservation: async (
      referenceId: string,
      items: Array<{ productId: string; variantId?: string | undefined; quantity: number }>,
    ) => {
      for (const item of items) {
        const invs = await inventoryRepository.findByProduct(item.productId);
        const inv = invs.find((i) => !item.variantId || i.variantId === item.variantId);
        if (inv) {
          await inventoryRepository.atomicRelease(inv.id, item.quantity, referenceId);
        }
      }
    },
  };

  const invoiceRepository = new MongoInvoiceRepository();
  const pdfGeneratorAdapter = new PdfGeneratorAdapter();
  const cloudinaryInvoiceUploader = new CloudinaryInvoiceUploaderAdapter(cloudinaryService);

  const payments = {
    confirmWebhook: new ConfirmWebhookPaymentUseCase(
      paymentRepository,
      orderPaymentPort,
      inventoryCommitPort,
      outboxRepository,
    ),
    listPayments: new ListPaymentsUseCase(paymentRepository),
    verifyPayment: new VerifyPaymentUseCase(
      paymentRepository,
      orderPaymentPort,
      inventoryCommitPort,
      env.RAZORPAY_KEY_SECRET || env.RAZORPAY_WEBHOOK_SECRET,
      outboxRepository,
    ),
    reconcilePayment: new ReconcilePaymentUseCase(
      paymentRepository,
      orderPaymentPort,
      inventoryCommitPort,
      outboxRepository,
    ),
    refundPayment: new RefundPaymentUseCase(paymentRepository),
    getPaymentById: new GetPaymentByIdUseCase(paymentRepository),
    getPaymentMetrics: new GetPaymentMetricsUseCase(paymentRepository),
    razorpayAdapter,
    generateInvoice: new GenerateInvoiceUseCase(
      paymentRepository,
      invoiceRepository,
      pdfGeneratorAdapter,
      cloudinaryInvoiceUploader,
    ),
    getInvoice: new GetInvoiceUseCase(invoiceRepository),
  };

  const orders = {
    checkout: new CheckoutUseCase(
      orderRepository,
      cartProvider,
      inventoryProvider,
      razorpayAdapter,
    ),
    getOrders: new GetOrdersUseCase(orderRepository),
    getOrderById: new GetOrderByIdUseCase(orderRepository),
    updateOrderStatus: new UpdateOrderStatusUseCase(orderRepository),
    getSalesMetrics: new GetSalesMetricsUseCase(orderRepository),
  };

  // ---- Sprint 8: CMS --------------------------------------------------------------
  const blogRepository = new MongoBlogRepository();
  const bannerRepository = new MongoBannerRepository();
  const testimonialRepository = new MongoTestimonialRepository();
  const newsletterRepository = new MongoNewsletterRepository();

  const cms = {
    listBlogsUseCase: new ListBlogsUseCase(blogRepository),
    getBlogBySlugUseCase: new GetBlogBySlugUseCase(blogRepository),
    createBlogUseCase: new CreateBlogUseCase(blogRepository),
    updateBlogUseCase: new UpdateBlogUseCase(blogRepository),
    listBannersUseCase: new ListBannersUseCase(bannerRepository),
    listAdminBannersUseCase: new ListAdminBannersUseCase(bannerRepository),
    getBannerByIdUseCase: new GetBannerByIdUseCase(bannerRepository),
    createBannerUseCase: new CreateBannerUseCase(bannerRepository),
    updateBannerUseCase: new UpdateBannerUseCase(bannerRepository),
    deleteBannerUseCase: new DeleteBannerUseCase(bannerRepository),
    toggleBannerStatusUseCase: new ToggleBannerStatusUseCase(bannerRepository),
    trackBannerClickUseCase: new TrackBannerClickUseCase(bannerRepository),
    trackBannerImpressionUseCase: new TrackBannerImpressionUseCase(bannerRepository),
    listTestimonialsUseCase: new ListTestimonialsUseCase(testimonialRepository),
    createTestimonialUseCase: new CreateTestimonialUseCase(testimonialRepository),
    subscribeNewsletterUseCase: new SubscribeNewsletterUseCase(newsletterRepository),
    listNewsletterSubscribersUseCase: new ListNewsletterSubscribersUseCase(newsletterRepository),
  };

  const getLeadsFunnelUseCase = new GetLeadsFunnelUseCase(leadRepository);
  const getDesignFunnelUseCase = new GetDesignFunnelUseCase(designProjectRepository);
  const getSalesMetricsUseCase = new GetSalesMetricsUseCase(orderRepository);

  const analytics = {
    useCases: new AnalyticsUseCases(),
    jobProcessor: new AnalyticsJobProcessor(
      getLeadsFunnelUseCase,
      getDesignFunnelUseCase,
      getSalesMetricsUseCase,
    ),
  };

  // ---- Sprint 11: CRM Use Cases ---------------------------------------------------
  const crm = {
    useCases: new CrmUseCases(
      customerRepository,
      leadActivityRepository,
      leadStatusHistoryRepository,
      salesRepresentativeRepository,
    ),
  };

  // ---- Sprint 12: Reviews ----------------------------------------------------------
  const reviewRepository = new MongoReviewRepository();
  const orderPurchaseProvider = new OrderPurchaseProvider(orderRepository);
  const catalogRatingProvider = new CatalogRatingProvider(productRepository);

  const reviews = {
    submitReview: new SubmitReviewUseCase(reviewRepository, orderPurchaseProvider),
    moderateReview: new ModerateReviewUseCase(reviewRepository, catalogRatingProvider),
    getProductReviews: new GetProductReviewsUseCase(reviewRepository),
    listReviews: new ListReviewsUseCase(reviewRepository),
    adminReplyReview: new AdminReplyReviewUseCase(reviewRepository),
    toggleHelpfulVote: new ToggleHelpfulVoteUseCase(reviewRepository),
    getProductReviewStats: new GetProductReviewStatsUseCase(reviewRepository),
    deleteReview: new DeleteReviewUseCase(reviewRepository, catalogRatingProvider),
  };

  appContext = {
    logger,
    cache: redisClient,
    mongoose: mongooseInstance,
    auth,
    users,
    admin,
    authUserRepository,
    catalog,
    media,
    cart,
    leads,
    designProjects,
    orders,
    payments,
    notifications,
    cms,
    analytics,
    crm,
    reviews,
  };
  return appContext;
}

/** Test-only: clears the memoized graph so a fresh one can be built. */
export function resetAppContext(): void {
  appContext = undefined;
}
