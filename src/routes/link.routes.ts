import { Router } from 'express';
import { ShortenLinkController } from '@/controllers/link/shorten-url.controller';

const router = Router();

router.post('/shorten', ShortenLinkController);

export default router;
