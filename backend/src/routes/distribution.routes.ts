// ============================================================
// routes/distribution.routes.ts
// ============================================================

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { InputController } from '../controllers/input.controller';
import { distributionSchema } from '../validation/schemas';

const router = Router();

router.get('/farmers',          authenticate, authorize('admin', 'cooperative'), InputController.getFarmersForDistribution);
router.get('/',                 authenticate,                                    InputController.getDistributions);
router.post('/',              authenticate, authorize('cooperative'), validate(distributionSchema), InputController.createDistribution);
router.patch('/:id/approve',  authenticate, authorize('admin', 'cooperative'), InputController.approveDistribution);

export default router;
