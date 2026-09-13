import { Types } from 'mongoose';
import { ReviewRepository, ReviewFilters } from '../application/ports';
import { Review, ReviewStatus, ReviewStats, ReviewAdminReply } from '../domain/reviews.types';
import { ReviewModel } from './reviews.schemas';

export class MongoReviewRepository implements ReviewRepository {
  private mapToDomain(doc: any): Review {
    const user = doc.userId && typeof doc.userId === 'object' ? doc.userId : null;
    const product = doc.productId && typeof doc.productId === 'object' ? doc.productId : null;

    return {
      id: doc._id.toString(),
      productId: product ? product._id.toString() : doc.productId?.toString(),
      userId: user ? user._id.toString() : doc.userId?.toString(),
      rating: doc.rating,
      title: doc.title || '',
      content: doc.content,
      images: doc.images || [],
      helpfulVotes: doc.helpfulVotes || 0,
      helpfulVoters: (doc.helpfulVoters || []).map((v: any) => v.toString()),
      status: doc.status as ReviewStatus,
      isVerifiedPurchase: Boolean(doc.isVerifiedPurchase),
      isFeatured: Boolean(doc.isFeatured),
      adminReply: doc.adminReply ? {
        message: doc.adminReply.message,
        repliedAt: doc.adminReply.repliedAt,
        repliedBy: doc.adminReply.repliedBy,
      } : undefined,

      // Populated fields
      userName: user?.fullName || 'Verified Customer',
      userAvatar: user?.avatarUrl || undefined,
      productName: product?.name || undefined,
      productSku: product?.sku || undefined,
      productImage: product?.images?.[0]?.url || undefined,

      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      ...(doc.createdBy ? { createdBy: doc.createdBy } : {}),
      ...(doc.updatedBy ? { updatedBy: doc.updatedBy } : {}),
      isDeleted: Boolean(doc.isDeleted),
      ...(doc.deletedAt ? { deletedAt: doc.deletedAt } : {}),
      ...(doc.deletedBy ? { deletedBy: doc.deletedBy } : {}),
      version: doc.version || 0,
    };
  }

