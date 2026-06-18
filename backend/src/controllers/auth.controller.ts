// ============================================================
// controllers/auth.controller.ts
//
// Extracted from: controllers/index.ts (AuthController section)
// WHY: The original controllers/index.ts was a 350+ line file
// containing 6 different controller objects. Splitting by domain
// means each file has a single clear purpose, is independently
// readable, and is easier to maintain.
//
// LOGIC: Unchanged from original. Only the file structure changed.
// ============================================================

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export const AuthController = {
  getRegistrationCooperatives: async (_req: Request, res: Response) => {
    try {
      const coops = await AuthService.getRegistrationCooperatives();
      sendSuccess(res, 'Cooperatives for registration retrieved', coops);
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const fileMap = {
        national_id_doc: files?.national_id_doc?.[0],
        authorization_letter: files?.authorization_letter?.[0],
      };
      const user = await AuthService.register(req.body, fileMap);
      const msg = user.role === 'farmer'
        ? 'Registration submitted. Awaiting cooperative leader approval.'
        : user.role === 'cooperative'
          ? 'Registration submitted. Awaiting administrator approval.'
          : 'Registration submitted successfully. Awaiting admin approval.';
      sendSuccess(res, msg, { user }, 201);
    } catch (err: any) {
      sendError(res, err.message, err.message.includes('already') ? 409 : 400);
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const result = await AuthService.login(req.body);
      sendSuccess(res, 'Login successful', result);
    } catch (err: any) {
      sendError(res, err.message, 401);
    }
  },

  refreshToken: async (req: Request, res: Response) => {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) return sendError(res, 'Refresh token required', 400);
      const tokens = await AuthService.refreshTokens(refresh_token);
      sendSuccess(res, 'Token refreshed', tokens);
    } catch (err: any) {
      sendError(res, err.message, 401);
    }
  },

  logout: async (req: AuthenticatedRequest, res: Response) => {
    try {
      await AuthService.logout(req.body.refresh_token);
      sendSuccess(res, 'Logged out successfully');
    } catch (err: any) {
      sendError(res, err.message);
    }
  },

  getProfile: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await AuthService.getProfile(req.user!.userId);
      sendSuccess(res, 'Profile retrieved', profile);
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  },

  changePassword: async (req: AuthenticatedRequest, res: Response) => {
    try {
      await AuthService.changePassword(
        req.user!.userId,
        req.body.current_password,
        req.body.new_password,
      );
      sendSuccess(res, 'Password changed successfully');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  },
};
