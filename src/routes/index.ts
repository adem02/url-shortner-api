import { Router } from 'express';
import { GetApiHealthController } from '@/controllers/health/health.controller'

const router = Router();

router.get('/health', GetApiHealthController);

export default router;
