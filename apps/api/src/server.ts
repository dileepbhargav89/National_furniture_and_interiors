// HTTP server process entry point — docs/06_project_structure.md §4.1.
import { createApp } from './app';
import { connectCache } from './core/cache';
import { env } from './core/config';
import { connectDatabase } from './core/database';
import { logger } from './core/logger';

async function bootstrap(): Promise<void> {
  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`apps/api listening on port ${env.PORT}`);
  });

  // Connection outcomes are reflected in GET /health's mongoConnected/redisConnected fields
  // (docs/10_devops_architecture.md §11 liveness/readiness probe pattern) rather than blocking
  // the process from binding its port — a transient DB/cache outage should not crash-loop the API.
  void connectDatabase().catch((error: unknown) => {
    logger.error({ err: error }, 'Initial MongoDB connection attempt failed');
  });
  void connectCache().catch((error: unknown) => {
    logger.error({ err: error }, 'Initial Redis connection attempt failed');
  });
}

bootstrap().catch((error: unknown) => {
  logger.error({ err: error }, 'Failed to boot apps/api');
  process.exit(1);
});
