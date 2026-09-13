export enum BlogStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum TestimonialSource {
  WEBSITE = 'WEBSITE',
  GOOGLE = 'GOOGLE',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
}

export enum BannerPlacement {
  HOMEPAGE_HERO = 'HOMEPAGE_HERO',
  CATEGORY_TOP = 'CATEGORY_TOP',
  PROMO_STRIP = 'PROMO_STRIP',
  COLLECTION_FEATURE = 'COLLECTION_FEATURE',
}

export enum ConsentChannel {
  EMAIL = 'EMAIL',
}

export interface SEOMeta {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface IBanner {
  id: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  ctaText?: string;
  linkUrl?: string;
  secondaryCtaText?: string;
  secondaryLinkUrl?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  placement: BannerPlacement;
  targetCategory?: string;
  discountCode?: string;
  sortOrder: number;
  startDate?: Date | string;
  endDate?: Date | string;
  isActive: boolean;
  impressionCount: number;
  clickCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IBlogRepository {
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  findById(id: string): Promise<any>;
  findBySlug(slug: string): Promise<any>;
  findAll(limit: number, offset: number, filter?: any): Promise<{ items: any[]; total: number }>;
}

export interface IBannerRepository {
  create(data: Partial<IBanner>): Promise<any>;
  update(id: string, data: Partial<IBanner>): Promise<any>;
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<any>;
  findAll(placement?: BannerPlacement, category?: string): Promise<any[]>;
  findAllAdmin(filter?: any): Promise<any[]>;
  recordClick(id: string): Promise<any>;
  recordImpression(id: string): Promise<any>;
}

export interface ITestimonialRepository {
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  findAll(limit: number, offset: number, filter?: any): Promise<{ items: any[]; total: number }>;
}

export interface INewsletterRepository {
  subscribe(email: string, source?: string): Promise<any>;
  unsubscribe(email: string): Promise<void>;
  findAll(limit: number, offset: number): Promise<{ items: any[]; total: number }>;
}
