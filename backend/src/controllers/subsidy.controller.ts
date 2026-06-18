// ============================================================
// controllers/subsidy.controller.ts
//
// Extracted from: controllers/index.ts (SubsidyController)
// Delegates all business logic to SubsidyService.
// ============================================================

import { Request, Response } from 'express';
import { SubsidyService } from '../services/subsidy.service';
import { SubsidyProgram } from '../models/associations';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export const SubsidyController = {
  /**
   * POST /subsidies/programs
   * Admin only — create a new subsidy program.
   */
  createProgram: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const program = await SubsidyService.createProgram(req.body, req.user!.userId);
      sendSuccess(res, 'Subsidy program created', program, 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  /**
   * GET /subsidies/programs
   * All authenticated users — list programs with optional filters.
   */
  getPrograms: async (req: Request, res: Response) => {
    try {
      const result = await SubsidyService.getAllPrograms(req.query);
      sendSuccess(res, 'Programs retrieved', result.data, 200, result.pagination);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /**
   * PUT /subsidies/programs/:id
   * Admin only — update program details.
   */
  updateProgram: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const program = await SubsidyProgram.findByPk(req.params.id);
      if (!program) return sendError(res, 'Program not found', 404);
      await program.update(req.body);
      sendSuccess(res, 'Program updated', program);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /**
   * POST /subsidies/applications
   * Farmers only — submit a subsidy application.
   */
  apply: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const application = await SubsidyService.applyForSubsidy(req.body, req.user!.userId);
      sendSuccess(res, 'Application submitted successfully', application, 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  /**
   * GET /subsidies/applications
   * Role-aware: farmers see only their own; admin/cooperative see all.
   */
  getApplications: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await SubsidyService.getApplications(
        req.query,
        req.user?.userId,
        req.user?.role,
      );
      sendSuccess(res, 'Applications retrieved', result.data, 200, result.pagination);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /**
   * PATCH /subsidies/applications/:id/review
   * Admin/Cooperative — approve or reject an application.
   */
  review: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { action, ...data } = req.body;
      const application = await SubsidyService.reviewApplication(
        req.params.id,
        action,
        data,
        req.user!.userId,
      );
      sendSuccess(res, `Application ${action}d successfully`, application);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  /**
   * PATCH /subsidies/applications/:id/disburse
   * Admin only — record a disbursement payment.
   */
  disburse: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await SubsidyService.disburse(req.params.id, req.body, req.user!.userId);
      sendSuccess(res, 'Disbursement recorded', result);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },
};
