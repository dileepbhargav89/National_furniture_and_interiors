import type Redis from 'ioredis';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsJobProcessor } from '../../../../src/modules/analytics/infrastructure/analytics.job-processor';
import { redisClient, CACHE_KEYS, CACHE_TTL } from '../../../../src/core/cache';
import { Worker, type Job } from 'bullmq';
import type { GetLeadsFunnelUseCase } from '../../../../src/modules/leads/application/leads.use-cases';
import type { GetDesignFunnelUseCase } from '../../../../src/modules/design-projects/application/design-projects.use-cases';
import type { GetSalesMetricsUseCase } from '../../../../src/modules/orders/application/orders.use-cases';
import type { AnalyticsUseCases } from '../../../../src/modules/analytics/application/analytics.use-cases';

vi.mock('../../../../src/core/cache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../src/core/cache')>();
  const mockRedis = {
    set: vi.fn(),
    get: vi.fn(),
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

vi.mock('bullmq', () => {
  return {
    Worker: vi.fn().mockImplementation(() => {
      return {
        on: vi.fn(),
        close: vi.fn(),
      };
    }),
  };
});

describe('AnalyticsJobProcessor', () => {
  let processor: AnalyticsJobProcessor;
  let mockLeadsFunnelUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockDesignFunnelUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockSalesMetricsUseCase: { execute: ReturnType<typeof vi.fn> };
  let mockAnalyticsUseCases: {
    getExecutiveKPIs: ReturnType<typeof vi.fn>;
    getRevenueTrends: ReturnType<typeof vi.fn>;
    getCustomerCohorts: ReturnType<typeof vi.fn>;
    getCategoryPerformance: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockLeadsFunnelUseCase = { execute: vi.fn().mockResolvedValue({ totalLeads: 10 }) };
    mockDesignFunnelUseCase = { execute: vi.fn().mockResolvedValue({ totalProjects: 5 }) };
    mockSalesMetricsUseCase = { execute: vi.fn().mockResolvedValue({ totalRevenue: 1000 }) };
    mockAnalyticsUseCases = {
      getExecutiveKPIs: vi.fn().mockResolvedValue({}),
      getRevenueTrends: vi.fn().mockResolvedValue([]),
      getCustomerCohorts: vi.fn().mockResolvedValue({}),
      getCategoryPerformance: vi.fn().mockResolvedValue([]),
    };

    processor = new AnalyticsJobProcessor(
      mockLeadsFunnelUseCase as unknown as GetLeadsFunnelUseCase,
      mockDesignFunnelUseCase as unknown as GetDesignFunnelUseCase,
      mockSalesMetricsUseCase as unknown as GetSalesMetricsUseCase,
      mockAnalyticsUseCases as unknown as AnalyticsUseCases,
    );
  });

  describe('processJob', () => {
    it('should fetch metrics and store them in redis with TTL', async () => {
      const mockJob = { id: 'job-1' } as unknown as Job;

      await processor.processJob(mockJob);

      expect(mockLeadsFunnelUseCase.execute).toHaveBeenCalled();
      expect(mockDesignFunnelUseCase.execute).toHaveBeenCalled();
      expect(mockSalesMetricsUseCase.execute).toHaveBeenCalled();

      expect(mockAnalyticsUseCases.getExecutiveKPIs).toHaveBeenCalled();
      expect(mockAnalyticsUseCases.getRevenueTrends).toHaveBeenCalled();
      expect(mockAnalyticsUseCases.getCustomerCohorts).toHaveBeenCalled();
      expect(mockAnalyticsUseCases.getCategoryPerformance).toHaveBeenCalled();

      expect(redisClient.set).toHaveBeenCalledWith(
        CACHE_KEYS.analytics.leadsFunnel(),
        JSON.stringify({ totalLeads: 10 }),
        'EX',
        CACHE_TTL.ANALYTICS_KPI,
      );
      expect(redisClient.set).toHaveBeenCalledWith(
        CACHE_KEYS.analytics.designFunnel(),
        JSON.stringify({ totalProjects: 5 }),
        'EX',
        CACHE_TTL.ANALYTICS_KPI,
      );
      expect(redisClient.set).toHaveBeenCalledWith(
        CACHE_KEYS.analytics.salesMetrics(),
        JSON.stringify({ totalRevenue: 1000 }),
        'EX',
        CACHE_TTL.ANALYTICS_KPI,
      );
    });

    it('should throw if a use case fails', async () => {
      const mockJob = { id: 'job-1' } as unknown as Job;
      mockLeadsFunnelUseCase.execute.mockRejectedValueOnce(new Error('DB Error'));

      await expect(processor.processJob(mockJob)).rejects.toThrow('DB Error');
    });
  });

  describe('start/stop', () => {
    it('should start the worker only once', () => {
      processor.start();
      processor.start();
      expect(vi.mocked(Worker)).toHaveBeenCalledTimes(1);
    });

    it('should stop the worker if running', async () => {
      processor.start();
      await processor.stop();
      // Test passes if it does not throw
    });
  });
});
