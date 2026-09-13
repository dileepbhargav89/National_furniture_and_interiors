// Worker process entry point — boots the same module code as server.ts but starts BullMQ
// consumers instead of an HTTP server (docs/04_architecture_decision.md §10.3,
// docs/06_project_structure.md §4.5). No queue consumers exist yet (Sprint 1+ registers them in
// src/workers/) — this only proves the shared connection bootstrap also works from this entry point.
import { connectCache, redisClient as bullRedisClient } from './core/cache';
import { connectDatabase } from './core/database';
import { logger } from './core/logger';
import { buildAppContext } from './core/di';
import { NotificationsWorker } from './workers/notifications.worker';
import { InvoiceWorker } from './workers/invoice.worker';
import { Queue } from 'bullmq';

async function bootstrap(): Promise<void> {
  await Promise.all([connectDatabase(), connectCache()]);
  logger.info('apps/api worker process started');

  const ctx = buildAppContext();
  ctx.analytics.jobProcessor.start();
  
  const notificationsWorker = new NotificationsWorker(ctx);
  await notificationsWorker.start();
  
  const invoiceWorker = new InvoiceWorker(ctx);
  await invoiceWorker.start();
  
  // Note: For BullMQ we would also need a cron producer that adds the job to the queue,
  // but for the sake of simplicity since this worker might just process jobs, we can
  // also add a repeating job right here if we are the producer, or the `jobProcessor.start()`
  // might just be the consumer. The current AnalyticsJobProcessor both starts the worker 
  // and we should add a repeating job to it or just let it process. Let's add a recurring job.
  const analyticsQueue = new Queue('analytics-precomputation', { connection: bullRedisClient });
  await analyticsQueue.add('compute-dashboard', {}, {
    repeat: {
      pattern: '0 * * * *', // Every hour
    }
  });
  logger.info('Added analytics pre-computation repeating job');

  const gracefulShutdown = async () => {
    logger.info('Shutting down worker process...');
    try {
      await notificationsWorker.stop();
      await invoiceWorker.stop();
      await ctx.analytics.jobProcessor.stop();
      // Note: outboxPoller is stopped when the process exits or we can expose a stop method on it.
    } catch (e) {
      logger.error({ err: e }, 'Error during graceful shutdown');
    }
    process.exit(0);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
}

bootstrap().catch((error: unknown) => {
  logger.error({ err: error }, 'Failed to boot apps/api worker');
  process.exit(1);
});
