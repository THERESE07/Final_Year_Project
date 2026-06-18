import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AllocationController } from '../controllers/allocation.controller';
import {
  coopDistributionRequestSchema,
  coopDistributionRequestReviewSchema,
  directAllocationSchema,
} from '../validation/schemas';

const router = Router();

router.get('/inventory', authenticate, authorize('cooperative'), AllocationController.getInventory);
router.get('/allocations', authenticate, authorize('admin', 'cooperative'), AllocationController.listAllocations);
router.post('/allocations', authenticate, authorize('admin'), validate(directAllocationSchema), AllocationController.createDirectAllocation);
router.get('/requests', authenticate, authorize('admin', 'cooperative'), AllocationController.listRequests);
router.post('/requests', authenticate, authorize('cooperative'), validate(coopDistributionRequestSchema), AllocationController.createRequest);
router.patch('/requests/:id/review', authenticate, authorize('admin'), validate(coopDistributionRequestReviewSchema), AllocationController.reviewRequest);

export default router;
