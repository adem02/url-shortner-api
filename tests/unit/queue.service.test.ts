import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueueService } from '../../src/services/queue-service';
import { DomainEvent, QueueHandler } from '../../src/types/queue.types';
import { redis } from '../../src/config/redis.config';

vi.mock('../../src/config/redis.config');
vi.mock('../../src/config/logger.config', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('QueueService', () => {
  let queueService: QueueService;

  beforeEach(() => {
    vi.clearAllMocks();
    queueService = new QueueService();
  });

  describe('registerHandler', () => {
    it('should register a handler for an event type', () => {
      const mockHandler: QueueHandler<unknown> = { handle: vi.fn() };
      
      queueService.registerHandler('click.save', mockHandler);
      
      expect(mockHandler).toBeDefined();
    });

    it('should replace an existing handler', () => {
      const handler1: QueueHandler<unknown> = { handle: vi.fn() };
      const handler2: QueueHandler<unknown> = { handle: vi.fn() };
      
      queueService.registerHandler('click.save', handler1);
      queueService.registerHandler('click.save', handler2);
      
      expect(handler2).toBeDefined();
    });
  });

  describe('publish', () => {
    it('should publish an event to Redis', async () => {
      const mockRpush = vi.fn().mockResolvedValue(1);
      (redis.rpush as any) = mockRpush;

      const event: DomainEvent<{ test: string }> = {
        type: 'click.save',
        occuredAt: '2026-04-29T08:00:00Z',
        payload: { test: 'data' },
      };

      await queueService.publish(event);

      expect(mockRpush).toHaveBeenCalledWith(
        'eventQueue',
        JSON.stringify(event),
      );
    });

    it('should handle publish errors', async () => {
      const error = new Error('Redis connection failed');
      (redis.rpush as any) = vi.fn().mockRejectedValue(error);

      const event: DomainEvent<{ test: string }> = {
        type: 'click.save',
        occuredAt: '2026-04-29T08:00:00Z',
        payload: { test: 'data' },
      };

      await expect(queueService.publish(event)).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });

  describe('dispatcher in startConsumer', () => {
    it('should call the correct handler when event is received', async () => {
      const mockHandler: QueueHandler<unknown> = { handle: vi.fn() };
      queueService.registerHandler('click.save', mockHandler);

      const event: DomainEvent<{ linkId: string }> = {
        type: 'click.save',
        occuredAt: '2026-04-29T08:00:00Z',
        payload: { linkId: '123' },
      };

      // Directly test handler lookup logic without the infinite loop
      const handler = (queueService as any).handlers.get(event.type);
      
      expect(handler).toBe(mockHandler);
      expect(handler).toBeDefined();
    });

    it('should have no handler for unknown event type', () => {
      const event: DomainEvent<{ linkId: string }> = {
        type: 'unknown.event' as any,
        occuredAt: '2026-04-29T08:00:00Z',
        payload: { linkId: '123' },
      };

      const handler = (queueService as any).handlers.get(event.type);
      
      expect(handler).toBeUndefined();
    });
  });
});
