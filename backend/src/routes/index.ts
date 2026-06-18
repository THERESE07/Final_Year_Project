// ============================================================
// routes/index.ts  (refactored)
//
// BEFORE: One 100+ line file with every route inline, importing
//         all controllers in one massive import statement.
//
// AFTER:  A clean aggregator that mounts domain-specific routers.
//         Each router lives in its own file and handles one domain.
//
// WHY THIS IMPROVES MAINTAINABILITY:
//   • Adding a new route group = add one import + one app.use()
//   • Finding a route = open the relevant domain file directly
//   • Route file length stays small and scannable
//   • All URL prefixes are visible at a glance here
//
// NOTE: All URL paths are IDENTICAL to the original.
//       The frontend API client requires no changes.
// ============================================================

import { Router } from 'express';
import authRoutes         from './auth.routes';
import userRoutes         from './user.routes';
import cooperativeRoutes  from './cooperative.routes';
import subsidyRoutes      from './subsidy.routes';
import inputRoutes        from './input.routes';
import distributionRoutes from './distribution.routes';
import inputRequestRoutes from './input-request.routes';
import allocationRoutes    from './allocation.routes';
import analyticsRoutes    from './analytics.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/cooperatives',  cooperativeRoutes);
router.use('/subsidies',     subsidyRoutes);
router.use('/inputs',        inputRoutes);
router.use('/distributions', distributionRoutes);
router.use('/input-requests', inputRequestRoutes);
router.use('/allocations',     allocationRoutes);
router.use('/analytics',     analyticsRoutes);
router.use('/notifications', notificationRoutes);

export default router;
