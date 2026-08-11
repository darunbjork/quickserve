import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = req.header('x-correlation-id') || uuidv4();
  req.correlationId = correlationId;
  req.headers['x-correlation-id'] = correlationId; // ? Mutate headers so proxy forwards it
  res.setHeader('x-correlation-id', correlationId); // ? Send back to client for debuggability
  next();
};