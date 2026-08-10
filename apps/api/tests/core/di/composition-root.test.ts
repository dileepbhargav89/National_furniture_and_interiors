import { describe, expect, it } from 'vitest';
import { buildAppContext } from '../../../src/core/di';

describe('buildAppContext', () => {
  it('returns the shared cross-cutting infrastructure context', () => {
    const context = buildAppContext();
    expect(context.logger).toBeDefined();
    expect(context.cache).toBeDefined();
    expect(context.mongoose).toBeDefined();
  });

  it('is idempotent — repeated calls return the same instance', () => {
    const first = buildAppContext();
    const second = buildAppContext();
    expect(first).toBe(second);
  });
});
