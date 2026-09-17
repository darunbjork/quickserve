import amqp from 'amqplib';
import { config } from '../config';
import { logger } from '@quickserve/shared-utils';
import { NotificationService } from '../services/notification.service';

export class OrderReadyConsumer {
  private static connection: any = null;
  private static channel: any = null;
  private static readonly EXCHANGE_NAME = 'quickserve.events';
  private static readonly QUEUE_NAME = 'notification.order-ready.queue';

  public static async initialize(): Promise<void> {
    try {
      this.connection = await amqp.connect(config.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.EXCHANGE_NAME, 'topic', { durable: true });
      await this.channel.assertQueue(this.QUEUE_NAME, { durable: true });
      await this.channel.bindQueue(this.QUEUE_NAME, this.EXCHANGE_NAME, 'order.ready');
      await this.channel.prefetch(10);

      logger.info(`OrderReadyConsumer bound to '${this.QUEUE_NAME}' (routing: order.ready)`);

      const service = new NotificationService();

      this.channel.consume(this.QUEUE_NAME, (msg: any) => {
        if (!msg) return;

        void (async (): Promise<void> => {
          try {
            const routingKey = msg.fields.routingKey as string;
            const payload = JSON.parse(msg.content.toString()) as {
              orderId: string;
              customerId: string;
            };

            logger.info(
              { routingKey, orderId: payload.orderId },
              'Notification service received order.ready',
            );

            await service.handleOrderReady(payload.orderId, payload.customerId);
            this.channel?.ack(msg);
          } catch (err) {
            logger.error({ err }, 'OrderReadyConsumer handler failed');
            this.channel?.nack(msg, false, false);
          }
        })();
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize OrderReadyConsumer');
      setTimeout(() => void this.initialize(), 5000);
    }
  }
}
