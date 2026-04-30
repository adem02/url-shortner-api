import { LinkRepository } from '@/repositories/link.repository';
import { CacheService } from './cache.service';
import { ApiError, ApiErrorCode } from '@/errors';
import Logger from '@/config/logger.config';
import { Link } from '@/types/link.types';
import { ApiConfig } from '@/config/api.config';
import { CLICK_CODE_CACHE_PREFIX, generateCacheKey } from '@/utils';

export class ClickService {
  constructor(
    private readonly linkRepo: LinkRepository,
    private readonly cacheService: CacheService,
  ) {}

  async getLinkByCode(code: string): Promise<Link> {
    const cacheKey = generateCacheKey(CLICK_CODE_CACHE_PREFIX, code);
    const cachedLinkData = await this.cacheService.getCacheByCode(cacheKey);
    const cachedLink = cachedLinkData ? (JSON.parse(cachedLinkData) as Link) : null;

    if (cachedLink) {
      if (!ApiConfig.isProduction) {
        Logger.debug({ code, cachedUrl: cachedLinkData }, '[CACHE HIT] URL found in cache');
      }
      return cachedLink;
    }

    if (!ApiConfig.isProduction) {
      Logger.debug({ code }, '[CACHE MISS] URL not found in cache, querying database');
    }
    const link = await this.linkRepo.findLinkByCode(code);

    if (!link) {
      throw new ApiError(ApiErrorCode.NotFound, 'resource/not-found', 'Url not found.');
    }

    await this.cacheService.setCacheByCode(cacheKey, link, 86400);
    if (!ApiConfig.isProduction) {
      Logger.info({ code, link }, '[CACHE SET] URL cached');
    }

    return link;
  }
}
