import { Response } from 'express';
import { AllocationService } from '../services/allocation.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export const AllocationController = {
  createRequest: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const request = await AllocationService.createRequest(req.user!.userId, req.body);
      sendSuccess(res, 'Distribution request submitted to admin', request, 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  listRequests: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await AllocationService.listRequests(req.query, req.user!.userId, req.user!.role);
      sendSuccess(res, 'Distribution requests retrieved', result.data, 200, result.pagination);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  reviewRequest: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { action, feedback, quantity } = req.body;
      const result = await AllocationService.reviewRequest(
        req.user!.userId,
        req.params.id,
        action,
        feedback,
        quantity,
      );
      sendSuccess(res, `Request ${action === 'approve' ? 'approved' : 'rejected'}`, result);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  createDirectAllocation: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allocation = await AllocationService.createDirectAllocation(req.user!.userId, req.body);
      sendSuccess(res, 'Inputs allocated to cooperative', allocation, 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },

  listAllocations: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await AllocationService.listAllocations(req.query, req.user!.userId, req.user!.role);
      sendSuccess(res, 'Allocations retrieved', result.data, 200, result.pagination);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  getInventory: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const inventory = await AllocationService.getCooperativeInventory(req.user!.userId);
      sendSuccess(res, 'Cooperative inventory retrieved', inventory);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },
};
