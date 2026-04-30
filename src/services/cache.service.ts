import { ApiConfig } from '@/config/api.config';
import Logger from '@/config/logger.config';
import { redis } from '@/config/redis.config';
import { ApiError, ApiErrorCode } from '@/errors';
import Redis from 'ioredis';

export class CacheService {
  private readonly redisClient: Redis;

  constructor() {
    this.redisClient = redis;
  }

  async getCacheByCode(code: string): Promise<string | null> {
    try {
      return await this.redisClient.get(code);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unexpected error occurred';

      if (ApiConfig.isDevMode) {
        Logger.error(`Error getting cache: ${errMessage}`);
      }

      throw new ApiError(
        ApiErrorCode.InternalServerError,
        'cache/failed',
        'Unexpected error occurred while getting cache.',
      );
    }
  }

  async setCacheByCode<T>(code: string, data: T, ttlInSeconds: number = 60): Promise<void> {
    try {
      await this.redisClient.set(code, JSON.stringify(data), 'EX', ttlInSeconds);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unexpected error occurred';

      if (ApiConfig.isDevMode) {
        Logger.error(`Error setting cache: ${errMessage}`);
      }

      throw new ApiError(
        ApiErrorCode.InternalServerError,
        'cache/failed',
        'Unexpected error occurred while setting cache.',
      );
    }
  }

  async deleteCacheByCode(code: string): Promise<void> {
    try {
      await this.redisClient.del(code);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unexpected error occurred';

      if (ApiConfig.isDevMode) {
        Logger.error(`Error deleting cache: ${errMessage}`);
      }

      throw new ApiError(
        ApiErrorCode.InternalServerError,
        'cache/failed',
        'Unexpected error occurred while deleting cache.',
      );
    }
  }
}

export const cacheService = new CacheService();
