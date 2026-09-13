import { ReviewRepository, IOrderProvider, ICatalogProvider, ReviewFilters } from './ports';
import { Review, ReviewStats, ReviewImage } from '../domain/reviews.types';
import { ValidationError, ConflictError, NotFoundError } from '../../../core/exceptions';

export type { ReviewImage };

export class SubmitReviewUseCase {
  constructor(
    private readonly reviewRepo: ReviewRepository,
    private readonly orderProvider: IOrderProvider
  ) {}

  async execute(input: {
    productId: string;
    userId: string;
    rating: number;
    title?: string | undefined;
    content: string;
    images?: ReviewImage[] | undefined;
  }): Promise<Review> {
    const { productId, userId, rating, title, content, images } = input;

    if (rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    // 1. Enforce one review per user per product
    const alreadyReviewed = await this.reviewRepo.hasUserReviewedProduct(userId, productId);
    if (alreadyReviewed) {
      throw new ConflictError('You have already submitted a review for this product');
    }

    // 2. Verified purchase verification
    const hasPurchased = await this.orderProvider.hasCompletedPurchase(userId, productId);
    if (!hasPurchased) {
      throw new ValidationError('Review submission is exclusive to customers with a verified completed purchase of this product');
    }

    const review: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      productId,
      userId,
      rating,
      title: title?.trim(),
      content: content.trim(),
      images: images || [],
      helpfulVotes: 0,
      helpfulVoters: [],
      status: 'PENDING',
      isVerifiedPurchase: true,
      isFeatured: false,
      isDeleted: false,
    };

    return this.reviewRepo.save(review);
  }
}

export class ModerateReviewUseCase {
  constructor(
    private readonly reviewRepo: ReviewRepository,
    private readonly catalogProvider: ICatalogProvider
  ) {}

  async execute(
    reviewId: string,
    status: 'APPROVED' | 'REJECTED',
    updatedBy: string,
    isFeatured?: boolean | undefined
  ): Promise<Review> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    const oldStatus = review.status;
    const updates: Partial<Review> = {
      status,
      updatedBy,
    };
    if (isFeatured !== undefined) {
      updates.isFeatured = isFeatured;
    }

    const updatedReview = await this.reviewRepo.update(reviewId, updates);
    if (!updatedReview) {
      throw new NotFoundError('Review not found for update');
    }

    // If status changed and involves APPROVED state, trigger ratings recalculation
    if (oldStatus !== status && (oldStatus === 'APPROVED' || status === 'APPROVED')) {
      await this.recalculateRatings(review.productId);
    }

    return updatedReview;
  }

  private async recalculateRatings(productId: string): Promise<void> {
    const reviews = await this.reviewRepo.findByProductId(productId);
    const approvedReviews = reviews.filter((r) => r.status === 'APPROVED');
    const ratingsCount = approvedReviews.length;

    let ratingsAvg = 0;
    if (ratingsCount > 0) {
      const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
      ratingsAvg = parseFloat((sum / ratingsCount).toFixed(2));
    }

    await this.catalogProvider.updateProductRating(productId, ratingsAvg, ratingsCount);
  }
}

export class AdminReplyReviewUseCase {
  constructor(private readonly reviewRepo: ReviewRepository) {}

  async execute(reviewId: string, message: string, repliedBy: string): Promise<Review> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    const updated = await this.reviewRepo.addAdminReply(reviewId, {
      message: message.trim(),
      repliedAt: new Date(),
      repliedBy,
    });

    if (!updated) {
      throw new NotFoundError('Failed to attach reply');
    }

    return updated;
  }
}

export class ToggleHelpfulVoteUseCase {
  constructor(private readonly reviewRepo: ReviewRepository) {}

  async execute(reviewId: string, userId: string): Promise<Review> {
    const updated = await this.reviewRepo.toggleHelpful(reviewId, userId);
    if (!updated) {
      throw new NotFoundError('Review not found');
    }
    return updated;
  }
}

export class GetProductReviewStatsUseCase {
  constructor(private readonly reviewRepo: ReviewRepository) {}

  async execute(productId: string): Promise<ReviewStats> {
    return this.reviewRepo.getReviewStats(productId);
  }
}

export class DeleteReviewUseCase {
  constructor(
    private readonly reviewRepo: ReviewRepository,
    private readonly catalogProvider: ICatalogProvider
  ) {}

  async execute(reviewId: string, deletedBy?: string): Promise<boolean> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) {
      throw new NotFoundError('Review not found');
    }

    const deleted = await this.reviewRepo.delete(reviewId, deletedBy);
    if (deleted && review.status === 'APPROVED') {
      const reviews = await this.reviewRepo.findByProductId(review.productId);
      const approvedReviews = reviews.filter((r) => r.status === 'APPROVED');
      const ratingsCount = approvedReviews.length;
      const ratingsAvg =
        ratingsCount > 0
          ? parseFloat((approvedReviews.reduce((acc, r) => acc + r.rating, 0) / ratingsCount).toFixed(2))
          : 0;

      await this.catalogProvider.updateProductRating(review.productId, ratingsAvg, ratingsCount);
    }

    return deleted;
  }
}

export class GetProductReviewsUseCase {
  constructor(private readonly reviewRepo: ReviewRepository) {}

  async execute(
    productId: string,
    filters?: {
      rating?: number | undefined;
      hasImages?: boolean | undefined;
      sortBy?: 'newest' | 'highest' | 'lowest' | 'helpful' | undefined;
    } | undefined,
    limit = 20,
    offset = 0
  ): Promise<{ reviews: Review[]; total: number }> {
    return this.reviewRepo.find(
      {
        productId,
        status: 'APPROVED',
        rating: filters?.rating,
        hasImages: filters?.hasImages,
        sortBy: filters?.sortBy,
      },
      limit,
      offset
    );
  }
}

export class ListReviewsUseCase {
  constructor(private readonly reviewRepo: ReviewRepository) {}

  async execute(
    filters: ReviewFilters,
    limit = 20,
    offset = 0
  ): Promise<{ reviews: Review[]; total: number }> {
    return this.reviewRepo.find(filters, limit, offset);
  }
}
