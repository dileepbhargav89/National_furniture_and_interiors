import { apiClient } from './client';

export interface MaterialSpec {
  category: string;
  detail: string;
}

export interface ClientTestimonial {
  clientName: string;
  society: string;
  quote: string;
  rating: number;
}

export type PortfolioSector = 'residential' | 'commercial';

export type PortfolioCategory =
  | '3bhk-4bhk'
  | '2bhk'
  | 'villa'
  | 'kitchen'
  | 'penthouse'
  | 'office'
  | 'restaurant'
  | 'hotel'
  | 'retail';

export interface PortfolioProject {
  _id?: string | undefined;
  id?: string | undefined;
  slug: string;
  title: string;
  subtitle: string;
  community: string;
  locality: string;
  city: string;
  sector: PortfolioSector;
  category: PortfolioCategory;
  categoryLabel: string;
  areaSqFt: number;
  budgetInLakhs: number;
  budgetString: string;
  turnaroundDays: number;
  style: string;
  coverImage: string;
  galleryImages: string[];
  scope: string[];
  materials: MaterialSpec[];
  designerNotes: string;
  clientTestimonial?: ClientTestimonial | undefined;
  isPublished: boolean;
  displayOrder: number;
  isFeatured: boolean;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface ListPortfolioParams {
  sector?: PortfolioSector | undefined;
  category?: PortfolioCategory | undefined;
  isFeatured?: boolean | undefined;
}

export interface AdminListPortfolioParams {
  limit?: number | undefined;
  offset?: number | undefined;
  sector?: PortfolioSector | undefined;
}

export const PortfolioService = {
  list: async (params?: ListPortfolioParams) => {
    const queryParams: Record<string, string> = {};
    if (params) {
      if (params.sector) queryParams.sector = params.sector;
      if (params.category) queryParams.category = params.category;
      if (params.isFeatured !== undefined) queryParams.isFeatured = String(params.isFeatured);
    }
    return apiClient.get<{ items: PortfolioProject[]; total: number }>(
      '/api/v1/design-projects/portfolio',
      { params: queryParams }
    );
  },

  getBySlug: async (slug: string) => {
    return apiClient.get<PortfolioProject>(`/api/v1/design-projects/portfolio/${slug}`);
  },

  adminList: async (params?: AdminListPortfolioParams) => {
    const queryParams: Record<string, string> = {};
    if (params) {
      if (params.limit !== undefined) queryParams.limit = String(params.limit);
      if (params.offset !== undefined) queryParams.offset = String(params.offset);
      if (params.sector) queryParams.sector = params.sector;
    }
    return apiClient.get<{ items: PortfolioProject[]; total: number }>(
      '/api/v1/design-projects/admin/portfolio',
      { params: queryParams }
    );
  },

  adminCreate: async (data: Partial<PortfolioProject>) => {
    return apiClient.post<PortfolioProject>('/api/v1/design-projects/admin/portfolio', data);
  },

  adminUpdate: async (id: string, data: Partial<PortfolioProject>) => {
    return apiClient.put<PortfolioProject>(`/api/v1/design-projects/admin/portfolio/${id}`, data);
  },

  adminDelete: async (id: string) => {
    return apiClient.delete<{ success: boolean }>(`/api/v1/design-projects/admin/portfolio/${id}`);
  },

  adminSeed: async () => {
    return apiClient.post<{ seeded: number; message: string }>('/api/v1/design-projects/admin/portfolio/seed');
  },
};
