// ============================================================
// routes/subsidy.routes.ts
// ============================================================

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { SubsidyController } from '../controllers/subsidy.controller';
import {
  subsidyProgramSchema,
  subsidyApplicationSchema,
  subsidyReviewSchema,
  subsidyDisburseSchema,
} from '../validation/schemas';

const router = Router();

// Programs
router.get( '/programs',                 authenticate,                                       SubsidyController.getPrograms);
router.post('/programs',                 authenticate, authorize('admin'), validate(subsidyProgramSchema), SubsidyController.createProgram);
router.put( '/programs/:id',             authenticate, authorize('admin'), validate(subsidyProgramSchema.partial()), SubsidyController.updateProgram);

// Applications
router.get( '/applications',             authenticate,                                       SubsidyController.getApplications);
router.post('/applications',             authenticate, authorize('farmer'), validate(subsidyApplicationSchema), SubsidyController.apply);
router.patch('/applications/:id/review', authenticate, authorize('admin', 'cooperative'), validate(subsidyReviewSchema), SubsidyController.review);
router.patch('/applications/:id/disburse', authenticate, authorize('admin'), validate(subsidyDisburseSchema), SubsidyController.disburse);

export default router;
