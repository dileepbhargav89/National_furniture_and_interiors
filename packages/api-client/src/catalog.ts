import { apiClient } from './client';

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface MoneyAmount {
  amount: number;
  currency: string;
}

export interface ImageSubdoc {
  url: string;
  publicId: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  variantId: string;
  sku: string;
  attributes: { name: string; value: string }[];
  priceOverride: MoneyAmount | null;
  images: ImageSubdoc[];
  dimensionsOverride?: { length: number; width: number; height: number; unit: string };
  weightOverride?: number;
  isActive: boolean;
}

export interface Product {
  _id?: string;
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand?: string;
  categoryId: string;
  categoryIds: string[];
  description: string;
  shortDescription?: string;
  mrp?: MoneyAmount;
  taxRate?: number;
  taxIncluded?: boolean;
  productType?: 'READY_TO_SHIP' | 'MADE_TO_ORDER';
  specifications?: Record<string, unknown>;
  material?: string;
  primaryMaterial?: string;
  frameMaterial?: string;
  finishes?: string[];
  colors?: string[];
  careInstructions?: string;
  warranty?: {
    durationMonths?: number;
    terms?: string;
    summary?: string;
    periodMonths?: number;
    policyDocumentUrl?: string;
  };
  dimensions?: { length: number; width: number; height: number; unit: string };
  weight?: number;
  images: ImageSubdoc[];
  videos: { url: string; publicId: string; title?: string }[];
  variants: ProductVariant[];
  basePrice: MoneyAmount;
  ratingsAvg?: number;
  ratingsCount?: number;
  tags: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  status: ProductStatus;
  seo?: { title?: string; description?: string; keywords?: string };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id?: string;
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId: string | null;
  ancestors: string[];
  level: number;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  seo?: { title?: string; description?: string; keywords?: string };
  createdAt: string;
  updatedAt: string;
}

export interface ProductCollection {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  heroImage?: ImageSubdoc;
  heroVideo?: string;
  thumbnailImage?: ImageSubdoc;
  galleryImages: ImageSubdoc[];
  galleryVideos: string[];
  productIds: string[];
  rules?: Record<string, unknown>;
  startDate?: string;
  endDate?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featured: boolean;
  sortOrder: number;
  seo?: { title?: string; description?: string; keywords?: string };
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const CatalogService = {
  // Public
  listCategories: async () => {
    return apiClient.get<{ items: Category[] }>('/api/v1/categories');
  },

  getCategory: async (slug: string) => {
    return apiClient.get<{ category: Category }>(`/api/v1/categories/${slug}`);
  },
  
  listProducts: async (params?: Record<string, unknown>) => {
    return apiClient.get<{ items: Product[]; total: number }>('/api/v1/products', { ...(params ? { params: params as Record<string, unknown> } : {}) });
  },

  getProduct: async (id: string) => {
    return apiClient.get<{ product: Product }>(`/api/v1/products/${id}`);
  },

  // Admin
  adminListProducts: async (params?: Record<string, unknown>) => {
    return apiClient.get<{ items: Product[]; total: number }>('/api/v1/admin/products', { ...(params ? { params: params as Record<string, unknown> } : {}) });
  },

  adminCreateProduct: async (data: unknown) => {
    return apiClient.post<{ product: Product }>('/api/v1/admin/products', data);
  },

  adminUpdateProduct: async (id: string, data: unknown) => {
    return apiClient.patch<{ product: Product }>(`/api/v1/admin/products/${id}`, data);
  },

  adminArchiveProduct: async (id: string) => {
    return apiClient.delete(`/api/v1/admin/products/${id}`);
  },

  adminCreateCategory: async (data: unknown) => {
    return apiClient.post<{ category: Category }>('/api/v1/admin/categories', data);
  },

  adminUpdateCategory: async (id: string, data: unknown) => {
    return apiClient.patch<{ category: Category }>(`/api/v1/admin/categories/${id}`, data);
  },

  adminGetCategory: async (id: string) => {
    return apiClient.get<{ category: Category }>(`/api/v1/admin/categories/${id}`);
  },

  adminDeleteCategory: async (id: string) => {
    return apiClient.delete(`/api/v1/admin/categories/${id}`);
  },

  adminAdjustInventory: async (data: { productId: string; variantId: string; quantityDelta: number; note?: string }) => {
    return apiClient.post('/api/v1/admin/inventory/adjust', data);
  },

  // Collections
  listCollections: async () => {
    return apiClient.get<ProductCollection[]>('/api/v1/collections');
  },

  getCollection: async (slug: string) => {
    return apiClient.get<ProductCollection>(`/api/v1/collections/${slug}`);
  },

  adminListCollections: async () => {
    return apiClient.get<ProductCollection[]>('/api/v1/admin/collections');
  },

  adminGetCollection: async (id: string) => {
    return apiClient.get<ProductCollection>(`/api/v1/admin/collections/${id}`);
  },

  adminCreateCollection: async (data: unknown) => {
    return apiClient.post<ProductCollection>('/api/v1/admin/collections', data);
  },

  adminUpdateCollection: async (id: string, data: unknown) => {
    return apiClient.patch<ProductCollection>(`/api/v1/admin/collections/${id}`, data);
  },

  adminDeleteCollection: async (id: string) => {
    return apiClient.delete(`/api/v1/admin/collections/${id}`);
  },
};
