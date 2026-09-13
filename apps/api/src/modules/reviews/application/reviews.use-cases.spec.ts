import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest';
import {
  SubmitReviewUseCase,
  ModerateReviewUseCase,
  GetProductReviewsUseCase,
  ListReviewsUseCase,
  AdminReplyReviewUseCase,
  ToggleHelpfulVoteUseCase,
  GetProductReviewStatsUseCase,
  DeleteReviewUseCase,
} from './reviews.use-cases';
import { ReviewRepository, IOrderProvider, ICatalogProvider } from './ports';
import { Review, ReviewStats } from '../domain/reviews.types';
import { ValidationError, ConflictError, NotFoundError } from '../../../core/exceptions';

describe('Reviews Module - Application Use Cases', () => {
  let reviewRepo: Mocked<ReviewRepository>;
  let orderProvider: Mocked<IOrderProvider>;
  let catalogProvider: Mocked<ICatalogProvider>;

  beforeEach(() => {
    reviewRepo = {
      findById: vi.fn(),
      findByProductId: vi.fn(),
      find: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      hasUserReviewedProduct: vi.fn(),
      toggleHelpful: vi.fn(),
      addAdminReply: vi.fn(),
      getReviewStats: vi.fn(),
      delete: vi.fn(),
    };
    orderProvider = {
      hasCompletedPurchase: vi.fn(),
    };
    catalogProvider = {
      updateProductRating: vi.fn(),
    };
  });

  describe('SubmitReviewUseCase', () => {
    let useCase: SubmitReviewUseCase;

    beforeEach(() => {
      useCase = new SubmitReviewUseCase(reviewRepo, orderProvider);
    });

    it('should submit a review successfully if user has a completed purchase and has not reviewed yet', async () => {
      const input = {
        productId: 'product-1',
        userId: 'user-1',
        rating: 5,
        title: 'Exquisite Craftsmanship',
        content: 'Excellent product!',
        images: [{ url: 'https://example.com/photo.jpg', alt: 'Living room' }],
      };

      reviewRepo.hasUserReviewedProduct.mockResolvedValue(false);
      orderProvider.hasCompletedPurchase.mockResolvedValue(true);
      reviewRepo.save.mockResolvedValue({
        id: 'review-1',
        status: 'PENDING',
        isVerifiedPurchase: true,
        helpfulVotes: 0,
        helpfulVoters: [],
        isFeatured: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        ...input,
      });

      const result = await useCase.execute(input);

      expect(result.id).toBe('review-1');
      expect(result.isVerifiedPurchase).toBe(true);
      expect(result.title).toBe('Exquisite Craftsmanship');
      expect(reviewRepo.hasUserReviewedProduct).toHaveBeenCalledWith('user-1', 'product-1');
      expect(orderProvider.hasCompletedPurchase).toHaveBeenCalledWith('user-1', 'product-1');
      expect(reviewRepo.save).toHaveBeenCalled();
    });

    it('should throw ValidationError if rating is out of bounds', async () => {
      const input = {
        productId: 'product-1',
        userId: 'user-1',
        rating: 6,
        content: 'Too high!',
      };

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if user already reviewed this product', async () => {
      const input = {
        productId: 'product-1',
        userId: 'user-1',
        rating: 4,
        content: 'Another review',
      };

      reviewRepo.hasUserReviewedProduct.mockResolvedValue(true);

      await expect(useCase.execute(input)).rejects.toThrow(ConflictError);
    });

    it('should throw ValidationError if user has not completed a purchase for this product', async () => {
      const input = {
        productId: 'product-1',
        userId: 'user-1',
        rating: 4,
        content: 'No purchase',
      };

      reviewRepo.hasUserReviewedProduct.mockResolvedValue(false);
      orderProvider.hasCompletedPurchase.mockResolvedValue(false);

      await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
    });
  });

  describe('ModerateReviewUseCase', () => {
    let useCase: ModerateReviewUseCase;

    beforeEach(() => {
      useCase = new ModerateReviewUseCase(reviewRepo, catalogProvider);
    });

    it('should approve a review and trigger denormalized rating recalculation in catalog', async () => {
      const mockReview: Review = {
        id: 'review-1',
        productId: 'product-1',
        userId: 'user-1',
        rating: 5,
        content: 'Great!',
        status: 'PENDING',
        isVerifiedPurchase: true,
        helpfulVotes: 0,
        helpfulVoters: [],
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      reviewRepo.findById.mockResolvedValue(mockReview);
      reviewRepo.update.mockResolvedValue({ ...mockReview, status: 'APPROVED', isFeatured: true });
      reviewRepo.findByProductId.mockResolvedValue([
        { ...mockReview, status: 'APPROVED' },
      ]);

      const result = await useCase.execute('review-1', 'APPROVED', 'admin-1', true);

      expect(result.status).toBe('APPROVED');
      expect(reviewRepo.update).toHaveBeenCalledWith('review-1', { status: 'APPROVED', updatedBy: 'admin-1', isFeatured: true });
      expect(catalogProvider.updateProductRating).toHaveBeenCalledWith('product-1', 5, 1);
    });

    it('should correctly calculate ratings average and count on product with multiple approved reviews', async () => {
      const mockReview: Review = {
        id: 'review-1',
        productId: 'product-1',
        userId: 'user-1',
        rating: 5,
        content: 'Great!',
        status: 'PENDING',
        isVerifiedPurchase: true,
        helpfulVotes: 0,
        helpfulVoters: [],
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      reviewRepo.findById.mockResolvedValue(mockReview);
      reviewRepo.update.mockResolvedValue({ ...mockReview, status: 'APPROVED' });
      reviewRepo.findByProductId.mockResolvedValue([
        { id: 'r1', rating: 5, status: 'APPROVED' } as Review,
        { id: 'r2', rating: 4, status: 'APPROVED' } as Review,
        { id: 'r3', rating: 1, status: 'REJECTED' } as Review, // should be ignored
      ]);

      await useCase.execute('review-1', 'APPROVED', 'admin-1');

      expect(catalogProvider.updateProductRating).toHaveBeenCalledWith('product-1', 4.5, 2);
    });

    it('should throw NotFoundError if review does not exist', async () => {
      reviewRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute('non-existent', 'APPROVED', 'admin-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('AdminReplyReviewUseCase', () => {
    it('should attach an official brand response to a review', async () => {
      const useCase = new AdminReplyReviewUseCase(reviewRepo);
      const mockReview: Review = {
        id: 'review-1',
        productId: 'product-1',
        userId: 'user-1',
        rating: 5,
        content: 'Love it!',
        status: 'APPROVED',
        isVerifiedPurchase: true,
        helpfulVotes: 0,
        helpfulVoters: [],
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      reviewRepo.findById.mockResolvedValue(mockReview);
      reviewRepo.addAdminReply.mockResolvedValue({
        ...mockReview,
        adminReply: {
          message: 'Thank you for choosing National Furniture & Interiors!',
          repliedAt: new Date(),
          repliedBy: 'admin-1',
        },
      });

      const result = await useCase.execute('review-1', 'Thank you for choosing National Furniture & Interiors!', 'admin-1');

      expect(result.adminReply?.message).toContain('National Furniture');
      expect(reviewRepo.addAdminReply).toHaveBeenCalled();
    });
  });

  describe('ToggleHelpfulVoteUseCase', () => {
    it('should toggle helpful vote on a review', async () => {
      const useCase = new ToggleHelpfulVoteUseCase(reviewRepo);
      const mockReview: Review = {
        id: 'review-1',
        productId: 'product-1',
        userId: 'user-1',
        rating: 5,
        content: 'Great info',
        status: 'APPROVED',
        isVerifiedPurchase: true,
        helpfulVotes: 1,
        helpfulVoters: ['user-2'],
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      reviewRepo.toggleHelpful.mockResolvedValue(mockReview);

      const result = await useCase.execute('review-1', 'user-2');

      expect(result.helpfulVotes).toBe(1);
      expect(reviewRepo.toggleHelpful).toHaveBeenCalledWith('review-1', 'user-2');
    });
  });

  describe('GetProductReviewStatsUseCase', () => {
    it('should return statistical aggregates for a product', async () => {
      const useCase = new GetProductReviewStatsUseCase(reviewRepo);
      const mockStats: ReviewStats = {
        totalReviews: 10,
        averageRating: 4.8,
        recommendPercentage: 95,
        distribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 8 },
        totalPhotosCount: 4,
      };

      reviewRepo.getReviewStats.mockResolvedValue(mockStats);

      const result = await useCase.execute('product-1');

      expect(result.averageRating).toBe(4.8);
      expect(result.recommendPercentage).toBe(95);
      expect(reviewRepo.getReviewStats).toHaveBeenCalledWith('product-1');
    });
  });

  describe('DeleteReviewUseCase', () => {
    it('should soft delete a review and recalculate ratings if it was approved', async () => {
      const useCase = new DeleteReviewUseCase(reviewRepo, catalogProvider);
      const mockReview: Review = {
        id: 'review-1',
        productId: 'product-1',
        userId: 'user-1',
        rating: 5,
        content: 'Goodbye review',
        status: 'APPROVED',
        isVerifiedPurchase: true,
        helpfulVotes: 0,
        helpfulVoters: [],
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        version: 1,
      };

      reviewRepo.findById.mockResolvedValue(mockReview);
      reviewRepo.delete.mockResolvedValue(true);
      reviewRepo.findByProductId.mockResolvedValue([]);

      const result = await useCase.execute('review-1', 'admin-1');

      expect(result).toBe(true);
      expect(reviewRepo.delete).toHaveBeenCalledWith('review-1', 'admin-1');
      expect(catalogProvider.updateProductRating).toHaveBeenCalledWith('product-1', 0, 0);
    });
  });

  describe('GetProductReviewsUseCase', () => {
    it('should return only approved reviews for a product with pagination', async () => {
      const useCase = new GetProductReviewsUseCase(reviewRepo);
      reviewRepo.find.mockResolvedValue({
        reviews: [
          { id: 'r1', status: 'APPROVED' } as Review,
          { id: 'r3', status: 'APPROVED' } as Review,
        ],
        total: 2,
      });

      const result = await useCase.execute('product-1', { sortBy: 'newest' });

      expect(result.reviews).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(reviewRepo.find).toHaveBeenCalledWith(
        { productId: 'product-1', status: 'APPROVED', rating: undefined, hasImages: undefined, sortBy: 'newest' },
        20,
        0
      );
    });
  });

  describe('ListReviewsUseCase', () => {
    it('should list reviews based on filters', async () => {
      const useCase = new ListReviewsUseCase(reviewRepo);
      const expectedResult = {
        reviews: [{ id: 'r1' } as Review],
        total: 1,
      };
      reviewRepo.find.mockResolvedValue(expectedResult);

      const result = await useCase.execute({ status: 'PENDING' }, 10, 0);

      expect(result).toEqual(expectedResult);
      expect(reviewRepo.find).toHaveBeenCalledWith({ status: 'PENDING' }, 10, 0);
    });
  });
});
