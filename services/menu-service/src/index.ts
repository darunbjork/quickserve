import express from 'express';
import { config } from './config';
import { logger } from '@quickserve/shared-utils';
import { menuRouter } from './routes/menu.routes';

const app = express();
app.use(express.json());

app.get('/health/live', (_req, res) => res.status(200).send('OK'));
app.get('/health/ready', (_req, res) => res.status(200).send('OK'));

// Gateway rewrites ^/api/menu to '', so requests arrive at '/' and '/:sku'
app.use('/', menuRouter);

const server = app.listen(config.PORT, () => {
  logger.info(`Menu Service running on port ${config.PORT}`);
});

const shutdown = (): void => {
  logger.info('SIGTERM received: shutting down Menu Service');
  server.close(() => {
    logger.info('Menu Service closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
