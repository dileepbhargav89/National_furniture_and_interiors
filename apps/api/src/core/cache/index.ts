// Redis client factory — docs/06_project_structure.md §4.2 ("modules decide *what* to cache; this
// provides *how*"). Cache-aside helper and business-specific keys/TTLs are out of Sprint 0 scope —
// they belong in each module's infrastructure/ layer once a module actually needs them.
import Redis from 'ioredis';
import { env } from '../config';
import { logger } from '../logger';

export const redisClient = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: null,
});

redisClient.on('error', (error: unknown) => {
  if (process.env.NODE_ENV !== 'development') {
    logger.error({ err: error }, 'Redis client error');
  }
});

let connectPromise: Promise<void> | null = null;

export async function connectCache(): Promise<void> {
  if (redisClient.status === 'ready' || redisClient.status === 'connecting' || redisClient.status === 'connect') {
    return;
  }
  if (!connectPromise) {
    connectPromise = redisClient
      .connect()
      .then(() => {
        logger.info('Redis connected');
      })
      .catch((error: unknown) => {
        connectPromise = null;
        throw error;
      });
  }
  return connectPromise;
}

export function isCacheConnected(): boolean {
  return redisClient.status === 'ready';
}

export async function disconnectCache(): Promise<void> {
  await redisClient.quit();
  connectPromise = null;
}
