import { Router } from 'express';
import { RedirectToUrlByCodeController } from '@/controllers/click/redirect-to-url-by-code.controller';

const router = Router();

router.get('/:code', RedirectToUrlByCodeController);

export default router;
