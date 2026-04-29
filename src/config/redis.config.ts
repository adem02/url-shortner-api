import Redis from 'ioredis';
import { ApiConfig } from './api.config';
import Logger from './logger.config';

const { url } = ApiConfig.redis;

export const redis = new Redis(url, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  Logger.info('Redis connected');
});

redis.on('error', (err: Error) => {
  Logger.error(err.message);
});

export const connectRedis = async (): Promise<void> => {
  await redis.connect();
};
