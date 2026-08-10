import { Request, Response, NextFunction } from 'express';

type AsyncExpressRoute = (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;
export const asyncHandler = (fn: AsyncExpressRoute) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};