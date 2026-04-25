import dotenv from 'dotenv';
dotenv.config();

export const ApiConfig = {
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
};
