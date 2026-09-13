import { Worker, Job } from 'bullmq';
import { redisClient } from '../../../core/cache';
import { logger } from '../../../core/logger';
import { env } from '../../../core/config';
import { GetLeadsFunnelUseCase } from '../../leads/application/leads.use-cases';
import { GetDesignFunnelUseCase } from '../../design-projects/application/design-projects.use-cases';
import { GetSalesMetricsUseCase } from '../../orders/application/orders.use-cases';
import { AnalyticsDateRange } from '../domain/analytics.types';

export class AnalyticsJobProcessor {
  private worker?: Worker | undefined;
  private readonly CACHE_KEY_PREFIX = 'analytics:dashboard';

  constructor(
    private readonly getLeadsFunnelUseCase: GetLeadsFunnelUseCase,
    private readonly getDesignFunnelUseCase: GetDesignFunnelUseCase,
    private readonly getSalesMetricsUseCase: GetSalesMetricsUseCase
  ) {}

  private getCacheKey(metric: string, range?: AnalyticsDateRange): string {
    const start = range?.startDate || 'all';
    const end = range?.endDate || 'all';
    return `${this.CACHE_KEY_PREFIX}:${metric}:${start}:${end}`;
  }

  async processJob(job: Job): Promise<void> {
    logger.info({ jobId: job.id }, 'Processing analytics pre-computation job');

    try {
      // For now, we compute the "all-time" metrics.
      // A more sophisticated setup might compute for different date ranges.
      const range: AnalyticsDateRange = {};

      const [leadsFunnel, designFunnel, salesMetrics] = await Promise.all([
        this.getLeadsFunnelUseCase.execute(range.startDate, range.endDate),
        this.getDesignFunnelUseCase.execute(range.startDate, range.endDate),
        this.getSalesMetricsUseCase.execute(range.startDate, range.endDate),
      ]);

      await Promise.all([
        redisClient.set(this.getCacheKey('leads-funnel', range), JSON.stringify(leadsFunnel)),
        redisClient.set(this.getCacheKey('design-funnel', range), JSON.stringify(designFunnel)),
        redisClient.set(this.getCacheKey('sales', range), JSON.stringify(salesMetrics)),
      ]);

      logger.info('Analytics pre-computation completed successfully');
    } catch (error) {
      logger.error({ err: error }, 'Failed to compute analytics');
      throw error;
    }
  }

  start(): void {
    if (this.worker) return;
    
    this.worker = new Worker(
      'analytics-precomputation',
      async (job) => this.processJob(job),
      {
        connection: redisClient,
        concurrency: 1, // Avoid running multiple aggregations concurrently
      }
    );

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
