import { Router } from 'express';
import { ShortenUrlController } from '@/controllers/shortner/shorten-url.controller';

const router = Router();

router.post('/', ShortenUrlController);

export default router;
