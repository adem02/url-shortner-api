import { beforeEach, describe, expect, it, vi } from 'vitest';

import Logger from '../../src/config/logger.config';
import { SaveClickHandler } from '../../src/handlers/save-click.handler';
import { ClickRepository } from '../../src/repositories/click.repository';
import { SaveClickDataPayload } from '../../src/types/click.types';
import { DomainEvent } from '../../src/types/queue.types';

vi.mock('../../src/config/logger.config', () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SaveClickHandler', () => {
  let clickRepoMock: Pick<ClickRepository, 'create'>;
  let handler: SaveClickHandler;

  const clickedAt = new Date('2026-04-29T10:00:00.000Z');
  const payload: SaveClickDataPayload = {
    linkId: 'link-123',
    country: 'GN',
    device: 'mobile',
    browser: 'Chrome',
    clickedAt,
  };

  const event: DomainEvent<SaveClickDataPayload> = {
    type: 'click.save',
    occuredAt: '2026-04-29T10:00:00.000Z',
    payload,
  };

  beforeEach(() => {
    clickRepoMock = {
      create: vi.fn().mockResolvedValue(undefined),
    };

    handler = new SaveClickHandler(clickRepoMock as ClickRepository);
  });

  it('should save click payload via repository', async () => {
    await handler.handle(event);

    expect(Logger.debug).toHaveBeenCalledWith(
      `[SaveClickHandler] Handling click.save event for linkId ${payload.linkId} at ${payload.clickedAt.toISOString()}`,
    );
    expect(clickRepoMock.create).toHaveBeenCalledWith({
      linkId: payload.linkId,
      country: payload.country,
      device: payload.device,
      browser: payload.browser,
      clickedAt: expect.any(Date),
    });

    const savedArg = (clickRepoMock.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as SaveClickDataPayload;
    expect(savedArg.clickedAt.toISOString()).toBe(clickedAt.toISOString());
  });

  it('should normalize clickedAt when payload comes as ISO string', async () => {
    const stringEvent = {
      ...event,
      payload: {
        ...payload,
        clickedAt: clickedAt,
      },
    } as DomainEvent<SaveClickDataPayload>;

    await handler.handle(stringEvent);

    expect(clickRepoMock.create).toHaveBeenCalledWith({
      linkId: payload.linkId,
      country: payload.country,
      device: payload.device,
      browser: payload.browser,
      clickedAt: expect.any(Date),
    });

    const savedArg = (clickRepoMock.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as SaveClickDataPayload;
    expect(savedArg.clickedAt.toISOString()).toBe(clickedAt.toISOString());
  });

  it('should log error when repository save fails', async () => {
    (clickRepoMock.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('db unavailable'),
    );

    await expect(handler.handle(event)).resolves.toBeUndefined();

    expect(Logger.error).toHaveBeenCalledWith(
      `[SaveClickHandler] Failed to save click data for linkId ${payload.linkId}: db unavailable`,
    );
  });
});
