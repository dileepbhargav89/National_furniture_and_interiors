import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsJobProcessor } from '../../../../src/modules/analytics/infrastructure/analytics.job-processor';
import { redisClient } from '../../../../src/core/cache';
import { Worker } from 'bullmq';
vi.mock('../../../../src/core/cache', () => ({
  redisClient: {
    set: vi.fn(),
  },
}));

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
  let mockLeadsFunnelUseCase: any;
  let mockDesignFunnelUseCase: any;
  let mockSalesMetricsUseCase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLeadsFunnelUseCase = { execute: vi.fn().mockResolvedValue({ totalLeads: 10 }) };
    mockDesignFunnelUseCase = { execute: vi.fn().mockResolvedValue({ totalProjects: 5 }) };
    mockSalesMetricsUseCase = { execute: vi.fn().mockResolvedValue({ totalRevenue: 1000 }) };

    processor = new AnalyticsJobProcessor(
      mockLeadsFunnelUseCase,
      mockDesignFunnelUseCase,
      mockSalesMetricsUseCase
    );
  });

  describe('processJob', () => {
    it('should fetch metrics and store them in redis', async () => {
      const mockJob = { id: 'job-1' } as any;

      await processor.processJob(mockJob);

      expect(mockLeadsFunnelUseCase.execute).toHaveBeenCalled();
      expect(mockDesignFunnelUseCase.execute).toHaveBeenCalled();
      expect(mockSalesMetricsUseCase.execute).toHaveBeenCalled();

      expect(redisClient.set).toHaveBeenCalledTimes(3);
      expect(redisClient.set).toHaveBeenCalledWith(
        'analytics:dashboard:leads-funnel:all:all',
        JSON.stringify({ totalLeads: 10 })
      );
      expect(redisClient.set).toHaveBeenCalledWith(
        'analytics:dashboard:design-funnel:all:all',
        JSON.stringify({ totalProjects: 5 })
      );
      expect(redisClient.set).toHaveBeenCalledWith(
        'analytics:dashboard:sales:all:all',
        JSON.stringify({ totalRevenue: 1000 })
      );
    });

    it('should throw if a use case fails', async () => {
      const mockJob = { id: 'job-1' } as any;
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
