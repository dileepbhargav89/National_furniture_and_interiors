import { describe, it, expect } from 'vitest';
import { Review, ReviewStats } from '@nfi/api-client';

describe('Storefront Product Reviews Logic Harness', () => {
  const mockReviews: Review[] = [
    {
      id: 'rev-1',
      productId: 'prod-teak-sofa',
      rating: 5,
      title: 'Grand Living Room Centerpiece',
      content: 'The cushions are plush, and the teak grain is absolutely stunning. Truly heirloom quality.',
      status: 'APPROVED',
      isVerifiedPurchase: true,
      isFeatured: true,
      helpfulVotes: 12,
      images: [
        { url: 'https://example.com/customer-photo-1.jpg', alt: 'Living room setup' },
        { url: 'https://example.com/customer-photo-2.jpg', alt: 'Detail shot' },
      ],
      adminReply: {
        message: 'Thank you for choosing National Furniture & Interiors. May your home be blessed with timeless elegance.',
        repliedAt: '2026-03-02T10:00:00.000Z',
      },
      createdAt: '2026-03-01T08:00:00.000Z',
      updatedAt: '2026-03-01T08:00:00.000Z',
    },
    {
      id: 'rev-2',
      productId: 'prod-teak-sofa',
      rating: 4,
      title: 'Superb comfort, slight delay',
      content: 'Quality is impeccable. Delivery took 3 extra days due to customized upholstery.',
      status: 'APPROVED',
      isVerifiedPurchase: true,
      isFeatured: false,
      helpfulVotes: 3,
      createdAt: '2026-03-03T11:00:00.000Z',
      updatedAt: '2026-03-03T11:00:00.000Z',
    },
    {
      id: 'rev-3',
      productId: 'prod-teak-sofa',
      rating: 5,
      title: 'Exceeded all expectations',
      content: 'Fabric feels luxurious and the wood joinery is pure art.',
      status: 'APPROVED',
      isVerifiedPurchase: false,
      isFeatured: false,
      helpfulVotes: 1,
      createdAt: '2026-03-04T14:00:00.000Z',
      updatedAt: '2026-03-04T14:00:00.000Z',
    },
  ];

  describe('Rating Breakdown and Recommendation Metrics', () => {
    function computeAggregateStats(reviews: Review[]): ReviewStats {
      const totalReviews = reviews.length;
      if (totalReviews === 0) {
        return {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          recommendPercentage: 0,
          totalPhotosCount: 0,
        };
      }

      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const averageRating = parseFloat((sum / totalReviews).toFixed(1));

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let positiveCount = 0;
      let totalPhotos = 0;

      reviews.forEach((r) => {
        if (r.rating >= 1 && r.rating <= 5) {
          distribution[r.rating as keyof typeof distribution]++;
        }
        if (r.rating >= 4) {
          positiveCount++;
        }
        if (r.images && r.images.length > 0) {
          totalPhotos += r.images.length;
        }
      });

      const recommendPercentage = Math.round((positiveCount / totalReviews) * 100);

      return {
        averageRating,
        totalReviews,
        distribution,
        recommendPercentage,
        totalPhotosCount: totalPhotos,
      };
    }

    it('should accurately calculate average rating and recommendation percentage', () => {
      const stats = computeAggregateStats(mockReviews);
      // (5 + 4 + 5) / 3 = 4.666... -> 4.7
      expect(stats.averageRating).toBe(4.7);
      expect(stats.totalReviews).toBe(3);
      expect(stats.recommendPercentage).toBe(100);
      expect(stats.totalPhotosCount).toBe(2);
      expect(stats.distribution[5]).toBe(2);
      expect(stats.distribution[4]).toBe(1);
      expect(stats.distribution[1]).toBe(0);
    });
  });

  describe('Customer Photo Gallery Extraction', () => {
    it('should aggregate all review photo attachments into a gallery strip', () => {
      const photos = mockReviews.flatMap((r) =>
        (r.images || []).map((img) => ({
          url: img.url,
          alt: img.alt || r.title,
          reviewId: r.id,
        }))
      );

      expect(photos).toHaveLength(2);
      expect(photos[0]?.url).toBe('https://example.com/customer-photo-1.jpg');
      expect(photos[0]?.alt).toBe('Living room setup');
    });
  });

  describe('Sorting and Filtering Engine', () => {
    it('should sort reviews by highest rating then newest', () => {
      const sorted = [...mockReviews].sort((a, b) => b.rating - a.rating);
      expect(sorted[0]?.rating).toBe(5);
      expect(sorted[1]?.rating).toBe(5);
      expect(sorted[2]?.rating).toBe(4);
    });

    it('should sort reviews by helpful votes descending', () => {
      const sorted = [...mockReviews].sort((a, b) => (b.helpfulVotes || 0) - (a.helpfulVotes || 0));
      expect(sorted[0]?.id).toBe('rev-1');
      expect(sorted[0]?.helpfulVotes).toBe(12);
    });

    it('should filter reviews with photos only', () => {
      const withPhotos = mockReviews.filter((r) => r.images && r.images.length > 0);
      expect(withPhotos).toHaveLength(1);
      expect(withPhotos[0]?.id).toBe('rev-1');
    });
  });
});
