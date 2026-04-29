import { ApiConfig } from '@/config/api.config';
import { AppDataSource } from '@/config/data-source';
import Logger from '@/config/logger.config';
import { ApiError, ApiErrorCode } from '@/errors';
import { Link } from '@/models/Links';
import { Link as LinkType } from '@/types/link.types';
import { CreateLinkData } from '@/types/link.types';
import { Repository } from 'typeorm';

export class LinkRepository {
  private readonly linkRepository: Repository<Link>;

  constructor() {
    this.linkRepository = AppDataSource.getRepository(Link);
  }

  async create(data: CreateLinkData): Promise<string> {
    try {
      const link = await this.linkRepository.save({
        code: data.code,
        longUrl: data.longUrl,
        createdAt: data.createAt,
      });

      return link.id;
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';

      if (ApiConfig.isDevMode) {
        Logger.error(`Failed to save link: ${errMessage}`);
      }

      throw new ApiError(ApiErrorCode.InternalServerError, 'sql/failed', 'Failed saving link');
    }
  }

  async linkExistsByCode(code: string): Promise<boolean> {
    try {
      return this.linkRepository.existsBy({ code });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';

      if (ApiConfig.isDevMode) {
        Logger.error(`Failed to find link by code: ${errMessage}`);
      }

      throw new ApiError(
        ApiErrorCode.InternalServerError,
        'sql/failed',
        'Unknown error occurred. Please try again later.',
      );
    }
  }

  async findLongUrlByCode(code: string): Promise<LinkType | null> {
    try {
      const link = await this.linkRepository.findOneBy({ code });

      return link
        ? {
            longUrl: link.longUrl,
            id: link.id,
            code: link.code,
            createdAt: link.createdAt,
          }
        : null;
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';

      if (ApiConfig.isDevMode) {
        Logger.error(`Failed to find link by code: ${errMessage}`);
      }

      throw new ApiError(
        ApiErrorCode.InternalServerError,
        'sql/failed',
        'Unknown error occurred. Please try again later.',
      );
    }
  }
}

export const linkRepository = new LinkRepository();
