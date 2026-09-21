import { Worker, Job } from 'bullmq';
import {
  redisClient,
  cacheService,
  ICacheService,
  CACHE_KEYS,
  CACHE_TTL,
} from '../../../core/cache';
import { logger } from '../../../core/logger';
import { GetLeadsFunnelUseCase } from '../../leads/application/leads.use-cases';
import { GetDesignFunnelUseCase } from '../../design-projects/application/design-projects.use-cases';
import { GetSalesMetricsUseCase } from '../../orders/application/orders.use-cases';
import { AnalyticsDateRange } from '../domain/analytics.types';
import type { AnalyticsUseCases } from '../application/analytics.use-cases';

export class AnalyticsJobProcessor {
  private worker?: Worker | undefined;

  constructor(
    private readonly getLeadsFunnelUseCase: GetLeadsFunnelUseCase,
    private readonly getDesignFunnelUseCase: GetDesignFunnelUseCase,
    private readonly getSalesMetricsUseCase: GetSalesMetricsUseCase,
    private readonly analyticsUseCases?: AnalyticsUseCases | undefined,
    private readonly cache: ICacheService = cacheService,
  ) {}

  async processJob(job: Job): Promise<void> {
    logger.info({ jobId: job.id }, 'Processing analytics pre-computation job');

    try {
      const range: AnalyticsDateRange = {};

      const [leadsFunnel, designFunnel, salesMetrics] = await Promise.all([
        this.getLeadsFunnelUseCase.execute(range.startDate, range.endDate),
        this.getDesignFunnelUseCase.execute(range.startDate, range.endDate),
        this.getSalesMetricsUseCase.execute(range.startDate, range.endDate),
      ]);

      await Promise.all([
        this.cache.set(
          CACHE_KEYS.analytics.leadsFunnel(range),
          leadsFunnel,
          CACHE_TTL.ANALYTICS_KPI,
        ),
        this.cache.set(
          CACHE_KEYS.analytics.designFunnel(range),
          designFunnel,
          CACHE_TTL.ANALYTICS_KPI,
        ),
        this.cache.set(
          CACHE_KEYS.analytics.salesMetrics(range),
          salesMetrics,
          CACHE_TTL.ANALYTICS_KPI,
        ),
      ]);

      if (this.analyticsUseCases) {
        await Promise.all([
          this.analyticsUseCases.getExecutiveKPIs(range),
          this.analyticsUseCases.getRevenueTrends(range),
          this.analyticsUseCases.getCustomerCohorts(),
          this.analyticsUseCases.getCategoryPerformance(),
        ]);
      }

      logger.info('Analytics pre-computation completed successfully');
    } catch (error) {
      logger.error({ err: error }, 'Failed to compute analytics');
      throw error;
    }
  }

  start(): void {
    if (this.worker) return;

    this.worker = new Worker('analytics-precomputation', async (job) => this.processJob(job), {
      connection: redisClient,
      concurrency: 1, // Avoid running multiple aggregations concurrently
    });

    this.worker.on('error', (err) => {
      logger.error({ err }, 'Analytics worker error');
    });

    logger.info('Analytics job processor started');
  }

  async stop(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = undefined;
      logger.info('Analytics job processor stopped');
    }
  }
}
