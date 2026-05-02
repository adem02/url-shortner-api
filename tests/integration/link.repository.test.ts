import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ApiConfig } from '../../src/config/api.config';
import { AppDataSource } from '../../src/config/data-source';
import { LinkRepository } from '../../src/repositories/link.repository';
import { TestDbConfig } from '../test-db.config';

describe('LinkRepository Integration', () => {
  let linkRepository: LinkRepository;

  beforeAll(async () => {
    await TestDbConfig.Reset();
    linkRepository = new LinkRepository();
  });

  beforeEach(async () => {
    await TestDbConfig.ClearDatabase();
  });

  afterAll(async () => {
    await TestDbConfig.Close();
  });

  it('should run in test mode with initialized datasource', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(ApiConfig.isTestMode).toBe(true);
    expect(AppDataSource.isInitialized).toBe(true);
    expect(AppDataSource.options.type).toBe('postgres');
    expect(AppDataSource.options.database).toBe('url_shortener_db_test');
  });

  it('should create a link and find it by code', async () => {
    const createdAt = new Date();

    const id = await linkRepository.create({
      code: 'lnk001',
      longUrl: 'https://example.com/resource',
      createAt: createdAt,
    });

    expect(id).toBeTypeOf('string');

    const saved = await linkRepository.findLinkByCode('lnk001');

    expect(saved).not.toBeNull();
    expect(saved).toMatchObject({
      id,
      code: 'lnk001',
      longUrl: 'https://example.com/resource',
    });
  });

  it('should return false/true on linkExistsByCode based on data state', async () => {
    const before = await linkRepository.linkExistsByCode('lnk002');
    expect(before).toBe(false);

    await linkRepository.create({
      code: 'lnk002',
      longUrl: 'https://example.org',
      createAt: new Date(),
    });

    const after = await linkRepository.linkExistsByCode('lnk002');
    expect(after).toBe(true);
  });

  it('should return null when code does not exist', async () => {
    const result = await linkRepository.findLinkByCode('nope00');
    expect(result).toBeNull();
  });

  it('should throw ApiError when creating a link with a duplicate code', async () => {
    await linkRepository.create({
      code: 'dup001',
      longUrl: 'https://example.com',
      createAt: new Date(),
    });

    await expect(
      linkRepository.create({
        code: 'dup001',
        longUrl: 'https://other.com',
        createAt: new Date(),
      }),
    ).rejects.toMatchObject({ httpCode: 500, errorKey: 'sql/failed' });
  });
});
