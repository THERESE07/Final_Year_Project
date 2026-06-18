// ============================================================
// controllers/notification.controller.ts
//
// Extracted from: controllers/index.ts (NotificationController)
// ============================================================

import { Response } from 'express';
import { Notification } from '../models/associations';
import { sendSuccess, sendError, buildPagination } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export const NotificationController = {
  /** GET /notifications — returns paginated notifications for the logged-in user */
  getMyNotifications: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const pageNum  = Number(req.query.page  ?? 1);
      const limitNum = Number(req.query.limit ?? 20);
      const offset   = (pageNum - 1) * limitNum;

      const { count, rows } = await Notification.findAndCountAll({
        where:  { user_id: req.user!.userId },
        limit:  limitNum,
        offset,
        order:  [['created_at', 'DESC']],
      });

      sendSuccess(
        res,
        'Notifications retrieved',
        rows,
        200,
        buildPagination(pageNum, limitNum, count),
      );
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /** PATCH /notifications/:id/read */
  markRead: async (req: AuthenticatedRequest, res: Response) => {
    try {
      await Notification.update(
        { is_read: true },
        { where: { id: req.params.id, user_id: req.user!.userId } },
      );
      sendSuccess(res, 'Notification marked as read');
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /** PATCH /notifications/mark-all-read */
  markAllRead: async (req: AuthenticatedRequest, res: Response) => {
    try {
      await Notification.update(
        { is_read: true },
        { where: { user_id: req.user!.userId, is_read: false } },
      );
      sendSuccess(res, 'All notifications marked as read');
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /** GET /notifications/unread-count */
  getUnreadCount: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const count = await Notification.count({
        where: { user_id: req.user!.userId, is_read: false },
      });
      sendSuccess(res, 'Unread count', { count });
    } catch (err: any) {
      sendError(res, err.message);
    }
  },
};
