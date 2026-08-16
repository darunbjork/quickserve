import express from 'express';
import { config } from './config';
import { logger } from '@quickserve/shared-utils';
import { orderRouter } from './routes/order.routes';
import { OrderEventPublisher } from './events/order.publisher';

const app = express();
app.use(express.json());

app.get('/health/live', (_req, res) => res.status(200).send('OK'));
app.get('/health/ready', (_req, res) => res.status(200).send('OK'));

app.use('/api/orders', orderRouter);
app.use('/', orderRouter);

const start = async () => {
  await OrderEventPublisher.initialize();

  const server = app.listen(config.PORT, () => {
    logger.info(`Order Service running on port ${config.PORT}`);
  });

  const shutdown = () => {
    logger.info('SIGTERM received: shutting down Order Service');
    server.close(() => {
      logger.info('Order Service closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start();