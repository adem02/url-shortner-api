import { ApiConfig } from '@/config/api.config';
import { ApiError, ApiErrorCode } from '@/errors';
import { ClickRepository } from '@/repositories/click.repository';
import { LinkRepository } from '@/repositories/link.repository';
import { ClickStats, StatsLink } from '@/types/click.types';
import { CacheService } from './cache.service';
import { generateCacheKey, STATS_CODE_CACHE_PREFIX } from '@/utils';
import Logger from '@/config/logger.config';

export class StatsService {
  constructor(
    private readonly linkRepo: LinkRepository,
    private readonly clickRepo: ClickRepository,
    private readonly cacheService: CacheService,
  ) {}

  async getStatsByCode(code: string): Promise<{ statsLink: StatsLink; stats: ClickStats }> {
    const cacheKey = generateCacheKey(STATS_CODE_CACHE_PREFIX, code);
    const cachedStatsData = await this.cacheService.getCacheByCode(cacheKey);
    const cacheStats = cachedStatsData
      ? (JSON.parse(cachedStatsData) as { statsLink: StatsLink; stats: ClickStats })
      : null;

    if (cacheStats) {
      if (!ApiConfig.isProduction) {
        Logger.debug({ code, cachedStats: cachedStatsData }, '[CACHE HIT] Stats found in cache');
      }

      return cacheStats;
    }

    if (!ApiConfig.isProduction) {
      Logger.debug({ code }, '[CACHE MISS] Stats not found in cache, querying database');
    }
    const link = await this.linkRepo.findLinkByCode(code);

    if (!link) {
      throw new ApiError(ApiErrorCode.NotFound, 'resource/not-found', 'Url not found.');
    }

    const linkId = link.id;

    const [clicksMetrics, clicksPerHour, topCountries, devices, recentClicks] = await Promise.all([
      this.clickRepo.getClicksMetricsByLinkId(linkId),
      this.clickRepo.getClicksPerHourByLinkId(linkId),
      this.clickRepo.getCountryClicksByLinkId(linkId),
      this.clickRepo.getDevicesMetricsByLinkId(linkId),
      this.clickRepo.getRecentClicksByLinkId(linkId),
    ]);

    const statsLink: StatsLink = {
      code: link.code,
      shortUrl: `${ApiConfig.baseUrl}/${link.code}`,
      longUrl: link.longUrl,
      createdAt: link.createdAt,
    };

    const stats: ClickStats = {
      total: clicksMetrics.total,
      today: clicksMetrics.today,
      thisWeek: clicksMetrics.thisWeek,
      thisMonth: clicksMetrics.thisMonth,
      clicksPerHour,
      topCountries,
      devices,
      recentClicks,
    };

    await this.cacheService.setCacheByCode(cacheKey, { statsLink, stats });
    if (!ApiConfig.isProduction) {
      Logger.info({ code, statsLink, stats }, '[CACHE SET] Stats cached');
    }

    return {
      statsLink,
      stats,
    };
  }
}
