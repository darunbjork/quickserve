import { Request, Response, NextFunction } from 'express';

type AsyncExpressRoute = (req: Request, res: Response, next: NextFunction) => Promise<void | Response>;

// WHY: Express 4.x does not automatically catch unhandled Promise rejections. 
// ! Without this Higher Order Function, a rejected DB query in a controller will hang 
// the client's request until a timeout occurs, instead of falling through to the error handler.
// This completely eliminates the need to write try/catch blocks in our controllers.
export const asyncHandler = (fn: AsyncExpressRoute) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};