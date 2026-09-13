
import { PagedResponse } from './types';

export enum BlogStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum BannerPlacement {
  HOMEPAGE_HERO = 'HOMEPAGE_HERO',
  CATEGORY_TOP = 'CATEGORY_TOP',
  PROMO_STRIP = 'PROMO_STRIP',
  COLLECTION_FEATURE = 'COLLECTION_FEATURE',
}

export enum TestimonialSource {
  WEBSITE = 'WEBSITE',
  GOOGLE = 'GOOGLE',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
}

export interface SEOMeta {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  authorId: string;
  categoryTags: string[];
  seo?: SEOMeta;
  status: BlogStatus;
  publishedAt?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  ctaText?: string;
  secondaryCtaText?: string;
  secondaryLinkUrl?: string;
  placement: BannerPlacement;
  targetCategory?: string;
  discountCode?: string;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  impressionCount: number;
  clickCount: number;
  ctr?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerInput {
  title: string;
  subtitle?: string;
  badgeText?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  ctaText?: string;
  secondaryCtaText?: string;
  secondaryLinkUrl?: string;
  placement: BannerPlacement | string;
  targetCategory?: string;
  discountCode?: string;
  sortOrder?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export type UpdateBannerInput = Partial<CreateBannerInput>;

export interface Testimonial {
  id: string;
  customerId?: string;
  customerName: string;
  rating: number;
  content: string;
  projectType?: string;
  mediaUrls: { url: string; type: 'IMAGE' | 'VIDEO' }[];
  isApproved: boolean;
  isFeatured: boolean;
  source: TestimonialSource;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  isActive: boolean;
  unsubscribedAt?: string;
  consentChannel: 'EMAIL';
  source?: string;
  createdAt: string;
  updatedAt: string;
}

import { apiClient } from './client';

export const CmsService = {
  // --- Blogs ---
  getBlogs: async (params?: { limit?: number; offset?: number; status?: BlogStatus }) => {
    return apiClient.get<PagedResponse<Blog>>('/api/v1/cms/blogs', params ? { params: params as Record<string, unknown> } : undefined);
  },

  getBlogBySlug: async (slug: string) => {
    return apiClient.get<Blog>(`/api/v1/cms/blogs/${slug}`);
  },

  createBlog: async (data: Partial<Blog>) => {
    return apiClient.post<Blog>('/api/v1/admin/cms/blogs', data);
  },

  updateBlog: async (id: string, data: Partial<Blog>) => {
    return apiClient.put<Blog>(`/api/v1/admin/cms/blogs/${id}`, data);
  },

  // --- Banners ---
  getBanners: async (params?: { placement?: BannerPlacement | string; targetCategory?: string }) => {
    return apiClient.get<Banner[]>('/api/v1/cms/banners', params ? { params: params as Record<string, unknown> } : undefined);
  },

  trackBannerClick: async (id: string) => {
    return apiClient.post<{ success: boolean; clickCount: number }>(`/api/v1/cms/banners/${id}/click`);
  },

  trackBannerImpression: async (id: string) => {
    return apiClient.post<{ success: boolean; impressionCount: number }>(`/api/v1/cms/banners/${id}/impression`);
  },

  adminGetBanners: async (params?: { placement?: BannerPlacement | string; isActive?: boolean }) => {
    return apiClient.get<Banner[]>('/api/v1/admin/cms/banners', params ? { params: params as Record<string, unknown> } : undefined);
  },

  adminGetBannerById: async (id: string) => {
    return apiClient.get<Banner>(`/api/v1/admin/cms/banners/${id}`);
  },

  createBanner: async (data: CreateBannerInput) => {
    return apiClient.post<Banner>('/api/v1/admin/cms/banners', data);
  },

  updateBanner: async (id: string, data: UpdateBannerInput) => {
    return apiClient.put<Banner>(`/api/v1/admin/cms/banners/${id}`, data);
  },

  toggleBannerStatus: async (id: string, isActive: boolean) => {
    return apiClient.patch<Banner>(`/api/v1/admin/cms/banners/${id}/status`, { isActive });
  },

  deleteBanner: async (id: string) => {
    return apiClient.delete<{ message: string }>(`/api/v1/admin/cms/banners/${id}`);
  },

  // --- Testimonials ---
  getTestimonials: async (params?: { limit?: number; offset?: number; isApproved?: boolean; isFeatured?: boolean }) => {
    return apiClient.get<PagedResponse<Testimonial>>('/api/v1/cms/testimonials', params ? { params: params as Record<string, unknown> } : undefined);
  },

  createTestimonial: async (data: Partial<Testimonial>) => {
    return apiClient.post<Testimonial>('/api/v1/cms/testimonials', data); // Public route
  },

  // --- Newsletter ---
  subscribeNewsletter: async (email: string, source?: string) => {
    return apiClient.post<NewsletterSubscriber>('/api/v1/cms/newsletter', { email, source });
  },

  getNewsletterSubscribers: async (params?: { limit?: number; offset?: number }) => {
    return apiClient.get<PagedResponse<NewsletterSubscriber>>('/api/v1/admin/cms/newsletter', params ? { params: params as Record<string, unknown> } : undefined);
  }
};
