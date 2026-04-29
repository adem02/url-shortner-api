import { Router } from 'express';
import clickRoutes from './click.routes';
import linkRoutes from './link.routes';
import { GetApiHealthController } from '@/controllers/health/health.controller';

const router = Router();

router.get('/api/health', GetApiHealthController);
router.use('/api', linkRoutes);
router.use('/', clickRoutes);

export default router;
