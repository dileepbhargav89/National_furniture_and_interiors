import type { NextFunction, Request, Response } from 'express';
import {
  SubmitReviewUseCase,
  ModerateReviewUseCase,
  GetProductReviewsUseCase,
  ListReviewsUseCase,
  AdminReplyReviewUseCase,
  ToggleHelpfulVoteUseCase,
  GetProductReviewStatsUseCase,
  DeleteReviewUseCase,
  type ReviewImage,
} from '../../application/reviews.use-cases';
import { submitReviewSchema, moderateReviewSchema, adminReplySchema } from '../dto/reviews.dto';
import { UnauthorizedError } from '../../../../core/exceptions';
import { ReviewFilters, type ReviewStatus } from '../../application/ports';

type AuthRequest = Request & { user?: { id: string }; auth?: { sub?: string } };

export class ReviewsController {
  constructor(
    private readonly submitReviewUseCase: SubmitReviewUseCase,
    private readonly moderateReviewUseCase: ModerateReviewUseCase,
    private readonly getProductReviewsUseCase: GetProductReviewsUseCase,
    private readonly listReviewsUseCase: ListReviewsUseCase,
    private readonly adminReplyReviewUseCase: AdminReplyReviewUseCase,
    private readonly toggleHelpfulVoteUseCase: ToggleHelpfulVoteUseCase,
    private readonly getProductReviewStatsUseCase: GetProductReviewStatsUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase
  ) {}

  submitReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || req.auth?.sub;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const productId = req.params.productId as string;
      const parsedBody = submitReviewSchema.parse(req.body);

      // Normalize images
      const normalizedImages: ReviewImage[] = (parsedBody.images || []).map((img) => ({
        url: typeof img === 'string' ? img : img.url,
        alt: typeof img === 'object' && img.alt ? img.alt : undefined,
      }));

      const review = await this.submitReviewUseCase.execute({
        productId,
        userId,
        rating: parsedBody.rating,
        title: parsedBody.title || undefined,
        content: parsedBody.content || parsedBody.comment || '',
        images: normalizedImages,
      });

      res.status(201).json({ success: true, status: 'success', data: review });
    } catch (error) {
      next(error);
    }
  };

  moderateReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || req.auth?.sub;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const reviewId = req.params.id as string;
      const parsedBody = moderateReviewSchema.parse(req.body);

      const review = await this.moderateReviewUseCase.execute(
        reviewId,
        parsedBody.status,
        userId,
        parsedBody.isFeatured
      );

      res.status(200).json({ success: true, status: 'success', data: review });
    } catch (error) {
      next(error);
    }
  };

  adminReply = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const reviewId = req.params.id as string;
      const parsedBody = adminReplySchema.parse(req.body);

      const review = await this.adminReplyReviewUseCase.execute(
        reviewId,
        parsedBody.message,
        userId
      );

      res.status(200).json({ success: true, status: 'success', data: review });
    } catch (error) {
      next(error);
    }
  };

  toggleHelpful = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const reviewId = req.params.id as string;
      // Fallback to client IP if unauthenticated
      const voterId = req.user?.id || req.ip || 'anonymous-voter';

      const review = await this.toggleHelpfulVoteUseCase.execute(reviewId, voterId);
      res.status(200).json({ success: true, status: 'success', data: review });
    } catch (error) {
      next(error);
    }
  };

  getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.productId as string;
      const rating = req.query.rating ? parseInt(req.query.rating as string, 10) : undefined;
      const hasImages = req.query.hasImages === 'true' ? true : undefined;
      const sortBy = (req.query.sort as 'newest' | 'highest' | 'lowest' | 'helpful') || undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await this.getProductReviewsUseCase.execute(
        productId,
        {
          rating,
          hasImages,
          sortBy,
        },
        limit,
        offset
      );

      res.status(200).json({
        success: true,
        status: 'success',
        data: {
          items: result.reviews,
          total: result.total,
          limit,
          offset,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getProductReviewStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.productId as string;
      const stats = await this.getProductReviewStatsUseCase.execute(productId);
      res.status(200).json({ success: true, status: 'success', data: stats });
    } catch (error) {
      next(error);
    }
  };

  listReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as ReviewStatus | undefined;
      const productId = req.query.productId as string | undefined;
      const rating = req.query.rating ? parseInt(req.query.rating as string, 10) : undefined;
      const isFeatured = req.query.isFeatured !== undefined ? req.query.isFeatured === 'true' : undefined;
      const hasImages = req.query.hasImages === 'true';
      const search = req.query.search as string | undefined;
      const sortBy = req.query.sortBy as 'newest' | 'highest' | 'lowest' | 'helpful' | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const filters: ReviewFilters = {};
      if (status) filters.status = status;
      if (productId) filters.productId = productId;
      if (rating) filters.rating = rating;
      if (isFeatured !== undefined) filters.isFeatured = isFeatured;
      if (hasImages) filters.hasImages = hasImages;
      if (search) filters.search = search;
      if (sortBy) filters.sortBy = sortBy;

      const result = await this.listReviewsUseCase.execute(filters, limit, offset);

      res.status(200).json({
        success: true,
        status: 'success',
        data: {
          items: result.reviews,
          total: result.total,
          limit,
          offset,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const reviewId = req.params.id as string;
      await this.deleteReviewUseCase.execute(reviewId, userId);

      res.status(200).json({ success: true, status: 'success', data: { message: 'Review deleted successfully' } });
    } catch (error) {
      next(error);
    }
  };
}
