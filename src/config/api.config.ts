import dotenv from 'dotenv';
dotenv.config();

export const ApiConfig = {
  isDevMode: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
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
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
  },
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
};
