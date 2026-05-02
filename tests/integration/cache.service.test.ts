import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { redis } from '../../src/config/redis.config';
import { CacheService } from '../../src/services/cache.service';

const TEST_KEY_PREFIX = 'test:cache:';
const testKeys: string[] = [];

const key = (suffix: string): string => {
  const k = `${TEST_KEY_PREFIX}${suffix}`;
  testKeys.push(k);
  return k;
};

describe('CacheService Integration', () => {
  let cacheService: CacheService;

  beforeAll(async () => {
    await redis.connect();
    cacheService = new CacheService();
  });

  afterEach(async () => {
    if (testKeys.length > 0) {
      await redis.del(...testKeys);
      testKeys.length = 0;
    }
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('should return null for a key that does not exist', async () => {
    const result = await cacheService.getCacheByCode(key('missing'));
    expect(result).toBeNull();
  });

  it('should set a value and retrieve it', async () => {
    const k = key('set-get');
    const data = { url: 'https://example.com', code: 'abc123' };

    await cacheService.setCacheByCode(k, data, 60);

    const raw = await cacheService.getCacheByCode(k);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(data);
  });

  it('should overwrite an existing key with a new value', async () => {
    const k = key('overwrite');

    await cacheService.setCacheByCode(k, { v: 1 }, 60);
    await cacheService.setCacheByCode(k, { v: 2 }, 60);

    const raw = await cacheService.getCacheByCode(k);
    expect(JSON.parse(raw!)).toEqual({ v: 2 });
  });

  it('should delete a key and return null afterwards', async () => {
    const k = key('delete');

    await cacheService.setCacheByCode(k, { hello: 'world' }, 60);
    await cacheService.deleteCacheByCode(k);

    const result = await cacheService.getCacheByCode(k);
    expect(result).toBeNull();
  });

  it('should not throw when deleting a key that does not exist', async () => {
    await expect(cacheService.deleteCacheByCode(key('ghost'))).resolves.not.toThrow();
  });

  it('should expire a key after the given TTL', async () => {
    const k = key('ttl');

    await cacheService.setCacheByCode(k, { temp: true }, 1);

    await new Promise((res) => setTimeout(res, 1100));

    const result = await cacheService.getCacheByCode(k);
    expect(result).toBeNull();
  });
});
