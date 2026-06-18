// ============================================================
// routes/notification.routes.ts
// ============================================================

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();

// Note: /unread-count and /mark-all-read must come BEFORE /:id
// to prevent Express treating them as an :id param match.
router.get(   '/',               authenticate, NotificationController.getMyNotifications);
router.get(   '/unread-count',   authenticate, NotificationController.getUnreadCount);
router.patch( '/mark-all-read',  authenticate, NotificationController.markAllRead);
router.patch( '/:id/read',       authenticate, NotificationController.markRead);

export default router;
