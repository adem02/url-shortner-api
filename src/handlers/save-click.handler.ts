import { ApiConfig } from '@/config/api.config';
import Logger from '@/config/logger.config';
import { ClickRepository } from '@/repositories/click.repository';
import { SaveClickDataPayload } from '@/types/click.types';
import { DomainEvent, QueueHandler } from '@/types/queue.types';

export class SaveClickHandler implements QueueHandler<DomainEvent<SaveClickDataPayload>> {
  constructor(private readonly clickRepo: ClickRepository) {}

  async handle(event: DomainEvent<SaveClickDataPayload>): Promise<void> {
    const { linkId, country, device, browser, clickedAt } = event.payload;

    try {
      const normalizedClickedAt = clickedAt instanceof Date ? clickedAt : new Date(clickedAt);

      if (!ApiConfig.isProduction) {
        Logger.debug(
          `[SaveClickHandler] Handling click.save event for linkId ${linkId} at ${normalizedClickedAt.toISOString()}`,
        );
      }

      await this.clickRepo.create({
        linkId,
        country,
        device,
        browser,
        clickedAt: normalizedClickedAt,
      });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error(
        `[SaveClickHandler] Failed to save click data for linkId ${linkId}: ${errMessage}`,
      );
    }
  }
}
