import { Worker, Job } from 'bullmq';
import { redisClient } from '../core/cache';
import { logger } from '../core/logger';
import { AppContext } from '../core/di';

export class NotificationsWorker {
  private worker: Worker;

  constructor(private readonly ctx: AppContext) {
    this.worker = new Worker(
      'notifications-queue',
      async (job: Job) => {
        await this.processJob(job);
      },
      { connection: redisClient }
    );

    this.worker.on('completed', (job) => {
      logger.info(`Notification job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error({ err }, `Notification job ${job?.id} failed with error:`);
    });
  }

  async processJob(job: Job): Promise<void> {
    if (job.name === 'send-notification') {
      const { notificationId } = job.data;
      if (!notificationId) {
        throw new Error('notificationId is required');
      }

      // We need to fetch the notification and send it
      // Since the repository is typed inside `ctx`, let's get it by adding a helper method to notifications use cases or port.
      // Wait, we can't directly use repository if it's not exposed. 
      // Let's create a SendNotificationUseCase.
      // For now, I'll add `sendNotificationByIdUseCase` to `ctx.notifications` in composition-root.
      await this.ctx.notifications.sendNotificationByIdUseCase.execute(notificationId);
    }
  }

  async start(): Promise<void> {
    logger.info('NotificationsWorker started listening to notifications-queue');
  }

  async stop(): Promise<void> {
    await this.worker.close();
  }
}
