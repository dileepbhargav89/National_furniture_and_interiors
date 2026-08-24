// Generic, Redis-backed rate-limiter factory — docs/06_project_structure.md §4.2 ("Generic
// middleware factories" only; modules decide *what*/*values*). The concrete tiers and their
// numeric limits (Strict 5/min login, Standard 120/min authenticated, etc.) are
// docs/08_api_architecture.md §4.4's — those numbers belong to the module wiring the limiter to
// its own route (e.g. `auth`'s `POST /login`), not to this factory, so this file invents no
// rate-limit value of its own.
//
// Redis as the shared counter store is already locked (docs/02_enterprise_architecture.md §16,
// docs/07_technology_decision_record.md §7.1's "rate-limit counter store" responsibility) —
// `express-rate-limit` + `rate-limit-redis` are the concrete npm packages implementing that
// already-decided capability (the same category of implementation-detail choice as the
// `eslint-plugin-import`/`FlatCompat` choices already made without an ADR in Sprint 0, since
// no locked document names a specific rate-limiting package the way it names bcrypt/jsonwebtoken).
import rateLimit, { type RateLimitRequestHandler, type Store } from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { redisClient } from '../cache';

type RedisStoreSendCommand = (...args: string[]) => Promise<RedisReply>;

export interface RateLimiterConfig {
  /** Window duration in milliseconds. */
  windowMs: number;
  /** Max requests per window per key. */
  max: number;
  /** Distinguishes this limiter's counters in Redis from every other limiter's. */
  keyPrefix: string;
}

/**
 * Builds the production store: `rate-limit-redis` over the shared ioredis client.
 *
 * Constructing a `RedisStore` is not inert — it issues Redis commands (script load, counter
 * ops), so merely building a limiter opens a socket. That is correct in production and wrong in
 * a construction-shape unit test, which is why `createRateLimiter` accepts an override below.
 */
function createRedisStore(keyPrefix: string): Store {
  return new RedisStore({
    prefix: `ratelimit:${keyPrefix}:`,
    // rate-limit-redis sends raw Redis commands through this hook; ioredis's `call` is the
    // matching primitive. The cast bridges ioredis's `Promise<unknown>` return against
    // rate-limit-redis's narrower `RedisReply` — the values are the same wire-level replies,
    // the two libraries just type them independently.
    sendCommand: ((...args: string[]) =>
      redisClient.call(args[0] as string, ...args.slice(1))) as RedisStoreSendCommand,
  }) as unknown as Store;
}

/**
 * @param store Optional store override. **Production callers must not pass this** — omitting it
 *   yields the Redis-backed store `docs/07` §7.1 requires, and an in-process store would multiply
 *   the effective limit by replica count, the failure `docs/07` §7.1 calls "broken by design".
 *   It exists so tests can exercise limiter behaviour (including store failure) without a live
 *   Redis, which `pr-checks.yml` does not provision. The default path is unchanged.
 */
export function createRateLimiter(
  config: RateLimiterConfig,
  store: Store = createRedisStore(config.keyPrefix),
): RateLimitRequestHandler {
  return rateLimit({
    windowMs: config.windowMs,
    limit: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    // docs/08_api_architecture.md §3.11: 429 -> error.code = RATE_LIMITED, Retry-After set.
    // The envelope shape mirrors core/exceptions/error-response.ts without importing it directly
    // (express-rate-limit's handler runs outside the normal error-middleware chain).
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        data: null,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests — please try again later',
          traceId: req.id ?? 'unknown',
        },
        meta: { requestId: req.id ?? 'unknown', timestamp: new Date().toISOString() },
      });
    },
  });
}
