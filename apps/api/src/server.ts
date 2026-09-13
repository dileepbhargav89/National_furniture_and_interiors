// HTTP server process entry point — docs/06_project_structure.md §4.1.
import { createApp } from './app';
import { connectCache } from './core/cache';
import { env } from './core/config';
import { connectDatabase } from './core/database';
import { logger } from './core/logger';

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
  } catch (error: unknown) {
    logger.error({ err: error }, 'Initial MongoDB connection attempt failed');
  }

  try {
    await connectCache();
  } catch (error: unknown) {
    logger.error({ err: error }, 'Initial Redis connection attempt failed');
  }

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(`apps/api listening on port ${env.PORT}`);
  });
}

bootstrap().catch((error: unknown) => {
  logger.error({ err: error }, 'Failed to boot apps/api');
  process.exit(1);
});
