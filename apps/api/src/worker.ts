// Worker process entry point — boots the same module code as server.ts but starts BullMQ
// consumers instead of an HTTP server (docs/04_architecture_decision.md §10.3,
// docs/06_project_structure.md §4.5). No queue consumers exist yet (Sprint 1+ registers them in
// src/workers/) — this only proves the shared connection bootstrap also works from this entry point.
import { connectCache } from './core/cache';
import { connectDatabase } from './core/database';
import { logger } from './core/logger';

async function bootstrap(): Promise<void> {
  await Promise.all([connectDatabase(), connectCache()]);
  logger.info('apps/api worker process started (no queue consumers registered yet)');
}

bootstrap().catch((error: unknown) => {
  logger.error({ err: error }, 'Failed to boot apps/api worker');
  process.exit(1);
});
