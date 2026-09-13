export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ReviewImage {
  url: string;
  alt?: string | undefined;
}

export interface ReviewAdminReply {
  message: string;
  repliedAt: Date;
  repliedBy?: string | undefined;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number; // 1-5
  title?: string | undefined;
  content: string;
  images?: ReviewImage[] | undefined;
  helpfulVotes: number;
  helpfulVoters?: string[] | undefined;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  isFeatured: boolean;
  adminReply?: ReviewAdminReply | undefined;

  // Populated metadata for presentation
  userName?: string | undefined;
  userAvatar?: string | undefined;
  productName?: string | undefined;
  productSku?: string | undefined;
  productImage?: string | undefined;

  // Standard audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | undefined;
  updatedBy?: string | undefined;
  isDeleted: boolean;
  deletedAt?: Date | undefined;
  deletedBy?: string | undefined;
  version: number;
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
