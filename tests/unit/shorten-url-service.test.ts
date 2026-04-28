import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShortenUrlService } from '../../src/services/shorten-url.service';
import { ApiError } from '../../src/errors';
import { LinkRepository } from '../../src/repositories/link.repository';

function makeMockRepo(overrides: Partial<LinkRepository> = {}): LinkRepository {
  return {
    create: vi.fn().mockResolvedValue('generated-uuid'),
    linkExistsByCode: vi.fn().mockResolvedValue(false),
    ...overrides,
  } as unknown as LinkRepository;
}

describe('ShortenUrlService', () => {
  let mockRepo: LinkRepository;
  let service: ShortenUrlService;

  beforeEach(() => {
    mockRepo = makeMockRepo();
    service = new ShortenUrlService(mockRepo);
  });

  describe('shortenUrl()', () => {
    it('returns a result with the correct shape', async () => {
      const result = await service.shortenUrl('https://example.com');

      expect(result).toMatchObject({
        code: expect.any(String),
        longUrl: 'https://example.com',
        shortUrl: expect.stringContaining(result.code),
        statsUrl: expect.stringContaining(result.code),
        createdAt: expect.any(Date),
      });
    });

    it('generates a code of 6 alphanumeric characters', async () => {
      const result = await service.shortenUrl('https://example.com');
      
      expect(result.code).toMatch(/^[a-zA-Z0-9]{6}$/);
    });

    it('calls repo.create once with the correct data', async () => {
      await service.shortenUrl('https://example.com/path');

      expect(mockRepo.create).toHaveBeenCalledOnce();
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          longUrl: 'https://example.com/path',
          code: expect.any(String),
          createAt: expect.any(Date),
        })
      );
    });

    it('retries code generation when first code already exists', async () => {
      vi.mocked(mockRepo.linkExistsByCode)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      
      const result = await service.shortenUrl('https://example.com');

      expect(mockRepo.linkExistsByCode).toHaveBeenCalledTimes(2);
      expect(result.code).toBeDefined();
    });

    it('throws ApiError when all 3 code generation attempts fail', async () => {
      vi.mocked(mockRepo.linkExistsByCode).mockResolvedValue(true);

      await expect(service.shortenUrl('https://example.com')).rejects.toThrow(ApiError);
      await expect(service.shortenUrl('https://example.com')).rejects.toThrow(
        'Failed generating unique code'
      );
    });

    it('does not call repo.create when code generation fails', async () => {
      vi.mocked(mockRepo.linkExistsByCode).mockResolvedValue(true);

      await expect(service.shortenUrl('https://example.com')).rejects.toThrow(ApiError);

      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });
});
