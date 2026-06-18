// ============================================================
// routes/user.routes.ts
//
// Extracted from: routes/index.ts
// All /users/* endpoints.
// ============================================================

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { UserController } from '../controllers/user.controller';
import { updateUserStatusSchema, userReviewSchema } from '../validation/schemas';

const router = Router();

router.get('/approval-stats', authenticate, authorize('admin'), UserController.getApprovalStats);
router.get('/',              authenticate, authorize('admin'), UserController.getAll);
router.get('/:id',           authenticate, authorize('admin'), UserController.getById);
router.patch('/:id/review',  authenticate, authorize('admin'), validate(userReviewSchema), UserController.review);
router.patch('/:id/status',  authenticate, authorize('admin'), validate(updateUserStatusSchema), UserController.updateStatus);

export default router;