  async findById(id: string): Promise<Review | null> {
    const doc = await ReviewModel.findOne({ _id: id, isDeleted: false })
      .populate('userId', 'fullName avatarUrl email')
      .populate('productId', 'name sku images');
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByProductId(productId: string): Promise<Review[]> {
    const docs = await ReviewModel.find({
      productId: new Types.ObjectId(productId),
      isDeleted: false,
    })
      .populate('userId', 'fullName avatarUrl email')
      .sort({ createdAt: -1 });

    return docs.map((doc: any) => this.mapToDomain(doc));
  }

  async find(
    filters: ReviewFilters,
    limit = 20,
    offset = 0
  ): Promise<{ reviews: Review[]; total: number }> {
    const query: Record<string, any> = { isDeleted: false };

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.productId) {
      query.productId = new Types.ObjectId(filters.productId);
    }
    if (filters.rating) {
      query.rating = filters.rating;
    }
    if (filters.isFeatured !== undefined) {
      query.isFeatured = filters.isFeatured;
    }
    if (filters.hasImages) {
      query['images.0'] = { $exists: true };
    }
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { content: { $regex: filters.search, $options: 'i' } },
      ];
    }

    let sort: Record<string, any> = { createdAt: -1 };
    if (filters.sortBy === 'highest') {
      sort = { rating: -1, createdAt: -1 };
    } else if (filters.sortBy === 'lowest') {
      sort = { rating: 1, createdAt: -1 };
    } else if (filters.sortBy === 'helpful') {
      sort = { helpfulVotes: -1, createdAt: -1 };
    }

    const [docs, total] = await Promise.all([
      ReviewModel.find(query)
        .populate('userId', 'fullName avatarUrl email')
        .populate('productId', 'name sku images')
        .sort(sort)
        .skip(offset)
        .limit(limit),
      ReviewModel.countDocuments(query),
    ]);

    return {
      reviews: docs.map((doc: any) => this.mapToDomain(doc)),
      total,
    };
  }

  async save(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Review> {
    const userOid = Types.ObjectId.isValid(review.userId)
      ? new Types.ObjectId(review.userId)
      : new Types.ObjectId();
    const prodOid = Types.ObjectId.isValid(review.productId)
      ? new Types.ObjectId(review.productId)
      : new Types.ObjectId();

    const doc = new ReviewModel({
      ...review,
      productId: prodOid,
      userId: userOid,
      isDeleted: false,
    });
    const saved = await doc.save();
    return this.mapToDomain(saved);
  }

  async update(id: string, updates: Partial<Review>): Promise<Review | null> {
    const doc = await ReviewModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updates, $inc: { version: 1 }, updatedAt: new Date() },
      { new: true }
    )
      .populate('userId', 'fullName avatarUrl email')
      .populate('productId', 'name sku images');

    return doc ? this.mapToDomain(doc) : null;
  }

  async hasUserReviewedProduct(userId: string, productId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(productId)) {
      return false;
    }
    const count = await ReviewModel.countDocuments({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
      isDeleted: false,
    });
    return count > 0;
  }

  async toggleHelpful(reviewId: string, userId: string): Promise<Review | null> {
    if (!Types.ObjectId.isValid(reviewId)) return null;
    const userObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : new Types.ObjectId();
    const review = await ReviewModel.findOne({ _id: reviewId, isDeleted: false });
    if (!review) return null;

    const alreadyVoted = review.helpfulVoters?.some((v: any) => v.toString() === userId);
    let updateOperation: any;

    if (alreadyVoted) {
      updateOperation = {
        $pull: { helpfulVoters: userObjectId },
        $inc: { helpfulVotes: -1 },
      };
    } else {
      updateOperation = {
        $addToSet: { helpfulVoters: userObjectId },
        $inc: { helpfulVotes: 1 },
      };
    }

    const updated = await ReviewModel.findOneAndUpdate(
      { _id: reviewId, isDeleted: false },
      updateOperation,
      { new: true }
    )
      .populate('userId', 'fullName avatarUrl email')
      .populate('productId', 'name sku images');

    return updated ? this.mapToDomain(updated) : null;
  }

  async addAdminReply(reviewId: string, reply: ReviewAdminReply): Promise<Review | null> {
    const updated = await ReviewModel.findOneAndUpdate(
      { _id: reviewId, isDeleted: false },
      {
        $set: {
          adminReply: {
            message: reply.message,
            repliedAt: reply.repliedAt || new Date(),
            repliedBy: reply.repliedBy,
          },
          updatedAt: new Date(),
        },
      },
      { new: true }
    )
      .populate('userId', 'fullName avatarUrl email')
      .populate('productId', 'name sku images');

    return updated ? this.mapToDomain(updated) : null;
  }

  async getReviewStats(productId: string): Promise<ReviewStats> {
    const prodObjectId = new Types.ObjectId(productId);
    const approvedReviews = await ReviewModel.find({
      productId: prodObjectId,
      status: 'APPROVED',
      isDeleted: false,
    });

    const totalReviews = approvedReviews.length;
    const distribution: { 1: number; 2: number; 3: number; 4: number; 5: number } = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    let totalRatingSum = 0;
    let recommendCount = 0;
    let totalPhotosCount = 0;

    for (const r of approvedReviews) {
      const rating = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      distribution[rating] += 1;
      totalRatingSum += r.rating;
      if (r.rating >= 4) recommendCount += 1;
      if (r.images && r.images.length > 0) totalPhotosCount += r.images.length;
    }

    const averageRating = totalReviews > 0 ? parseFloat((totalRatingSum / totalReviews).toFixed(1)) : 0;
    const recommendPercentage = totalReviews > 0 ? Math.round((recommendCount / totalReviews) * 100) : 100;

    return {
      averageRating,
      totalReviews,
      distribution,
      recommendPercentage,
      totalPhotosCount,
    };
  }

  async delete(id: string, deletedBy?: string): Promise<boolean> {
    const res = await ReviewModel.updateOne(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy } }
    );
    return res.modifiedCount > 0;
  }
}
