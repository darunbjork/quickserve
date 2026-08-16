import { Request, Response, NextFunction } from 'express';
import jwt, { JwtHeader, SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { AppError } from '@quickserve/shared-utils';
import { ErrorCode, UserRole } from '@quickserve/shared-types';
import { config } from '../config';

const jwks = jwksClient({
  jwksUri: config.JWKS_URI,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000,
  rateLimit: true,
  jwksRequestsPerMinute: 10, 
});

function getKey(header: JwtHeader, callback: SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error('JWT header missing key ID (kid)'));
  }

  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export interface AuthenticatedPayload {
  sub: string;
  email: string;
  role: UserRole;
  iss: string;
}

export const authenticateJwt = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Missing or malformed Authorization header', 401, ErrorCode.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ['RS256'],
      issuer: config.JWT_ISSUER,
    },
    (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return next(new AppError('Access token expired', 401, ErrorCode.TOKEN_EXPIRED));
        }
        return next(new AppError('Invalid access token signature or claims', 401, ErrorCode.UNAUTHORIZED));
      }

      const payload = decoded as AuthenticatedPayload;
      req.user = payload; 
      req.headers['x-user-id'] = payload.sub;
      req.headers['x-user-email'] = payload.email;
      req.headers['x-user-role'] = payload.role;

      next();
    }
  );
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userRole = req.headers['x-user-role'] as UserRole;

    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new AppError(
        'Forbidden: Insufficient permissions to access this resource',
        403,
        ErrorCode.FORBIDDEN
      );
    }

    next();
  };
};