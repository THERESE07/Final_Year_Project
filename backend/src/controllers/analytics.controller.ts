// ============================================================
// controllers/analytics.controller.ts
//
// Extracted from: controllers/index.ts (AnalyticsController)
// Thin controller — all logic lives in AnalyticsService.
// ============================================================

import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export const AnalyticsController = {
  /** GET /analytics/public — no auth (landing page) */
  publicStats: async (_req: Request, res: Response) => {
    try {
      const data = await AnalyticsService.getPublicStats();
      sendSuccess(res, 'Public statistics retrieved', data);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /** GET /analytics/admin — admin only */
  adminDashboard: async (_req: Request, res: Response) => {
    try {
      const data = await AnalyticsService.getAdminDashboard();
      sendSuccess(res, 'Admin dashboard data retrieved', data);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /** GET /analytics/farmer — farmer only (uses JWT userId) */
  farmerDashboard: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await AnalyticsService.getFarmerDashboard(req.user!.userId);
      sendSuccess(res, 'Farmer dashboard data retrieved', data);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /** GET /analytics/cooperative — cooperative only */
  cooperativeDashboard: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await AnalyticsService.getCooperativeDashboard(req.user!.userId);
      sendSuccess(res, 'Cooperative dashboard data retrieved', data);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /** GET /analytics/beneficiaries — admin & cooperative */
  beneficiaries: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await AnalyticsService.getBeneficiaries(req.query, req.user!.userId, req.user!.role);
      sendSuccess(res, 'Beneficiaries retrieved', result.data, 200, result.pagination);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  /** GET /analytics/subsidy-analytics — admin only */
  subsidyAnalytics: async (_req: Request, res: Response) => {
    try {
      const data = await AnalyticsService.getSubsidyAnalytics();
      sendSuccess(res, 'Subsidy analytics retrieved', data);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },
};
