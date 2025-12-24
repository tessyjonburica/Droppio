import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  walletAddress: string;
  role: 'viewer' | 'creator';
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload as any, env.JWT_SECRET as any, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload as any, env.JWT_REFRESH_SECRET as any, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};

