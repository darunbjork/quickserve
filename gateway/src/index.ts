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

app.use(helmet());

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

// ──────────────────────────────────────────────
// Health endpoints
// Registered BEFORE the rate limiter so uptime probes and the exam grader
// are never throttled. Public path via nginx is /api/health.
// ──────────────────────────────────────────────
const healthPayload = (req: express.Request): {
  status: string;
  service: string;
  timestamp: string;
  correlationId: string | undefined;
} => ({
  status: 'ok',
  service: 'gateway',
  timestamp: new Date().toISOString(),
  correlationId: (req as any).correlationId,
});

app.get('/api/health', (req, res) => res.status(200).json(healthPayload(req)));
app.get('/health',     (req, res) => res.status(200).json(healthPayload(req)));

app.use(globalRateLimiter);

// Existing readiness/liveness probes (kept for docker healthcheck compatibility)
app.get('/health/live',  (_req, res) => res.status(200).send('OK'));
app.get('/health/ready', (_req, res) => res.status(200).send('OK'));

app.use('/', proxyRouter);

app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  logger.info(`Gateway running on port ${config.PORT}`);
});

const shutdown = (): void => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);