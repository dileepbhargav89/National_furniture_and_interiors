import { Review, ReviewStatus, ReviewStats, ReviewAdminReply } from '../domain/reviews.types';

export type { ReviewStatus, Review, ReviewStats, ReviewAdminReply };

export interface ReviewFilters {
  status?: ReviewStatus | undefined;
  productId?: string | undefined;
  rating?: number | undefined;
  isFeatured?: boolean | undefined;
  hasImages?: boolean | undefined;
  search?: string | undefined;
  sortBy?: 'newest' | 'highest' | 'lowest' | 'helpful' | undefined;
}

export interface ReviewRepository {
  findById(id: string): Promise<Review | null>;
  findByProductId(productId: string): Promise<Review[]>;
  find(
    filters: ReviewFilters,
    limit?: number,
    offset?: number
  ): Promise<{ reviews: Review[]; total: number }>;
  save(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Review>;
  update(id: string, updates: Partial<Review>): Promise<Review | null>;
  hasUserReviewedProduct(userId: string, productId: string): Promise<boolean>;
  toggleHelpful(reviewId: string, userId: string): Promise<Review | null>;
  addAdminReply(reviewId: string, reply: ReviewAdminReply): Promise<Review | null>;
  getReviewStats(productId: string): Promise<ReviewStats>;
  delete(id: string, deletedBy?: string): Promise<boolean>;
}

export interface IOrderProvider {
  hasCompletedPurchase(userId: string, productId: string): Promise<boolean>;
}

export interface ICatalogProvider {
  updateProductRating(productId: string, ratingsAvg: number, ratingsCount: number): Promise<void>;
}
