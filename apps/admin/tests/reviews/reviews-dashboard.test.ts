import { describe, it, expect } from 'vitest';
import { Review } from '@nfi/api-client';

describe('Admin Reviews Dashboard Logic Harness', () => {
  const mockReviews: Review[] = [
    {
      id: 'rev-1',
      productId: 'prod-teak-table',
      productName: 'Royal Teak Dining Table',
      productSku: 'TBL-TK-001',
      userId: 'usr-1',
      userName: 'Aarav Sharma',
      rating: 5,
      title: 'Exquisite Heritage Craftsmanship',
      content: 'The teak finish is absolutely breathtaking. Fits our dining hall perfectly.',
      status: 'APPROVED',
      isVerifiedPurchase: true,
      isFeatured: true,
      helpfulVotes: 8,
      images: [{ url: 'https://example.com/photo1.jpg' }],
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'rev-2',
      productId: 'prod-velvet-sofa',
      productName: 'Emerald Velvet 3-Seater',
      productSku: 'SFA-EM-002',
      userId: 'usr-2',
      userName: 'Priya Patel',
      rating: 4,
      title: 'Superb Cushioning & Finish',
      content: 'Very comfortable and rich texture. Delivery took slightly longer than estimated.',
      status: 'APPROVED',
      isVerifiedPurchase: true,
      isFeatured: false,
      helpfulVotes: 2,
      createdAt: '2026-03-02T12:00:00.000Z',
      updatedAt: '2026-03-02T12:00:00.000Z',
    },
    {
      id: 'rev-3',
      productId: 'prod-teak-table',
      productName: 'Royal Teak Dining Table',
      productSku: 'TBL-TK-001',
      userId: 'usr-3',
      userName: 'Rohan Gupta',
      rating: 1,
      title: 'Spam content test',
      content: 'Random inappropriate test review.',
      status: 'PENDING',
      isVerifiedPurchase: false,
      isFeatured: false,
      helpfulVotes: 0,
      createdAt: '2026-03-03T15:00:00.000Z',
      updatedAt: '2026-03-03T15:00:00.000Z',
    },
    {
      id: 'rev-4',
      productId: 'prod-chair',
      productName: 'Hand-Carved Accent Chair',
      productSku: 'CHR-AC-004',
      userId: 'usr-4',
      userName: 'Ananya Roy',
      rating: 2,
      title: 'Damaged during transit',
      content: 'Leg arrived chipped. Customer service handled replacement promptly.',
      status: 'REJECTED',
      isVerifiedPurchase: true,
      isFeatured: false,
      helpfulVotes: 0,
      createdAt: '2026-03-04T09:00:00.000Z',
      updatedAt: '2026-03-04T09:00:00.000Z',
    },
  ];

  describe('KPI Statistics Calculations', () => {
    function computeStats(reviews: Review[]) {
      const total = reviews.length;
      const pending = reviews.filter((r) => r.status === 'PENDING').length;
      const approved = reviews.filter((r) => r.status === 'APPROVED').length;
      const featured = reviews.filter((r) => r.isFeatured).length;
      const approvedReviews = reviews.filter((r) => r.status === 'APPROVED');
      const avgRating =
        approvedReviews.length > 0
          ? (
              approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
              approvedReviews.length
            ).toFixed(1)
          : '0.0';

      return { total, pending, approved, featured, avgRating };
    }

    it('should compute exact counts and approved review average rating', () => {
      const stats = computeStats(mockReviews);
      expect(stats.total).toBe(4);
      expect(stats.pending).toBe(1);
      expect(stats.approved).toBe(2);
      expect(stats.featured).toBe(1);
      // (5 + 4) / 2 = 4.5
      expect(stats.avgRating).toBe('4.5');
    });

    it('should return 0.0 when no approved reviews exist', () => {
      const emptyStats = computeStats([]);
      expect(emptyStats.avgRating).toBe('0.0');
    });
  });

  describe('Tab and Filter Criteria Engine', () => {
    function filterReviews(
      reviews: Review[],
      options: {
        tab?: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'FEATURED';
        rating?: number;
        hasPhotos?: boolean;
        search?: string;
      }
    ) {
      return reviews.filter((r) => {
        if (options.tab === 'PENDING' && r.status !== 'PENDING') return false;
        if (options.tab === 'APPROVED' && r.status !== 'APPROVED') return false;
        if (options.tab === 'REJECTED' && r.status !== 'REJECTED') return false;
        if (options.tab === 'FEATURED' && !r.isFeatured) return false;

        if (options.rating && r.rating !== options.rating) return false;
        if (options.hasPhotos && (!r.images || r.images.length === 0)) return false;

        if (options.search?.trim()) {
          const q = options.search.toLowerCase();
          const match =
            (r.userName || '').toLowerCase().includes(q) ||
            (r.title || '').toLowerCase().includes(q) ||
            r.content.toLowerCase().includes(q) ||
            (r.productName || '').toLowerCase().includes(q) ||
            (r.productSku || '').toLowerCase().includes(q);
          if (!match) return false;
        }

        return true;
      });
    }

    it('should filter by PENDING moderation tab', () => {
      const pending = filterReviews(mockReviews, { tab: 'PENDING' });
      expect(pending).toHaveLength(1);
      expect(pending[0]?.id).toBe('rev-3');
    });

    it('should filter by FEATURED tab', () => {
      const featured = filterReviews(mockReviews, { tab: 'FEATURED' });
      expect(featured).toHaveLength(1);
      expect(featured[0]?.id).toBe('rev-1');
    });

    it('should filter by photo presence', () => {
      const withPhotos = filterReviews(mockReviews, { hasPhotos: true });
      expect(withPhotos).toHaveLength(1);
      expect(withPhotos[0]?.id).toBe('rev-1');
    });

    it('should search across customer name, title, and SKU', () => {
      const bySku = filterReviews(mockReviews, { search: 'SFA-EM-002' });
      expect(bySku).toHaveLength(1);
      expect(bySku[0]?.id).toBe('rev-2');

      const byCustomer = filterReviews(mockReviews, { search: 'Aarav' });
      expect(byCustomer).toHaveLength(1);
      expect(byCustomer[0]?.id).toBe('rev-1');

      const byTitle = filterReviews(mockReviews, { search: 'Heritage' });
      expect(byTitle).toHaveLength(1);
      expect(byTitle[0]?.id).toBe('rev-1');
    });

    it('should filter by exact star rating', () => {
      const fiveStars = filterReviews(mockReviews, { rating: 5 });
      expect(fiveStars).toHaveLength(1);
      expect(fiveStars[0]?.id).toBe('rev-1');
    });
  });
});
