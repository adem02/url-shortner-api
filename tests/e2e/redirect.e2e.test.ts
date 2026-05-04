import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { app } from '../../src/app';
import { TestDbConfig } from '../test-db.config';

const request = supertest(app);

describe('GET /:code', () => {
  beforeAll(async () => {
    await TestDbConfig.Reset();
  });

  beforeEach(async () => {
    await TestDbConfig.ClearDatabase();
  });

  afterAll(async () => {
    await TestDbConfig.Close();
  });

  describe('302 - redirect', () => {
    it('should redirect to the original URL for a valid code', async () => {
      const shortenRes = await request
        .post('/api/shorten')
        .send({ url: 'https://example.com/redirect-target' });

      expect(shortenRes.status).toBe(201);
      const { code } = shortenRes.body.data;

      const res = await request.get(`/${code}`).redirects(0);

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('https://example.com/redirect-target');
    });

    it('should redirect to the correct URL when multiple links exist', async () => {
      const res1 = await request.post('/api/shorten').send({ url: 'https://site-a.com' });
      const res2 = await request.post('/api/shorten').send({ url: 'https://site-b.com' });

      const code1 = res1.body.data.code;
      const code2 = res2.body.data.code;

      const redirect1 = await request.get(`/${code1}`).redirects(0);
      const redirect2 = await request.get(`/${code2}`).redirects(0);

      expect(redirect1.status).toBe(302);
      expect(redirect1.headers.location).toBe('https://site-a.com');

      expect(redirect2.status).toBe(302);
      expect(redirect2.headers.location).toBe('https://site-b.com');
    });

    it('should serve redirect from cache on second request', async () => {
      const shortenRes = await request
        .post('/api/shorten')
        .send({ url: 'https://cached-target.com' });

      const { code } = shortenRes.body.data;

      const first = await request.get(`/${code}`).redirects(0);
      expect(first.status).toBe(302);
      expect(first.headers.location).toBe('https://cached-target.com');

      const second = await request.get(`/${code}`).redirects(0);
      expect(second.status).toBe(302);
      expect(second.headers.location).toBe('https://cached-target.com');
    });
  });

  describe('404 - not found', () => {
    it('should return 404 for an unknown code', async () => {
      const res = await request.get('/xxxxxx');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        code: 404,
        key: 'resource/not-found',
      });
    });

    it('should return 404 for a code that was never created', async () => {
      const res = await request.get('/abc123');

      expect(res.status).toBe(404);
      expect(res.body.key).toBe('resource/not-found');
    });
  });
});
