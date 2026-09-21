import type Redis from 'ioredis';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsUseCases } from '../../../../src/modules/analytics/application/analytics.use-cases';
import { redisClient, CACHE_KEYS } from '../../../../src/core/cache';

vi.mock('../../../../src/core/cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../src/core/cache')>();
  const mockRedis = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  };
  return {
    ...actual,
    redisClient: mockRedis,
    cacheService: new actual.CacheService(mockRedis as unknown as Redis),
  };
});

vi.mock('../../../../src/core/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AnalyticsUseCases', () => {
  let useCases: AnalyticsUseCases;

  beforeEach(() => {
    vi.clearAllMocks();
    useCases = new AnalyticsUseCases();
  });

  describe('getLeadsFunnel', () => {
    it('should return cached data if available', async () => {
      const mockData = { totalLeads: 10, newLeads: 2 };
      vi.mocked(redisClient.get).mockResolvedValueOnce(JSON.stringify(mockData));

      const result = await useCases.getLeadsFunnel();
      expect(result).toEqual(mockData);
      expect(redisClient.get).toHaveBeenCalledWith(CACHE_KEYS.analytics.leadsFunnel());
    });

    it('should return default empty state if not in cache', async () => {
      vi.mocked(redisClient.get).mockResolvedValueOnce(null);

      const result = await useCases.getLeadsFunnel();
      expect(result).toEqual({
        totalLeads: 0,
        newLeads: 0,
        contactedLeads: 0,
        qualifiedLeads: 0,
        convertedLeads: 0,
        conversionRate: 0,
      });
    });
  });

  describe('getDesignFunnel', () => {
    it('should return cached data if available', async () => {
      const mockData = { totalProjects: 5, inProgress: 2 };
      vi.mocked(redisClient.get).mockResolvedValueOnce(JSON.stringify(mockData));

      const result = await useCases.getDesignFunnel();
      expect(result).toEqual(mockData);
      expect(redisClient.get).toHaveBeenCalledWith(CACHE_KEYS.analytics.designFunnel());
    });

    it('should return default empty state if not in cache', async () => {
      vi.mocked(redisClient.get).mockResolvedValueOnce(null);

      const result = await useCases.getDesignFunnel();
      expect(result).toEqual({
        totalProjects: 0,
        inConsultation: 0,
        quotationSent: 0,
        inProgress: 0,
        completed: 0,
      });
    });
  });

  describe('getSalesMetrics', () => {
    it('should return cached data if available', async () => {
      const mockData = { totalRevenue: 1000, totalOrders: 10, averageOrderValue: 100 };
      vi.mocked(redisClient.get).mockResolvedValueOnce(JSON.stringify(mockData));

      const result = await useCases.getSalesMetrics();
      expect(result).toEqual(mockData);
      expect(redisClient.get).toHaveBeenCalledWith(CACHE_KEYS.analytics.salesMetrics());
    });

    it('should return default empty state if not in cache', async () => {
      vi.mocked(redisClient.get).mockResolvedValueOnce(null);

      const result = await useCases.getSalesMetrics();
      expect(result).toEqual({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
      });
    });
  });

  describe('getDashboardSummary', () => {
    it('should return all metrics combined', async () => {
      vi.mocked(redisClient.get)
        .mockResolvedValueOnce(JSON.stringify({ totalLeads: 5 })) // leads
        .mockResolvedValueOnce(JSON.stringify({ totalProjects: 3 })) // design
        .mockResolvedValueOnce(JSON.stringify({ totalRevenue: 500 })); // sales

      const result = await useCases.getDashboardSummary();

      expect(result.leadsFunnel).toEqual({ totalLeads: 5 });
      expect(result.designFunnel).toEqual({ totalProjects: 3 });
      expect(result.salesMetrics).toEqual({ totalRevenue: 500 });
      expect(result.updatedAt).toBeDefined();
    });
  });
});
