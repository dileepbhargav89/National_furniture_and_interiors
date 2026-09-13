import { apiClient } from './client';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ReviewImage {
  url: string;
  alt?: string;
}

export interface ReviewAdminReply {
  message: string;
  repliedAt: string | Date;
  repliedBy?: string;
}

export interface Review {
  id: string;
  _id?: string | undefined;
  productId: string;
  userId?: string | undefined;
  customerId?: string | undefined; // backwards compatibility alias
  userName?: string | undefined;
  customerName?: string | undefined; // backwards compatibility alias
  userAvatar?: string | undefined;
  rating: number; // 1-5
  title?: string | undefined;
  content: string;
  comment?: string | undefined; // backwards compatibility alias
  images?: ReviewImage[] | undefined;
  helpfulVotes: number;
  helpfulVoters?: string[] | undefined;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  isFeatured: boolean;
  adminReply?: ReviewAdminReply | undefined;
  productName?: string | undefined;
  productSku?: string | undefined;
  productImage?: string | undefined;
  metadata?: {
    verifiedPurchase?: boolean | undefined;
    orderId?: string | undefined;
  } | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recommendPercentage: number;
  totalPhotosCount: number;
}

export interface ReviewListParams {
  limit?: number | undefined;
  offset?: number | undefined;
  status?: string | undefined;
  productId?: string | undefined;
  rating?: number | undefined;
  isFeatured?: boolean | undefined;
  hasImages?: boolean | undefined;
  search?: string | undefined;
  sortBy?: 'newest' | 'highest' | 'lowest' | 'helpful' | undefined;
}

export interface SubmitReviewPayload {
  rating: number;
  title?: string | undefined;
  content?: string | undefined;
  comment?: string | undefined;
  images?: Array<ReviewImage | string> | undefined;
  orderId?: string | undefined;
}

export const ReviewsService = {
  getProductReviews: (
    productId: string,
    params?: {
      limit?: number | undefined;
      offset?: number | undefined;
      rating?: number | undefined;
      hasImages?: boolean | undefined;
      sortBy?: 'newest' | 'highest' | 'lowest' | 'helpful' | undefined;
    } | undefined
  ) =>
    apiClient.get<{ items: Review[]; total: number }>(
      `/api/v1/products/${productId}/reviews`,
      params ? { params: params as Record<string, string | number | boolean | undefined | null> } : undefined
    ),

  getProductReviewStats: (productId: string) =>
    apiClient.get<ReviewStats>(`/api/v1/products/${productId}/reviews/stats`),

  toggleHelpful: (productId: string, reviewId: string) =>
    apiClient.post<Review>(`/api/v1/products/${productId}/reviews/${reviewId}/helpful`),

  submitReview: (productId: string, data: SubmitReviewPayload) =>
    apiClient.post<Review>(`/api/v1/products/${productId}/reviews`, data),

  listReviews: (params?: ReviewListParams) =>
    apiClient.get<{ items: Review[]; total: number }>(
      '/api/v1/admin/reviews',
      params ? { params: params as Record<string, string | number | boolean | undefined | null> } : undefined
    ),

  moderateReview: (
    id: string,
    data: { status: 'APPROVED' | 'REJECTED'; isFeatured?: boolean }
  ) => apiClient.patch<Review>(`/api/v1/admin/reviews/${id}/moderate`, data),

  replyToReview: (id: string, data: { message: string }) =>
    apiClient.post<Review>(`/api/v1/admin/reviews/${id}/reply`, data),

  deleteReview: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/api/v1/admin/reviews/${id}`),
};
