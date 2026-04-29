import { LinkRepository } from '@/repositories/link.repository';
import { CacheService } from './cache.service';
import { ApiError, ApiErrorCode } from '@/errors';
import Logger from '@/config/logger.config';
import { Link } from '@/types/link.types';
import { ApiConfig } from '@/config/api.config';

export class ClickService {
  constructor(
    private readonly linkRepo: LinkRepository,
    private readonly cacheService: CacheService,
  ) {}

  async getLinkByCode(code: string): Promise<Link> {
    const cachedUrl = await this.cacheService.getCacheByCode(code);
    const cachedUrlData = cachedUrl ? (JSON.parse(cachedUrl) as Link) : null;

    if (cachedUrlData) {
      if (!ApiConfig.isProduction) {
        Logger.debug({ code, cachedUrl }, '[CACHE HIT] URL found in cache');
      }
      return cachedUrlData;
    }

    Logger.info({ code }, '[CACHE MISS] URL not found in cache, querying database');
    const link = await this.linkRepo.findLongUrlByCode(code);

    if (!link) {
      Logger.warn({ code }, '[NOT FOUND] No URL found for code');
      throw new ApiError(ApiErrorCode.NotFound, 'resource/not-found', 'Url not found.');
    }

    await this.cacheService.setCacheByCode(code, link);
    if (!ApiConfig.isProduction) {
      Logger.info({ code, link }, '[CACHE SET] URL cached');
    }

    return link;
  }
}
