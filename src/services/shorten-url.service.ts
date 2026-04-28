import { ApiConfig } from '@/config/api.config';
import { ApiError, ApiErrorCode } from '@/errors';
import { LinkRepository } from '@/repositories/link.repository';
import { ShortenUrlInterface } from '@/types/shorten-url.types';
import { customAlphabet } from 'nanoid';

export class ShortenUrlService {
  private readonly alphaNumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  constructor(private readonly linkRepo: LinkRepository) {
    this.linkRepo = linkRepo;
  }

  async shortenUrl(url: string): Promise<ShortenUrlInterface> {
    const code = await this.generateUniqueCode();

    if (!code) {
      throw new ApiError(
        ApiErrorCode.ServiceUnavailable,
        'link/code-generation-failed',
        'Failed generating unique code. Please try again later.',
      );
    }

    const data = {
      code,
      longUrl: url,
      createAt: new Date(),
    };

    await this.linkRepo.create(data);

    return {
      code,
      longUrl: data.longUrl,
      shortUrl: `${ApiConfig.baseUrl}/${code}`,
      statsUrl: `${ApiConfig.baseUrl}/stats/${code}`,
      createdAt: data.createAt,
    };
  }

  private async generateUniqueCode(): Promise<string | null> {
    const nanoid = customAlphabet(this.alphaNumeric, 6);
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const code = nanoid();
      const exists = await this.linkRepo.linkExistsByCode(code);

      if (!exists) return code;
    }

    return null;
  }
}
