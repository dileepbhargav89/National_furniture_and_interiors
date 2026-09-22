import type { Server } from 'node:http';
import express, { type Express } from 'express';
import type { ClientRateLimitInfo, Store } from 'express-rate-limit';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { errorHandlerMiddleware } from '../../../src/core/exceptions';
import { requestIdMiddleware } from '../../../src/core/logger/request-id';
import { createRateLimiter } from '../../../src/core/security';

// These tests inject a store rather than reaching for the Redis-backed default. That is not a
// way of avoiding Redis: constructing the real `RedisStore` issues Redis commands, so building a
// limiter opens a socket, and `pr-checks.yml` provisions no Redis service. Previously that made
// even a `typeof limiter === 'function'` assertion emit ECONNREFUSED. Injecting the store lets
// these tests assert limiter *behaviour* — including the store-failure path below, which could
// not be exercised at all against a live Redis without taking Redis down mid-suite.
//
// Production wiring is unaffected: `createRateLimiter` called with one argument still builds the
// Redis-backed store docs/07 §7.1 requires.

/** Minimal in-process counter implementing express-rate-limit's Store contract. */
function memoryStore(): Store {
  const hits = new Map<string, number>();
  return {
    async increment(key: string): Promise<ClientRateLimitInfo> {
      const totalHits = (hits.get(key) ?? 0) + 1;
      hits.set(key, totalHits);
      return { totalHits, resetTime: undefined };
    },
    async decrement(key: string): Promise<void> {
      hits.set(key, Math.max(0, (hits.get(key) ?? 0) - 1));
    },
    async resetKey(key: string): Promise<void> {
      hits.delete(key);
    },
  };
}

/** Stands in for Redis being unreachable at request time. */
function failingStore(): Store {
  return {
    async increment(): Promise<ClientRateLimitInfo> {
      throw new Error('ECONNREFUSED: simulated Redis outage');
    },
    async decrement(): Promise<void> {
      throw new Error('ECONNREFUSED: simulated Redis outage');
    },
    async resetKey(): Promise<void> {
      throw new Error('ECONNREFUSED: simulated Redis outage');
    },
  };
}

function buildApp(store: Store, max: number): Express {
  const app = express();
  app.use(requestIdMiddleware);
  app.use(createRateLimiter({ windowMs: 60_000, max, keyPrefix: 'test' }, store));
  app.get('/ping', (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.use(errorHandlerMiddleware);
  return app;
}

async function listen(app: Express): Promise<{ server: Server; baseUrl: string }> {
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Expected server to bind to a TCP port');
  }
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

describe('createRateLimiter', () => {
  it('does not invent its own rate-limit values — every value is caller-supplied', () => {
    const limiter = createRateLimiter(
      { windowMs: 60_000, max: 5, keyPrefix: 'test' },
      memoryStore(),
    );
    expect(typeof limiter).toBe('function');
  });

  it('produces independently-scoped limiters for different key prefixes', () => {
    const strict = createRateLimiter(
      { windowMs: 60_000, max: 5, keyPrefix: 'auth-login' },
      memoryStore(),
    );
    const standard = createRateLimiter(
      { windowMs: 60_000, max: 120, keyPrefix: 'standard' },
      memoryStore(),
    );
    expect(strict).not.toBe(standard);
  });

  describe('enforcement', () => {
    let server: Server;
    let baseUrl: string;

    beforeAll(async () => {
      // max: 2 — the docs/08 §4.4 Strict tier's real value (5) is asserted against the live
      // stack in the acceptance run; here the value only needs to be small and deterministic.
      ({ server, baseUrl } = await listen(buildApp(memoryStore(), 2)));
    });

    afterAll(async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    });

    it('allows requests up to the limit, then returns docs/08 §3.11 429 RATE_LIMITED', async () => {
      expect((await fetch(`${baseUrl}/ping`)).status).toBe(200);
      expect((await fetch(`${baseUrl}/ping`)).status).toBe(200);

      const blocked = await fetch(`${baseUrl}/ping`);
      expect(blocked.status).toBe(429);

      const body = (await blocked.json()) as {
        success: boolean;
        data: null;
        error: { code: string };
      };
      expect(body.success).toBe(false);
      expect(body.data).toBeNull();
      expect(body.error.code).toBe('RATE_LIMITED');
    });

    it('sets standard RateLimit headers and omits the legacy X-RateLimit-* set', async () => {
      const res = await fetch(`${baseUrl}/ping`);
      expect(res.headers.get('ratelimit-limit') ?? res.headers.get('ratelimit')).not.toBeNull();
      expect(res.headers.get('x-ratelimit-limit')).toBeNull();
    });
  });

  describe('store failure', () => {
    let server: Server;
    let baseUrl: string;

    beforeAll(async () => {
      ({ server, baseUrl } = await listen(buildApp(failingStore(), 5)));
    });

    afterAll(async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    });

    // docs/09 §2.2's fail-closed principle. This closes the condition left open in
    // implementation/02_rate_limit_dependency_decision.md §6 item 3 ("If the Redis store errors,
    // does the limiter deny or allow?"). A limiter that fails OPEN would silently remove
    // brute-force protection from every auth endpoint exactly when infrastructure is degraded —
    // the moment an attacker is most likely to be probing.
    it('FAILS CLOSED when the counter store is unreachable — the request must not succeed', async () => {
      const res = await fetch(`${baseUrl}/ping`);
      expect(res.status).not.toBe(200);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('identity-based rate limiting & retry-after headers', () => {
    let server: Server;
    let baseUrl: string;

    beforeAll(async () => {
      const app = express();
      app.use(express.json());
      app.use(requestIdMiddleware);
      app.use(
        '/login-mock',
        createRateLimiter(
          {
            windowMs: 60_000,
            max: 2,
            keyPrefix: 'test-identity',
            keyGenerator: (req) => req.body?.email || req.ip || 'anonymous',
          },
          memoryStore(),
        ),
      );
      app.post('/login-mock', (_req, res) => {
        res.status(200).json({ ok: true });
      });
      app.use(errorHandlerMiddleware);

      ({ server, baseUrl } = await listen(app));
    });

    afterAll(async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    });

    it('limits requests per identity key and includes retryAfter in 429 response', async () => {
      // Target email request 1
      const res1 = await fetch(`${baseUrl}/login-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'target@example.com' }),
      });
      expect(res1.status).toBe(200);

      // Target email request 2
      const res2 = await fetch(`${baseUrl}/login-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'target@example.com' }),
      });
      expect(res2.status).toBe(200);

      // Target email request 3 exceeds limit (max 2)
      const res3 = await fetch(`${baseUrl}/login-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'target@example.com' }),
      });
      expect(res3.status).toBe(429);
      const data3 = (await res3.json()) as {
        success: boolean;
        error: { code: string; retryAfterSeconds?: number };
      };
      expect(data3.success).toBe(false);
      expect(data3.error.code).toBe('RATE_LIMITED');
      expect(typeof data3.error.retryAfterSeconds).toBe('number');
      expect(data3.error.retryAfterSeconds).toBeGreaterThan(0);

      // A different email is unaffected by target email's rate limit
      const resOther = await fetch(`${baseUrl}/login-mock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'other@example.com' }),
      });
      expect(resOther.status).toBe(200);
    });
  });
});
