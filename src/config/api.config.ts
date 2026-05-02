import dotenv from 'dotenv';
dotenv.config();

export const ApiConfig = {
  isDevMode: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTestMode: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT) || 3000,
  environment: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.NODE_ENV !== 'development' ? process.env.CORS_ORIGIN : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
  dbConfig: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 3600000,
    limit: Number(process.env.RATE_LIMIT_MAX) || 20,
  },
};
