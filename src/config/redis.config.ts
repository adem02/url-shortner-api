import Redis from 'ioredis';
import { ApiConfig } from './api.config';
import Logger from './logger.config';

const { host, port } = ApiConfig.redis;

export const redis = new Redis(Number(port) || 6379, host || 'redis', {
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
