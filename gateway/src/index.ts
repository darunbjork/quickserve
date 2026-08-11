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
app.use(globalRateLimiter);

//! Health check (used by Nginx to verify gateway is alive)
app.get('/health/live', (req, res) => res.status(200).send('OK'));
app.get('/health/ready', (req, res) => res.status(200).send('OK'));

app.use('/', proxyRouter);

app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  logger.info(`Gateway running on port ${config.PORT}`);
});

const shutdown = () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);