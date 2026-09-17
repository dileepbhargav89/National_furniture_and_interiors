import { AuthService } from './auth';
import { CatalogService } from './catalog';
import { CartService } from './cart';
import { LeadService } from './leads';
import { DesignProjectService } from './design-projects';
import { OrdersService } from './orders';
import { PaymentsService } from './payments';
import { NotificationsService } from './notifications';
import { CmsService } from './cms';
import { UsersService } from './users';
import { AdminService } from './admin';
import { MediaService } from './media';
import { CrmService } from './crm';
import { AnalyticsService } from './analytics';
import { ReviewsService } from './reviews';
import { PortfolioService } from './portfolio';
import { OnboardingService } from './onboarding';
import { ApiClient, apiClient, ApiError } from './client';
export type { ApiResponse } from '@nfi/shared';

export * from './auth';
export * from './catalog';
export * from './cart';
export * from './leads';
export * from './design-projects';
export * from './portfolio';
export * from './orders';
export * from './payments';
export * from './notifications';
export * from './cms';
export * from './users';
export * from './admin';
export * from './media';
export * from './crm';
export * from './analytics';
export * from './reviews';
export * from './onboarding';
export * from './client';
export { ApiClient, apiClient, ApiError };

export class NFIApiClient {
  public auth: typeof AuthService;
  public catalog: typeof CatalogService;
  public cart: typeof CartService;
  public leads: typeof LeadService;
  public designProjects: typeof DesignProjectService;
  public orders: typeof OrdersService;
  public payments: typeof PaymentsService;
  public notifications: typeof NotificationsService;
  public cms: typeof CmsService;
  public users: typeof UsersService;
  public admin: typeof AdminService;
  public media: typeof MediaService;
  public crm: typeof CrmService;
  public analytics: typeof AnalyticsService;
  public reviews: typeof ReviewsService;
  public portfolio: typeof PortfolioService;
  public onboarding: typeof OnboardingService;

  constructor() {
    this.auth = AuthService;
    this.catalog = CatalogService;
    this.cart = CartService;
    this.leads = LeadService;
    this.designProjects = DesignProjectService;
    this.portfolio = PortfolioService;
    this.orders = OrdersService;
    this.payments = PaymentsService;
    this.notifications = NotificationsService;
    this.cms = CmsService;
    this.users = UsersService;
    this.admin = AdminService;
    this.media = MediaService;
    this.crm = CrmService;
    this.analytics = AnalyticsService;
    this.reviews = ReviewsService;
    this.onboarding = OnboardingService;
  }
}
