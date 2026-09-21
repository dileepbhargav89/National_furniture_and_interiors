import { describe, expect, it, vi, beforeEach } from 'vitest';
import type Redis from 'ioredis';
import { CacheService } from '../../../src/core/cache/cache.service';

describe('CacheService', () => {
  let mockRedis: Partial<Redis>;
  let cacheService: CacheService;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    };
    cacheService = new CacheService(mockRedis as Redis);
  });

  describe('get', () => {
    it('returns parsed value on cache hit', async () => {
      const payload = { test: 123 };
      vi.mocked(mockRedis.get!).mockResolvedValue(JSON.stringify(payload));

      const result = await cacheService.get<{ test: number }>('key:1');
      expect(result).toEqual(payload);
      expect(mockRedis.get).toHaveBeenCalledWith('key:1');
    });

    it('returns null on cache miss', async () => {
      vi.mocked(mockRedis.get!).mockResolvedValue(null);

      const result = await cacheService.get('key:missing');
      expect(result).toBeNull();
    });

    it('returns null on redis error without throwing', async () => {
      vi.mocked(mockRedis.get!).mockRejectedValue(new Error('Redis down'));

      const result = await cacheService.get('key:err');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('sets key with EX ttl when ttlSeconds provided', async () => {
      vi.mocked(mockRedis.set!).mockResolvedValue('OK');

      await cacheService.set('key:ttl', { a: 1 }, 300);
      expect(mockRedis.set).toHaveBeenCalledWith('key:ttl', JSON.stringify({ a: 1 }), 'EX', 300);
    });

    it('sets key without EX when ttlSeconds omitted', async () => {
      vi.mocked(mockRedis.set!).mockResolvedValue('OK');

      await cacheService.set('key:nottl', 'hello');
      expect(mockRedis.set).toHaveBeenCalledWith('key:nottl', JSON.stringify('hello'));
    });

    it('catches redis errors gracefully without throwing', async () => {
      vi.mocked(mockRedis.set!).mockRejectedValue(new Error('Write failure'));

      await expect(cacheService.set('key:err', 'val')).resolves.not.toThrow();
    });
  });

  describe('del', () => {
    it('calls redis del with provided keys', async () => {
      vi.mocked(mockRedis.del!).mockResolvedValue(2);

      await cacheService.del('k1', 'k2');
      expect(mockRedis.del).toHaveBeenCalledWith('k1', 'k2');
    });

    it('does nothing if keys list is empty', async () => {
      await cacheService.del();
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('getOrSet', () => {
    it('returns cached value without calling fetcher on hit', async () => {
      const cached = { name: 'cached' };
      vi.mocked(mockRedis.get!).mockResolvedValue(JSON.stringify(cached));
      const fetcher = vi.fn().mockResolvedValue({ name: 'fresh' });

      const result = await cacheService.getOrSet('k:hit', 60, fetcher);
      expect(result).toEqual(cached);
      expect(fetcher).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('invokes fetcher and caches result with TTL on miss', async () => {
      vi.mocked(mockRedis.get!).mockResolvedValue(null);
      vi.mocked(mockRedis.set!).mockResolvedValue('OK');
      const fresh = { name: 'fresh' };
      const fetcher = vi.fn().mockResolvedValue(fresh);

      const result = await cacheService.getOrSet('k:miss', 120, fetcher);
      expect(result).toEqual(fresh);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(mockRedis.set).toHaveBeenCalledWith('k:miss', JSON.stringify(fresh), 'EX', 120);
    });
  });
});
