// ============================================================
// controllers/cooperative.controller.ts
//
// Extracted from: controllers/index.ts (CooperativeController)
// Handles: CRUD for cooperatives + farmer listing per cooperative
// ============================================================

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { Cooperative, User, Farmer } from '../models/associations';
import { FarmerApprovalService } from '../services/approval.service';
import { sendSuccess, sendError, buildPagination } from '../utils/response';
import { AuthenticatedRequest, CooperativeQuery } from '../types';

export const CooperativeController = {
  /**
   * GET /cooperatives/stats
   * Aggregate cooperative membership statistics.
   */
  getStats: async (_req: Request, res: Response) => {
    try {
      const [totalCooperatives, activeCooperatives, totalMembers] = await Promise.all([
        Cooperative.count(),
        Cooperative.count({ where: { status: 'active' } }),
        Farmer.count(),
      ]);

      sendSuccess(res, 'Cooperative statistics retrieved', {
        total_cooperatives: totalCooperatives,
        active_cooperatives: activeCooperatives,
        total_members: totalMembers,
      });
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /**
   * GET /cooperatives
   * Accessible to all authenticated users.
   */
  getAll: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, search, province } = req.query as CooperativeQuery;
      const pageNum  = Number(page);
      const limitNum = Number(limit);
      const offset   = (pageNum - 1) * limitNum;

      const where: any = {};
      if (search)   where.name     = { [Op.iLike]: `%${search}%` };
      if (province) where.province = province;

      const { count, rows } = await Cooperative.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT COUNT(*)::int FROM farmers
                WHERE farmers.cooperative_id = "Cooperative"."id"
              )`),
              'farmer_count',
            ],
          ],
        },
        include: [{ model: User, as: 'manager', attributes: ['full_name', 'email', 'phone'] }],
        order: [['name', 'ASC']],
      });

      sendSuccess(res, 'Cooperatives retrieved', rows, 200, buildPagination(pageNum, limitNum, count));
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /**
   * POST /cooperatives
   * Admin only — register a new cooperative.
   */
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const coop = await Cooperative.create(req.body);
      sendSuccess(res, 'Cooperative created', coop, 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  /**
   * PUT /cooperatives/:id
   * Admin only — update cooperative details.
   */
  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const coop = await Cooperative.findByPk(req.params.id);
      if (!coop) return sendError(res, 'Cooperative not found', 404);
      await coop.update(req.body);
      sendSuccess(res, 'Cooperative updated', coop);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /**
   * GET /cooperatives/pending-farmers
   * Cooperative leader — list farmers awaiting approval.
   */
  getPendingFarmers: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await FarmerApprovalService.getPendingFarmers(req.user!.userId, req.query);
      sendSuccess(res, 'Pending farmers retrieved', result.data, 200, result.pagination);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /**
   * GET /cooperatives/pending-farmers/count
   */
  getPendingFarmersCount: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const count = await FarmerApprovalService.getPendingCount(req.user!.userId);
      sendSuccess(res, 'Pending farmers count', { count });
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /**
   * PATCH /cooperatives/farmers/:userId/review
   * Cooperative leader — approve/reject farmer registration.
   */
  reviewFarmer: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { action, feedback } = req.body;
      const user = await FarmerApprovalService.reviewFarmer(
        req.user!.userId,
        req.params.userId,
        action,
        feedback,
      );
      sendSuccess(res, `Farmer ${action === 'approve' ? 'approved' : 'rejected'}`, user);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  /**
   * GET /cooperatives/:id/farmers
   * Lists all farmers belonging to a cooperative.
   */
  getFarmers: async (req: Request, res: Response) => {
    try {
      const farmers = await Farmer.findAll({
        where: { cooperative_id: req.params.id },
        include: [{
          model: User,
          as: 'user',
          attributes: { exclude: ['password_hash', 'pin_hash'] },
        }],
      });
      sendSuccess(res, 'Cooperative farmers retrieved', farmers);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },
};
