import { JwtPayload } from '@quickserve/shared-types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      correlationId: string;
    }
  }
}