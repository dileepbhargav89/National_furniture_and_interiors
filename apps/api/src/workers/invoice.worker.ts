import { Worker, Job } from 'bullmq';
import { redisClient } from '../core/cache';
import { logger } from '../core/logger';
import { AppContext } from '../core/di';

export class InvoiceWorker {
  private worker: Worker;

  constructor(private readonly ctx: AppContext) {
    this.worker = new Worker(
      'invoices-queue',
      async (job: Job) => {
        await this.processJob(job);
      },
      { connection: redisClient }
    );

    this.worker.on('completed', (job) => {
      logger.info(`Invoice job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error({ err }, `Invoice job ${job?.id} failed with error:`);
    });
  }

  async processJob(job: Job): Promise<void> {
    if (job.name === 'generate-invoice') {
      const { paymentId } = job.data;
      if (!paymentId) {
        throw new Error('paymentId is required for generate-invoice job');
      }

      await this.ctx.payments.generateInvoice.execute(paymentId);
    }
  }

  async start(): Promise<void> {
    logger.info('InvoiceWorker started listening to invoices-queue');
  }

  async stop(): Promise<void> {
    await this.worker.close();
  }
}
