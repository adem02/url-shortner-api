import { Router } from 'express';
import shortnerRoutes from './shortner.routes';
import { GetApiHealthController } from '@/controllers/health/health.controller';

const router = Router();

router.get('/health', GetApiHealthController);
router.use('/shorten', shortnerRoutes);

export default router;
