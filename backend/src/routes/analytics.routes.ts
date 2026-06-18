// ============================================================
// routes/analytics.routes.ts
// ============================================================

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { AnalyticsController } from '../controllers/analytics.controller';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

router.get('/public',      AnalyticsController.publicStats);
router.get('/admin',       authenticate, authorize('admin'),       AnalyticsController.adminDashboard);
router.get('/farmer',      authenticate, authorize('farmer'),      AnalyticsController.farmerDashboard);
router.get('/cooperative', authenticate, authorize('cooperative'), AnalyticsController.cooperativeDashboard);
router.get('/beneficiaries', authenticate, authorize('admin', 'cooperative'), AnalyticsController.beneficiaries);

// These were inline route handlers in the original routes/index.ts — extracted here for consistency
router.get('/subsidy-analytics', authenticate, authorize('admin'), async (_req, res) => {
  try {
    const data = await AnalyticsService.getSubsidyAnalytics();
    sendSuccess(res, 'Subsidy analytics', data);
  } catch (e: any) {
    sendError(res, e.message);
  }
});

router.get('/inventory', authenticate, authorize('admin', 'cooperative'), async (_req, res) => {
  try {
    const data = await AnalyticsService.getInventoryStats();
    sendSuccess(res, 'Inventory stats', data);
  } catch (e: any) {
    sendError(res, e.message);
  }
});

router.get('/audit-logs', authenticate, authorize('admin'), async (req, res) => {
  try {
    const data = await AnalyticsService.getAuditLogs(req.query);
    sendSuccess(res, 'Audit logs', data);
  } catch (e: any) {
    sendError(res, e.message);
  }
});

export default router;
