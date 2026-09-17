import amqp from 'amqplib';
import { config } from '../config';
import { logger } from '@quickserve/shared-utils';
import { OrderService } from '../services/order.service';
import { OrderStatus } from '../generated/prisma-client';

export class OrderStatusConsumer {
  private static connection: any = null;
  private static channel: any = null;
  private static readonly EXCHANGE_NAME = 'quickserve.events';
  private static readonly QUEUE_NAME = 'order-service.status.queue';

  public static async initialize(): Promise<void> {
    try {
      this.connection = await amqp.connect(config.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.EXCHANGE_NAME, 'topic', { durable: true });
      await this.channel.assertQueue(this.QUEUE_NAME, { durable: true });
      await this.channel.bindQueue(this.QUEUE_NAME, this.EXCHANGE_NAME, 'order.preparing');
      await this.channel.bindQueue(this.QUEUE_NAME, this.EXCHANGE_NAME, 'order.ready');

      logger.info(`OrderStatusConsumer bound to '${this.QUEUE_NAME}'`);

      const orderService = new OrderService();

      this.channel.consume(this.QUEUE_NAME, (msg: any) => {
        if (!msg) return;

        void (async (): Promise<void> => {
          try {
            const routingKey = msg.fields.routingKey as string;
            const payload = JSON.parse(msg.content.toString()) as { orderId: string };

            const targetStatus: OrderStatus | null =
              routingKey === 'order.preparing' ? OrderStatus.PREPARING :
              routingKey === 'order.ready' ? OrderStatus.READY :
              null;

            if (!targetStatus) {
              this.channel?.ack(msg);
              return;
            }

            try {
              await orderService.updateOrderStatus(payload.orderId, targetStatus);
              logger.info(
                { orderId: payload.orderId, targetStatus },
                'Order status updated from kitchen event',
              );
            } catch (err) {
              logger.warn(
                { err, orderId: payload.orderId, routingKey },
                'Status transition skipped',
              );
            }

            this.channel?.ack(msg);
          } catch (err) {
            logger.error({ err }, 'OrderStatusConsumer handler failed');
            this.channel?.nack(msg, false, false);
          }
        })();
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize OrderStatusConsumer');
      setTimeout(() => void this.initialize(), 5000);
    }
  }
}
