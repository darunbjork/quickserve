import express from 'express';
import { config } from './config';
import { logger } from '@quickserve/shared-utils';
import { notificationRouter } from './routes/notification.routes';
import { OrderReadyConsumer } from './events/order.consumer';

const app = express();
app.use(express.json());

app.get('/health/live', (_req, res) => res.status(200).send('OK'));
app.get('/health/ready', (_req, res) => res.status(200).send('OK'));

app.use('/', notificationRouter);

const start = async (): Promise<void> => {
  await OrderReadyConsumer.initialize();

  const server = app.listen(config.PORT, () => {
    logger.info(`Notification Service running on port ${config.PORT}`);
  });

  const shutdown = (): void => {
    logger.info('SIGTERM received: shutting down Notification Service');
    server.close(() => {
      logger.info('Notification Service closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

void start();
