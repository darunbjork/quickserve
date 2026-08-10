import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from '@quickserve/shared-utils';
import { correlationIdMiddleware } from './middleware/correlationId';
import { globalRateLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import { proxyRouter } from './routes/proxy';

const app = express();

// Security middleware
app.use(helmet());

// * WHY: Zero CORS wildcard in production. We parse the comma-separated allowed origins list.
// * If an attacker hosts a malicious site, their XHR requests will be blocked by the browser.
const allowedOrigins = config.ALLOWED_ORIGINS.split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(correlationIdMiddleware);
app.use(pinoHttp({ logger, genReqId: (req) => (req as any).correlationId }));
app.use(globalRateLimiter);

//! Health check (used by Nginx to verify gateway is alive)
app.get('/health/live', (req, res) => res.status(200).send('OK'));
app.get('/health/ready', (req, res) => res.status(200).send('OK'));

// Proxy routing to microservices
app.use('/', proxyRouter);

// Global Error Handler (must be registered last)
app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  logger.info(`Gateway running on port ${config.PORT}`);
});

// * WHY: Graceful shutdown. If we receive a SIGTERM from Docker/Kubernetes, we stop accepting 
// * new connections but allow in-flight requests (e.g., a proxy to order-service) to finish.
const shutdown = () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);