import Redis from 'ioredis';
import { redis } from '@/config/redis.config';
import { ApiConfig } from '@/config/api.config';
import { DomainEvent, QUEUE_NAME, QueueHandler } from '@/types/queue.types';
import Logger from '@/config/logger.config';

export class QueueService {
  private readonly consumerRedis: Redis;
  private readonly handlers: Map<string, QueueHandler<unknown>> = new Map();

  constructor() {
    this.consumerRedis = new Redis(ApiConfig.redis.url, { keepAlive: 10000, lazyConnect: true });
  }

  registerHandler<T>(type: string, handler: QueueHandler<DomainEvent<T>>): void {
    this.handlers.set(type, handler);
  }

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    await redis.rpush(QUEUE_NAME, JSON.stringify(event));
  }

  async startConsumer(): Promise<void> {
    await this.consumerRedis.connect();
    Logger.info('[QUEUE CONSUMER] Starting — waiting for events...');
    while (true) {
      try {
        const result = await this.consumerRedis.blpop(QUEUE_NAME, 0);
        if (result && result[1]) {
          try {
            const event: DomainEvent<unknown> = JSON.parse(result[1]);
            const handler = this.handlers.get(event.type);
            if (handler) {
              await handler.handle(event);
            } else {
              Logger.warn(`[QUEUE CONSUMER] No handler for event type: ${event.type}`);
            }
          } catch (err) {
            Logger.error(`[QUEUE CONSUMER] Failed to process event: ${err}`);
          }
        }
      } catch (err) {
        Logger.error(`[QUEUE CONSUMER] Error while consuming queue: ${err}`);
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
  }
}

export const queueService = new QueueService();
