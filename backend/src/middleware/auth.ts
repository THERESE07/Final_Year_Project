import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { sendError } from '../utils/response';
import { User } from '../models/associations';

export interface AuthRequest extends Request {
  user?: JwtPayload & { dbUser?: any };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'Access token required', 401);
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    // Verify user still exists and is active
    const user = await User.findOne({ where: { id: decoded.userId, status: 'active' } });
    if (!user) {
      sendError(res, 'User account not found or inactive', 401);
      return;
    }
    req.user = { ...decoded, dbUser: user };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'Access token expired', 401);
    } else {
      sendError(res, 'Invalid access token', 401);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions for this action', 403);
      return;
    }
    next();
  };
};

export const auditLog = (action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // Attach audit info to request for logging after response
    (req as any).auditAction = action;
    next();
  };
};
