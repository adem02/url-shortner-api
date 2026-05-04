# URL Shortner

Full-stack URL shortener with click analytics — shorten a link, track clicks by device, country, and time.

**[→ API Documentation (Swagger)](https://url-shortner-api-production-d05d.up.railway.app/api/docs)**

---

## Stack

**API** — Node.js · TypeScript · Express 5 · PostgreSQL · TypeORM · Redis (cache + async queue) · Vitest · Swagger

---

## How it works

- `POST /api/shorten` → generates a 6-char code, returns the short URL
- `GET /:code` → 302 redirect; click is tracked asynchronously via a Redis queue (non-blocking)
- `GET /api/stats/:code` → click counts (today / week / month / total), clicks per hour, top countries, device breakdown, recent activity — cached in Redis

---

## Run locally

```bash
cd url-shortner-api
cp .env.example .env   # fill in DB + Redis vars
docker compose up --build
```

```bash
# Tests
cd url-shortner-api
npm run test:unit         # services, handlers, validator
npm run test:integration  # repositories, cache
npm run test:e2e          # all 3 routes end-to-end
```
