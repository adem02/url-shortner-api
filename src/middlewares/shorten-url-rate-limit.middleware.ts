import { ApiConfig } from '@/config/api.config';
import { ApiErrorCode } from '@/errors';
import rateLimit from 'express-rate-limit';

export const ShortenUrlRateLimitMiddleware = rateLimit({
  windowMs: ApiConfig.rateLimit.windowMs,
  limit: ApiConfig.rateLimit.limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ApiErrorCode.TooManyRequests,
      message: 'Too many requests. Limit: 20 links per hour per IP.',
      retryAfter: null,
    },
  },
});
