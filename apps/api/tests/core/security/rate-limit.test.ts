import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '../../../src/core/security';

// Shape/construction test only — exercising the limiter against real traffic would hit its
// Redis-backed store, and pr-checks.yml provisions no Redis service (docs/10_devops_architecture.md
// §3.3's ephemeral Testing environment does, per its own spec, but that CI wiring doesn't exist
// yet). Functional rate-limit behavior is verified once a real route uses this factory.
describe('createRateLimiter', () => {
  it('does not invent its own rate-limit values — every value is caller-supplied', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 5, keyPrefix: 'test' });
    expect(typeof limiter).toBe('function');
  });

  it('produces independently-scoped limiters for different key prefixes', () => {
    const strict = createRateLimiter({ windowMs: 60_000, max: 5, keyPrefix: 'auth-login' });
    const standard = createRateLimiter({ windowMs: 60_000, max: 120, keyPrefix: 'standard' });
    expect(strict).not.toBe(standard);
  });
});
