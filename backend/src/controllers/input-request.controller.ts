import { Response } from 'express';
import { InputRequestService } from '../services/input-request.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export const InputRequestController = {
  create: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const request = await InputRequestService.create(req.user!.userId, req.body);
      sendSuccess(res, 'Input request submitted successfully', request, 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  list: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await InputRequestService.list(req.query, req.user!.userId, req.user!.role);
      sendSuccess(res, 'Input requests retrieved', result.data, 200, result.pagination);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  review: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { action, feedback, quantity } = req.body;
      const result = await InputRequestService.review(
        req.params.id,
        req.user!.userId,
        action,
        feedback,
        quantity,
      );
      sendSuccess(res, `Input request ${action === 'approve' ? 'approved' : 'rejected'}`, result);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  pendingCount: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const count = await InputRequestService.getPendingCountForCoop(req.user!.userId);
      sendSuccess(res, 'Pending input request count', { count });
    } catch (err: any) {
      sendError(res, err.message);
    }
  },
};
