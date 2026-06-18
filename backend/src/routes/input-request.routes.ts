import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { InputRequestController } from '../controllers/input-request.controller';
import { inputRequestSchema, inputRequestReviewSchema } from '../validation/schemas';

const router = Router();

router.get('/pending-count', authenticate, authorize('cooperative'), InputRequestController.pendingCount);
router.get('/', authenticate, authorize('farmer', 'cooperative', 'admin'), InputRequestController.list);
router.post('/', authenticate, authorize('farmer'), validate(inputRequestSchema), InputRequestController.create);
router.patch('/:id/review', authenticate, authorize('cooperative'), validate(inputRequestReviewSchema), InputRequestController.review);

export default router;
