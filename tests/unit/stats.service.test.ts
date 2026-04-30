import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, ApiErrorCode } from '../../src/errors';
import { ClickRepository } from '../../src/repositories/click.repository';
import { LinkRepository } from '../../src/repositories/link.repository';
import { CacheService } from '../../src/services/cache.service';
import { StatsService } from '../../src/services/stats.service';
import {
  ClicksMetrics,
  ClicksPerHour,
  RecentClick,
  StatsCountry,
  StatsDevices,
} from '../../src/types/click.types';

function makeMockCacheService(overrides: Partial<CacheService> = {}): CacheService {
  return {
    getCacheByCode: vi.fn().mockResolvedValue(null),
    setCacheByCode: vi.fn().mockResolvedValue(undefined),
    deleteCacheByCode: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as CacheService;
}

function makeMockLinkRepo(overrides: Partial<LinkRepository> = {}): LinkRepository {
  return {
    findLinkByCode: vi.fn().mockResolvedValue({
      id: 'link-123',
      code: 'abc123',
      longUrl: 'https://example.com',
      createdAt: new Date('2026-04-29T10:00:00.000Z'),
    }),
    ...overrides,
  } as unknown as LinkRepository;
}

function makeMockClickRepo(overrides: Partial<ClickRepository> = {}): ClickRepository {
  const clicksMetrics: ClicksMetrics = {
    total: 100,
    today: 10,
    thisWeek: 30,
    thisMonth: 90,
  };

  const clicksPerHour: ClicksPerHour[] = [
    { hour: '10:00', clicks: 4 },
    { hour: '11:00', clicks: 6 },
  ];

  const topCountries: StatsCountry[] = [
    { country: 'GN', clicks: 40, percentage: 40 },
    { country: 'CI', clicks: 20, percentage: 20 },
  ];

  const devices: StatsDevices = {
    mobile: 70,
    tablet: 5,
    desktop: 25,
  };

  const recentClicks: RecentClick[] = [
    {
      timestamp: '2026-04-29T10:00:00.000Z',
      country: 'GN',
      device: 'mobile',
      browser: 'Chrome',
    },
  ];

  return {
    getClicksMetricsByLinkId: vi.fn().mockResolvedValue(clicksMetrics),
    getClicksPerHourByLinkId: vi.fn().mockResolvedValue(clicksPerHour),
    getCountryClicksByLinkId: vi.fn().mockResolvedValue(topCountries),
    getDevicesMetricsByLinkId: vi.fn().mockResolvedValue(devices),
    getRecentClicksByLinkId: vi.fn().mockResolvedValue(recentClicks),
    ...overrides,
  } as unknown as ClickRepository;
}

describe('StatsService', () => {
  let linkRepo: LinkRepository;
  let clickRepo: ClickRepository;
  let cacheService: CacheService;
  let service: StatsService;

  beforeEach(() => {
    linkRepo = makeMockLinkRepo();
    clickRepo = makeMockClickRepo();
    cacheService = makeMockCacheService();
    service = new StatsService(linkRepo, clickRepo, cacheService);
  });

  describe('getStatsByCode()', () => {
    it('should return link and stats payload with expected shape (cache miss)', async () => {
      const result = await service.getStatsByCode('abc123');

      expect(cacheService.getCacheByCode).toHaveBeenCalledWith('stats:abc123');
      expect(linkRepo.findLinkByCode).toHaveBeenCalledWith('abc123');
      expect(clickRepo.getClicksMetricsByLinkId).toHaveBeenCalledWith('link-123');
      expect(clickRepo.getClicksPerHourByLinkId).toHaveBeenCalledWith('link-123');
      expect(clickRepo.getCountryClicksByLinkId).toHaveBeenCalledWith('link-123');
      expect(clickRepo.getDevicesMetricsByLinkId).toHaveBeenCalledWith('link-123');
      expect(clickRepo.getRecentClicksByLinkId).toHaveBeenCalledWith('link-123');
      expect(cacheService.setCacheByCode).toHaveBeenCalledWith(
        'stats:abc123',
        expect.objectContaining({ statsLink: expect.any(Object), stats: expect.any(Object) }),
      );

      expect(result).toMatchObject({
        statsLink: {
          code: 'abc123',
          shortUrl: expect.stringContaining('/abc123'),
          longUrl: 'https://example.com',
          createdAt: expect.any(Date),
        },
        stats: {
          total: 100,
          today: 10,
          thisWeek: 30,
          thisMonth: 90,
          clicksPerHour: expect.any(Array),
          topCountries: expect.any(Array),
          devices: expect.objectContaining({
            mobile: expect.any(Number),
            tablet: expect.any(Number),
            desktop: expect.any(Number),
          }),
          recentClicks: expect.any(Array),
        },
      });
    });

    it('should return cached data without hitting the database on cache hit', async () => {
      const cachedPayload = {
        statsLink: {
          code: 'abc123',
          shotUrl: 'http://short.ly/abc123',
          longUrl: 'https://example.com',
          createdAt: new Date('2026-04-29T10:00:00.000Z').toISOString(),
        },
        stats: {
          total: 99,
          today: 5,
          thisWeek: 20,
          thisMonth: 80,
          clicksPerHour: [],
          topCountries: [],
          devices: { mobile: 60, tablet: 10, desktop: 30 },
          recentClicks: [],
        },
      };

      cacheService = makeMockCacheService({
        getCacheByCode: vi.fn().mockResolvedValue(JSON.stringify(cachedPayload)),
      });
      service = new StatsService(linkRepo, clickRepo, cacheService);

      const result = await service.getStatsByCode('abc123');

      expect(cacheService.getCacheByCode).toHaveBeenCalledWith('stats:abc123');
      expect(linkRepo.findLinkByCode).not.toHaveBeenCalled();
      expect(clickRepo.getClicksMetricsByLinkId).not.toHaveBeenCalled();
      expect(cacheService.setCacheByCode).not.toHaveBeenCalled();
      expect(result).toEqual(cachedPayload);
    });

    it('should throw NotFound ApiError when code does not exist', async () => {
      linkRepo = makeMockLinkRepo({ findLinkByCode: vi.fn().mockResolvedValue(null) });
      service = new StatsService(linkRepo, clickRepo, cacheService);

      await expect(service.getStatsByCode('missing')).rejects.toMatchObject({
        httpCode: ApiErrorCode.NotFound,
      });

      expect(clickRepo.getClicksMetricsByLinkId).not.toHaveBeenCalled();
      expect(clickRepo.getClicksPerHourByLinkId).not.toHaveBeenCalled();
      expect(clickRepo.getCountryClicksByLinkId).not.toHaveBeenCalled();
      expect(clickRepo.getDevicesMetricsByLinkId).not.toHaveBeenCalled();
      expect(clickRepo.getRecentClicksByLinkId).not.toHaveBeenCalled();
    });

    it('should reject when one stats query fails', async () => {
      clickRepo = makeMockClickRepo({
        getClicksPerHourByLinkId: vi.fn().mockRejectedValue(new ApiError(
          ApiErrorCode.InternalServerError,
          'sql/failed',
          'Failed getting clicks per hour',
        )),
      });
      service = new StatsService(linkRepo, clickRepo, cacheService);

      await expect(service.getStatsByCode('abc123')).rejects.toBeInstanceOf(ApiError);
    });
  });
});
