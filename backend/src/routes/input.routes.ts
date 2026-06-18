// ============================================================
// routes/input.routes.ts
// ============================================================

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { InputController } from '../controllers/input.controller';
import { inputCategorySchema, agriculturalInputSchema } from '../validation/schemas';

const router = Router();

// ── Categories (must come before /:id to avoid routing conflict) ──
router.get( '/categories',    authenticate,                                    InputController.getCategories);
router.post('/categories',    authenticate, authorize('admin'), validate(inputCategorySchema), InputController.createCategory);

// ── Low stock alert ────────────────────────────────────────────────
router.get( '/low-stock',     authenticate, authorize('admin', 'cooperative'), InputController.getLowStock);

// ── Agricultural Inputs CRUD ───────────────────────────────────────
router.get( '/',              authenticate,                                    InputController.getAll);
router.post('/',              authenticate, authorize('admin', 'cooperative'), validate(agriculturalInputSchema), InputController.create);
router.put( '/:id',           authenticate, authorize('admin', 'cooperative'), validate(agriculturalInputSchema.partial()), InputController.update);

export default router;
