import { Router } from 'express';
import { GetShortenUrlStatsController } from '@/controllers/click/get-shorten-url-stats.controller';
import { RedirectToUrlByCodeController } from '@/controllers/click/redirect-to-url-by-code.controller';

const router = Router();

router.get('/:code', RedirectToUrlByCodeController);
router.get('/api/stats/:code', GetShortenUrlStatsController);

export default router;
