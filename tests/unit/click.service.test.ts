import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClickService } from '../../src/services/click.services';
import { LinkRepository } from '../../src/repositories/link.repository';
import { CacheService } from '../../src/services/cache.service';
import { ApiError, ApiErrorCode } from '../../src/errors';
import { Link } from '../../src/types/link.types';
import Logger from '../../src/config/logger.config';

vi.mock('../../src/config/logger.config', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('ClickService', () => {
  let clickService: ClickService;
  let mockLinkRepo: Partial<LinkRepository>;
  let mockCacheService: Partial<CacheService>;

  const mockLink: Link = {
    id: 'link-123',
    code: 'abc123',
    longUrl: 'https://example.com',
    createdAt: new Date('2026-04-29'),
  };

  beforeEach(() => {
    mockLinkRepo = {
      findLongUrlByCode: vi.fn(),
    };

    mockCacheService = {
      getCacheByCode: vi.fn(),
      setCacheByCode: vi.fn(),
    };

    clickService = new ClickService(
      mockLinkRepo as LinkRepository,
      mockCacheService as CacheService,
    );
  });

  describe('getLinkByCode', () => {
    it('should return link from cache (cache hit)', async () => {
      const cachedData = JSON.stringify(mockLink);
      (mockCacheService.getCacheByCode as any).mockResolvedValue(cachedData);

      const result = await clickService.getLinkByCode('abc123');

      const expectedResult = JSON.parse(cachedData) as Link;
      expect(result).toEqual(expectedResult);
      expect(mockCacheService.getCacheByCode).toHaveBeenCalledWith('abc123');
      expect(mockLinkRepo.findLongUrlByCode).not.toHaveBeenCalled();
      expect(Logger.debug).toHaveBeenCalled();
    });

    it('should query DB and cache result (cache miss)', async () => {
      (mockCacheService.getCacheByCode as any).mockResolvedValue(null);
      (mockLinkRepo.findLongUrlByCode as any).mockResolvedValue(mockLink);

      const result = await clickService.getLinkByCode('abc123');

      expect(result).toEqual(mockLink);
      expect(mockCacheService.getCacheByCode).toHaveBeenCalledWith('abc123');
      expect(mockLinkRepo.findLongUrlByCode).toHaveBeenCalledWith('abc123');
      expect(mockCacheService.setCacheByCode).toHaveBeenCalledWith(
        'abc123',
        mockLink,
      );
      expect(Logger.info).toHaveBeenCalledTimes(2);
    });

    it('should throw ApiError with correct error code (NotFound)', async () => {
      (mockCacheService.getCacheByCode as any).mockResolvedValue(null);
      (mockLinkRepo.findLongUrlByCode as any).mockResolvedValue(null);

      try {
        await clickService.getLinkByCode('nonexistent');
        expect.fail('should have thrown an error');
      } catch (error) {
        if (error instanceof ApiError) {
          expect(error.httpCode).toBe(ApiErrorCode.NotFound);
        }
      }
    });

    it('should pass link correctly to cache.set', async () => {
      (mockCacheService.getCacheByCode as any).mockResolvedValue(null);
      (mockLinkRepo.findLongUrlByCode as any).mockResolvedValue(mockLink);

      await clickService.getLinkByCode('abc123');

      expect(mockCacheService.setCacheByCode).toHaveBeenCalledWith(
        'abc123',
        mockLink,
      );
      expect(Logger.info).toHaveBeenCalledWith(
        { code: 'abc123', link: mockLink },
        '[CACHE SET] URL cached',
      );
    });

    it('should correctly parse JSON from cache', async () => {
      const cachedData = JSON.stringify(mockLink);
      (mockCacheService.getCacheByCode as any).mockResolvedValue(cachedData);

      const result = await clickService.getLinkByCode('abc123');

      expect(result.id).toBe(mockLink.id);
      expect(result.code).toBe(mockLink.code);
      expect(result.longUrl).toBe(mockLink.longUrl);
    });
  });
});
