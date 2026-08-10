import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// * WHY: In a microservices architecture, a single user click might touch 4 services.
// * By generating a UUID at the absolute edge (here) and attaching it to both the request object 
// * and the HTTP headers (so http-proxy-middleware passes it downstream), we can trace the entire 
// * lifecycle of the request across Datadog/ELK using a single ID.
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const correlationId = req.header('x-correlation-id') || uuidv4();
  req.correlationId = correlationId;
  req.headers['x-correlation-id'] = correlationId; // ? Mutate headers so proxy forwards it
  res.setHeader('x-correlation-id', correlationId); // ? Send back to client for debuggability
  next();
};