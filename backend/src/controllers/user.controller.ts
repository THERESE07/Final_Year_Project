// ============================================================
// controllers/user.controller.ts
//
// Extracted from: controllers/index.ts (UserController section)
// Handles: GET /users, PATCH /users/:id/status
// ============================================================

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { User, Farmer, Cooperative, Notification, UserDocument } from '../models/associations';
import { AdminUserReviewService } from '../services/approval.service';
import { sendSuccess, sendError } from '../utils/response';
import { buildPagination } from '../utils/response';
import { AuthenticatedRequest, UserQuery } from '../types';

/** Statuses counted as registration applications for approval workflow */
const APPLICATION_STATUSES = [
  'pending', 'pending_coop_approval', 'pending_admin_approval', 'active', 'rejected',
] as const;

const ADMIN_PENDING_STATUSES = ['pending', 'pending_admin_approval'] as const;

export const UserController = {
  /**
   * GET /users/approval-stats
   * Admin only — aggregate counts for user approval dashboard cards.
   */
  getApprovalStats: async (_req: Request, res: Response) => {
    try {
      const [totalApplications, totalApproved, totalRejected, totalPending] = await Promise.all([
        User.count({ where: { status: { [Op.in]: [...APPLICATION_STATUSES] } } }),
        User.count({ where: { status: 'active' } }),
        User.count({ where: { status: 'rejected' } }),
        User.count({ where: { status: { [Op.in]: [...ADMIN_PENDING_STATUSES] } } }),
      ]);

      sendSuccess(res, 'User approval statistics retrieved', {
        total_applications: totalApplications,
        total_approved: totalApproved,
        total_rejected: totalRejected,
        total_pending: totalPending,
      });
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /**
   * GET /users
   * Admin only — list all users with optional filters.
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, role, status, search } = req.query as UserQuery;
      const pageNum  = Number(page);
      const limitNum = Number(limit);
      const offset   = (pageNum - 1) * limitNum;

      const where: any = {};
      if (role)   where.role   = role;
      if (status) where.status = status;
      if (search) {
        where[Op.or] = [
          { full_name: { [Op.iLike]: `%${search}%` } },
          { email:     { [Op.iLike]: `%${search}%` } },
          { phone:     { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        include: [{
          model: Farmer,
          as: 'farmer_profile',
          include: [{ model: Cooperative, as: 'cooperative', attributes: ['name'] }],
        }, {
          model: UserDocument,
          as: 'documents',
          attributes: ['id', 'document_type', 'file_name', 'file_path', 'mime_type'],
        }, {
          model: Cooperative,
          as: 'registration_cooperative',
          attributes: ['name', 'province', 'district'],
        }],
        attributes: { exclude: ['password_hash', 'pin_hash'] },
        order: [['created_at', 'DESC']],
      });

      sendSuccess(res, 'Users retrieved', rows, 200, buildPagination(pageNum, limitNum, count));
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /**
   * GET /users/:id
   * Admin only — user details with documents.
   */
  getById: async (req: Request, res: Response) => {
    try {
      const user = await AdminUserReviewService.getUserWithDocuments(req.params.id);
      sendSuccess(res, 'User retrieved', user);
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  },

  /**
   * PATCH /users/:id/review
   * Admin only — approve/reject with feedback (coop leaders + legacy pending).
   */
  review: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { action, feedback } = req.body;
      const user = await AdminUserReviewService.reviewUser(
        req.user!.userId,
        req.params.id,
        action,
        feedback,
      );
      sendSuccess(res, `User ${action === 'approve' ? 'approved' : 'rejected'}`, user);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  /**
   * PATCH /users/:id/status
   * Admin only — approve or suspend a user (legacy).
   */
  updateStatus: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, feedback } = req.body;
      const user = await User.findByPk(req.params.id);
      if (!user) return sendError(res, 'User not found', 404);

      const updates: any = { status };
      if (feedback) updates.approval_feedback = feedback;
      if (status === 'active') {
        updates.approved_by = req.user!.userId;
        updates.approved_at = new Date();
      }
      if (status === 'rejected') {
        updates.approved_by = req.user!.userId;
        updates.rejected_at = new Date();
      }

      await user.update(updates);

      if (status === 'active') {
        await Notification.create({
          user_id: user.id,
          title:   'Account Approved',
          message: feedback || 'Your account has been approved! You can now log in.',
          type:    'success',
        } as any);
      }

      sendSuccess(res, 'User status updated', user.toSafeObject());
    } catch (err: any) {
      sendError(res, err.message);
    }
  },
};
