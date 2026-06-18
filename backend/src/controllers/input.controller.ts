// ============================================================
// controllers/input.controller.ts
//
// Extracted from: controllers/index.ts (InputController)
// Handles: Agricultural inputs CRUD + Input distributions
// ============================================================

import { Request, Response } from 'express';
import { InputCategory } from '../models/associations';
import { InputService } from '../services/input.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export const InputController = {
  // ── Agricultural Inputs ─────────────────────────────────────

  /** GET /inputs — all authenticated users */
  getAll: async (req: Request, res: Response) => {
    try {
      const result = await InputService.getAll(req.query);
      sendSuccess(res, 'Inputs retrieved', result.data, 200, result.pagination);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /** POST /inputs — admin or cooperative */
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const input = await InputService.create(req.body, req.user!.userId);
      sendSuccess(res, 'Input created', input, 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  /** PUT /inputs/:id — admin or cooperative */
  update: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const input = await InputService.update(req.params.id, req.body);
      sendSuccess(res, 'Input updated', input);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  /** GET /inputs/low-stock — admin or cooperative */
  getLowStock: async (_req: Request, res: Response) => {
    try {
      const items = await InputService.getLowStockAlerts();
      sendSuccess(res, 'Low stock items retrieved', items);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  // ── Categories ──────────────────────────────────────────────

  /** GET /inputs/categories */
  getCategories: async (_req: Request, res: Response) => {
    try {
      const categories = await InputCategory.findAll({ order: [['name', 'ASC']] });
      sendSuccess(res, 'Categories retrieved', categories);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /** POST /inputs/categories — admin only */
  createCategory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const cat = await InputCategory.create(req.body);
      sendSuccess(res, 'Category created', cat, 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  // ── Distributions ───────────────────────────────────────────

  /** GET /distributions/farmers — farmers eligible for distribution */
  getFarmersForDistribution: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const farmers = await InputService.getFarmersForDistribution(
        req.user?.userId,
        req.user?.role,
      );
      sendSuccess(res, 'Farmers for distribution retrieved', farmers);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /** GET /distributions — role-aware (farmers see own only) */
  getDistributions: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await InputService.getDistributions(
        req.query,
        req.user?.userId,
        req.user?.role,
      );
      sendSuccess(res, 'Distributions retrieved', result.data, 200, result.pagination);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /** POST /distributions — admin or cooperative */
  createDistribution: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dist = await InputService.createDistribution(
        req.body,
        req.user!.userId,
        req.user!.role,
      );
      sendSuccess(res, 'Distribution created', dist, 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  /** PATCH /distributions/:id/approve — admin or cooperative */
  approveDistribution: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dist = await InputService.approveDistribution(req.params.id, req.user!.userId, req.user!.role);
      sendSuccess(res, 'Distribution approved and processed', dist);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },
};
