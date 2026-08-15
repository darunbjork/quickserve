import express from 'express';
import { createServer } from 'http';
import { config } from './config';
import { logger } from '@quickserve/shared-utils';
import { KdsSocketServer } from './websocket/kds.socket';
import { OrderEventConsumer } from './events/order.consumer';

const app = express();
app.use(express.json());

app.get('/health/live', (_req, res) => res.status(200).send('OK'));
app.get('/health/ready', (_req, res) => res.status(200).send('OK'));

const httpServer = createServer(app);

KdsSocketServer.initialize(httpServer);

const start = async () => {
  await OrderEventConsumer.initialize();

  httpServer.listen(config.PORT, () => {
    logger.info(`KDS Service running on port ${config.PORT}`);
  });

  const shutdown = () => {
    logger.info('SIGTERM received: shutting down KDS Service');
    httpServer.close(() => {
      logger.info('KDS Service closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start();