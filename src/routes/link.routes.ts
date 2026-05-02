import { Router } from 'express';
import { ShortenLinkController } from '@/controllers/link/shorten-url.controller';
import { ShortenUrlRateLimitMiddleware } from '@/middlewares/shorten-url-rate-limit.middleware';

const router = Router();

router.post('/shorten', ShortenUrlRateLimitMiddleware, ShortenLinkController);

export default router;
