import { ApiConfig } from '@/config/api.config';
import { ApiErrorCode } from '@/errors';
import rateLimit from 'express-rate-limit';

export const ShortenUrlRateLimitMiddleware = rateLimit({
  windowMs: ApiConfig.rateLimit.windowMs,
  limit: ApiConfig.rateLimit.limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    code: ApiErrorCode.TooManyRequests,
    key: 'security/rate-limit-exceeded',
    message: 'Too many requests. Limit: 20 links per hour per IP.',
    details: {
      retryAfter: null,
    },
  },
});
