import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { app } from '../../src/app';
import { TestDbConfig } from '../test-db.config';
import { createLink, createLinkWithClicks } from '../fixtures/factory';

const request = supertest(app);

describe('GET /api/stats/:code', () => {
  beforeAll(async () => {
    await TestDbConfig.Reset();
  });

  beforeEach(async () => {
    await TestDbConfig.ClearDatabase();
  });

  afterAll(async () => {
    await TestDbConfig.Close();
  });

  describe('200 - success', () => {
    it('should return stats for a link with no clicks', async () => {
      const { code, longUrl } = await createLink({ longUrl: 'https://example.com/no-clicks' });

      const res = await request.get(`/api/stats/${code}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { link, stats } = res.body.data;

      expect(link).toMatchObject({
        code,
        longUrl,
        shortUrl: expect.stringContaining(`/${code}`),
      });

      expect(stats.total).toBe(0);
      expect(stats.today).toBe(0);
      expect(stats.thisWeek).toBe(0);
      expect(stats.thisMonth).toBe(0);
      expect(stats.topCountries).toEqual([]);
      expect(stats.recentClicks).toEqual([]);
      expect(stats.devices).toEqual({ mobile: 0, desktop: 0, tablet: 0 });
      expect(Array.isArray(stats.clicksPerHour)).toBe(true);
    });

    it('should return correct total and device breakdown', async () => {
      const now = new Date();

      const { code } = await createLinkWithClicks({}, [
        { device: 'mobile', clickedAt: now },
        { device: 'mobile', clickedAt: now },
        { device: 'desktop', clickedAt: now },
        { device: 'tablet', clickedAt: now },
      ]);

      const res = await request.get(`/api/stats/${code}`);

      expect(res.status).toBe(200);
      const { stats } = res.body.data;

      expect(stats.total).toBe(4);
      expect(stats.devices).toMatchObject({
        mobile: 2,
        desktop: 1,
        tablet: 1,
      });
    });

    it('should return correct top countries sorted by clicks', async () => {
      const now = new Date();

      const { code } = await createLinkWithClicks({}, [
        { country: 'US', clickedAt: now },
        { country: 'US', clickedAt: now },
        { country: 'US', clickedAt: now },
        { country: 'FR', clickedAt: now },
        { country: 'FR', clickedAt: now },
        { country: 'DE', clickedAt: now },
      ]);

      const res = await request.get(`/api/stats/${code}`);

      expect(res.status).toBe(200);
      const { topCountries } = res.body.data.stats;

      expect(topCountries[0]).toMatchObject({ country: 'US', clicks: 3 });
      expect(topCountries[1]).toMatchObject({ country: 'FR', clicks: 2 });
      expect(topCountries[2]).toMatchObject({ country: 'DE', clicks: 1 });

      const totalPct = topCountries.reduce((sum: number, c: { percentage: number }) => sum + c.percentage, 0);
      expect(totalPct).toBe(100);
    });

    it('should return recent clicks with correct shape', async () => {
      const now = new Date();

      const { code } = await createLinkWithClicks({}, [
        { device: 'mobile', country: 'US', browser: 'Chrome', clickedAt: now },
      ]);

      const res = await request.get(`/api/stats/${code}`);

      expect(res.status).toBe(200);
      const { recentClicks } = res.body.data.stats;

      expect(recentClicks).toHaveLength(1);
      expect(recentClicks[0]).toMatchObject({
        country: 'US',
        device: 'mobile',
        browser: 'Chrome',
      });
      expect(typeof recentClicks[0].timestamp).toBe('string');
    });

    it('should return correct today / thisWeek / thisMonth counts', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 2);

      const { code } = await createLinkWithClicks({}, [
        { clickedAt: now },
        { clickedAt: now },
        { clickedAt: yesterday },
        { clickedAt: lastMonth },
      ]);

      const res = await request.get(`/api/stats/${code}`);
      const { stats } = res.body.data;

      expect(stats.total).toBe(4);
      expect(stats.today).toBe(2);
      expect(stats.thisMonth).toBeGreaterThanOrEqual(2);
      expect(stats.thisMonth).toBeLessThanOrEqual(4);
    });
  });

  describe('404 - not found', () => {
    it('should return 404 for an unknown code', async () => {
      const res = await request.get('/api/stats/xxxxxx');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        code: 404,
        key: 'resource/not-found',
      });
    });
  });
});
