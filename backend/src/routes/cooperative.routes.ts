// ============================================================
// routes/cooperative.routes.ts
// ============================================================

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { CooperativeController } from '../controllers/cooperative.controller';
import { cooperativeSchema, farmerReviewSchema } from '../validation/schemas';

const router = Router();

router.get('/stats', authenticate, CooperativeController.getStats);
router.get('/pending-farmers/count', authenticate, authorize('cooperative'), CooperativeController.getPendingFarmersCount);
router.get('/pending-farmers', authenticate, authorize('cooperative'), CooperativeController.getPendingFarmers);
router.patch('/farmers/:userId/review', authenticate, authorize('cooperative'), validate(farmerReviewSchema), CooperativeController.reviewFarmer);
router.get('/', authenticate, CooperativeController.getAll);
router.post('/', authenticate, authorize('admin'), validate(cooperativeSchema), CooperativeController.create);
router.put('/:id', authenticate, authorize('admin'), validate(cooperativeSchema.partial()), CooperativeController.update);
router.get('/:id/farmers', authenticate, CooperativeController.getFarmers);

export default router;
