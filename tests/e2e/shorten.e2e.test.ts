import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import { app } from '../../src/app';
import { TestDbConfig } from '../test-db.config';

const request = supertest(app);

describe('POST /api/shorten', () => {
  beforeAll(async () => {
    await TestDbConfig.Reset();
  });

  beforeEach(async () => {
    await TestDbConfig.ClearDatabase();
  });

  afterAll(async () => {
    await TestDbConfig.Close();
  });

  describe('201 - success', () => {
    it('should shorten a valid URL and return the expected shape', async () => {
      const res = await request
        .post('/api/shorten')
        .send({ url: 'https://example.com/some/path' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const { data } = res.body;
      expect(data).toMatchObject({
        code: expect.stringMatching(/^[a-zA-Z0-9]{6}$/),
        shortUrl: expect.stringContaining(`/${data.code}`),
        statsUrl: expect.stringContaining(`/stats/${data.code}`),
        longUrl: 'https://example.com/some/path',
      });
      expect(new Date(data.createdAt)).toBeInstanceOf(Date);
    });

    it('should generate a different code for the same URL submitted twice', async () => {
      const url = 'https://example.com/repeated';

      const res1 = await request.post('/api/shorten').send({ url });
      const res2 = await request.post('/api/shorten').send({ url });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
      expect(res1.body.data.code).not.toBe(res2.body.data.code);
    });
  });

  describe('400 - validation errors', () => {
    const cases = [
      { label: 'missing url field', body: {}, expectedMessage: 'URL cannot be empty' },
      { label: 'empty string', body: { url: '' }, expectedMessage: 'URL cannot be empty' },
      { label: 'no protocol', body: { url: 'example.com' }, expectedMessage: 'URL must start with http:// or https://' },
      { label: 'ftp protocol', body: { url: 'ftp://example.com' }, expectedMessage: 'URL must start with http:// or https://' },
      { label: 'invalid URL format', body: { url: 'https://' }, expectedMessage: 'Invalid URL format' },
      { label: 'blocked domain localhost', body: { url: 'http://localhost/path' }, expectedMessage: 'This domain/IP is not allowed' },
      { label: 'blocked IP 127.0.0.1', body: { url: 'http://127.0.0.1/path' }, expectedMessage: 'This domain/IP is not allowed' },
      { label: 'credentials in URL', body: { url: 'https://user:pass@example.com' }, expectedMessage: 'Credentials in URL are not allowed' },
      { label: 'URL exceeds 2048 chars', body: { url: 'https://example.com/' + 'a'.repeat(2048) }, expectedMessage: 'URL too long (max 2048)' },
    ];

    for (const { label, body, expectedMessage } of cases) {
      it(`should return 400 for ${label}`, async () => {
        const res = await request.post('/api/shorten').send(body);

        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          code: 400,
          key: 'validation/failed',
          message: expect.stringContaining(expectedMessage),
        });
      });
    }
  });
});
