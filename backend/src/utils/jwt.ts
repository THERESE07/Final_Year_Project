import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../models/associations';

export interface JwtPayload {
  userId: string;
  role: string;
  email: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  } as any);
};

export const generateRefreshToken = (): string => uuidv4();

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
};

export const saveRefreshToken = async (userId: string, token: string): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await RefreshToken.create({ user_id: userId, token, expires_at: expiresAt });
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await RefreshToken.update({ is_revoked: true }, { where: { token } });
};

export const validateRefreshToken = async (token: string) => {
  const rt = await RefreshToken.findOne({
    where: { token, is_revoked: false },
  });
  if (!rt || rt.expires_at < new Date()) return null;
  return rt;
};
