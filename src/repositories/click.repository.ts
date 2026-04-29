import { ApiConfig } from '@/config/api.config';
import { AppDataSource } from '@/config/data-source';
import Logger from '@/config/logger.config';
import { ApiError, ApiErrorCode } from '@/errors';
import { Click } from '@/models/Clicks';
import { SaveClickDataPayload } from '@/types/click.types';
import { Repository } from 'typeorm';

export class ClickRepository {
  private readonly clickRepository: Repository<Click>;

  constructor() {
    this.clickRepository = AppDataSource.getRepository(Click);
  }

  async create(data: SaveClickDataPayload): Promise<void> {
    try {
      await this.clickRepository.save({
        link: { id: data.linkId },
        country: data.country,
        device: data.device,
        browser: data.browser,
        clickedAt: data.clickedAt,
      });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';

      if (ApiConfig.isDevMode) {
        Logger.error(`Failed to save click data: ${errMessage}`);
      }

      throw new ApiError(
        ApiErrorCode.InternalServerError,
        'sql/failed',
        'Failed saving click data',
      );
    }
  }
}

export const clickRepository = new ClickRepository();
