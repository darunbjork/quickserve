import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ErrorCode, JwtPayload } from '@quickserve/shared-types';
import { AppError } from '@quickserve/shared-utils';

const STUB_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE\n-----END PUBLIC KEY-----`;

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Missing or invalid authorization header', 401, ErrorCode.UNAUTHORIZED));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, STUB_PUBLIC_KEY, { algorithms: ['RS256'] }) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401, ErrorCode.UNAUTHORIZED));
  }
};