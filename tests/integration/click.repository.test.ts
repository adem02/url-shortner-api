import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppDataSource } from '../../src/config/data-source';
import { ClickRepository } from '../../src/repositories/click.repository';
import { LinkRepository } from '../../src/repositories/link.repository';
import { TestDbConfig } from '../test-db.config';

describe('ClickRepository Integration', () => {
  let clickRepository: ClickRepository;
  let linkRepository: LinkRepository;
  let linkId: string;

  beforeAll(async () => {
    await TestDbConfig.Reset();
    clickRepository = new ClickRepository();
    linkRepository = new LinkRepository();
  });

  beforeEach(async () => {
    await TestDbConfig.ClearDatabase();

    linkId = await linkRepository.create({
      code: 'tst001',
      longUrl: 'https://example.com',
      createAt: new Date(),
    });
  });

  afterAll(async () => {
    await TestDbConfig.Close();
  });

  it('should have an initialized datasource connected to the test database', () => {
    expect(AppDataSource.isInitialized).toBe(true);
    const opts = AppDataSource.options as { host?: string; database?: string };
    expect(opts.host).toBe(process.env.DB_HOST);
    expect(opts.database).toBe(process.env.DB_NAME);
  });

  it('should persist a click for an existing link', async () => {
    await expect(
      clickRepository.create({
        linkId,
        country: 'GN',
        device: 'mobile',
        browser: 'Chrome',
        clickedAt: new Date(),
      }),
    ).resolves.not.toThrow();
  });

  it('should return correct click metrics after inserting clicks', async () => {
    await clickRepository.create({
      linkId,
      country: 'GN',
      device: 'mobile',
      browser: 'Chrome',
      clickedAt: new Date(),
    });
    await clickRepository.create({
      linkId,
      country: 'CI',
      device: 'desktop',
      browser: 'Firefox',
      clickedAt: new Date(),
    });

    const metrics = await clickRepository.getClicksMetricsByLinkId(linkId);

    expect(metrics).toMatchObject({
      total: 2,
      today: 2,
      thisWeek: 2,
      thisMonth: 2,
    });
  });

  it('should return correct device metrics', async () => {
    await clickRepository.create({ linkId, country: 'GN', device: 'mobile', browser: 'Chrome', clickedAt: new Date() });
    await clickRepository.create({ linkId, country: 'GN', device: 'mobile', browser: 'Chrome', clickedAt: new Date() });
    await clickRepository.create({ linkId, country: 'GN', device: 'tablet', browser: 'Safari', clickedAt: new Date() });

    const devices = await clickRepository.getDevicesMetricsByLinkId(linkId);

    expect(devices).toMatchObject({
      mobile: 2,
      tablet: 1,
      desktop: 0,
    });
  });

  it('should return country clicks with correct percentages', async () => {
    await clickRepository.create({ linkId, country: 'GN', device: 'mobile', browser: 'Chrome', clickedAt: new Date() });
    await clickRepository.create({ linkId, country: 'GN', device: 'mobile', browser: 'Chrome', clickedAt: new Date() });
    await clickRepository.create({ linkId, country: 'CI', device: 'desktop', browser: 'Firefox', clickedAt: new Date() });

    const countries = await clickRepository.getCountryClicksByLinkId(linkId);

    expect(countries).toHaveLength(2);
    const gn = countries.find((c) => c.country === 'GN');
    const ci = countries.find((c) => c.country === 'CI');
    expect(gn).toMatchObject({ clicks: 2, percentage: 67 });
    expect(ci).toMatchObject({ clicks: 1, percentage: 33 });
  });

  it('should return the 5 most recent clicks ordered by date desc', async () => {
    for (let i = 0; i < 6; i++) {
      await clickRepository.create({
        linkId,
        country: 'GN',
        device: 'mobile',
        browser: 'Chrome',
        clickedAt: new Date(Date.now() + i * 1000),
      });
    }

    const recentClicks = await clickRepository.getRecentClicksByLinkId(linkId);

    expect(recentClicks).toHaveLength(5);
    expect(recentClicks[0]).toMatchObject({ country: 'GN', device: 'mobile', browser: 'Chrome' });
  });

  it('should return empty arrays/zero metrics for a link with no clicks', async () => {
    const metrics = await clickRepository.getClicksMetricsByLinkId(linkId);
    const devices = await clickRepository.getDevicesMetricsByLinkId(linkId);
    const countries = await clickRepository.getCountryClicksByLinkId(linkId);
    const recentClicks = await clickRepository.getRecentClicksByLinkId(linkId);

    expect(metrics).toMatchObject({ total: 0, today: 0, thisWeek: 0, thisMonth: 0 });
    expect(devices).toMatchObject({ mobile: 0, tablet: 0, desktop: 0 });
    expect(countries).toHaveLength(0);
    expect(recentClicks).toHaveLength(0);
  });
});
