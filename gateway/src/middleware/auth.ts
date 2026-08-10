import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ErrorCode, JwtPayload } from '@quickserve/shared-types';
import { AppError } from '@quickserve/shared-utils';

// WHY: This is a deliberate STUB. You rarely build the upstream dependency (auth-service) 
// before the downstream consumer (gateway). We hardcode a dummy public key here so the gateway routes 
// can be tested immediately. We will replace this with JWKS dynamic fetching from auth-service, later.
const STUB_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE\n-----END PUBLIC KEY-----`;

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Missing or invalid authorization header', 401, ErrorCode.UNAUTHORIZED));
  }

  const token = authHeader.split(' ')[1];

  try {
    // * We enforce RS256 algorithm to prevent algorithm downgrade attacks where 
    // * an attacker passes an HMAC token signed with our public key string.
    const decoded = jwt.verify(token, STUB_PUBLIC_KEY, { algorithms: ['RS256'] }) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401, ErrorCode.UNAUTHORIZED));
  }
};