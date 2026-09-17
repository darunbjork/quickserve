import amqp from 'amqplib';
import { config } from '../config';
import { logger } from '@quickserve/shared-utils';
import { KdsSocketServer } from '../websocket/kds.socket';
import { KitchenService } from '../services/kitchen.service';

export class OrderEventConsumer {
  private static connection: any = null;
  private static channel: any = null;
  private static readonly EXCHANGE_NAME = 'quickserve.events';
  private static readonly QUEUE_NAME = 'kds.orders.queue';

  public static async initialize(): Promise<void> {
    try {
      this.connection = await amqp.connect(config.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.EXCHANGE_NAME, 'topic', { durable: true });
      await this.channel.assertQueue(this.QUEUE_NAME, { durable: true });

      await this.channel.unbindQueue(this.QUEUE_NAME, this.EXCHANGE_NAME, 'order.*');
      await this.channel.bindQueue(this.QUEUE_NAME, this.EXCHANGE_NAME, 'order.created');

      await this.channel.prefetch(10);

      logger.info(`KDS OrderConsumer bound to '${this.QUEUE_NAME}' (routing: order.created)`);

      this.channel.consume(this.QUEUE_NAME, (msg: any) => {
        if (!msg) return;

        void (async (): Promise<void> => {
          try {
            const routingKey = msg.fields.routingKey as string;
            const payload = JSON.parse(msg.content.toString()) as {
              orderId: string;
              customerId: string;
            };

            logger.info({ routingKey, orderId: payload.orderId }, 'KDS received domain event from RabbitMQ');
            KdsSocketServer.broadcast(routingKey, payload);
            await KitchenService.handleOrderCreated(payload.orderId, payload.customerId);
            this.channel?.ack(msg);
          } catch (error) {
            logger.error({ err: error }, 'Error handling order.created in KDS');
            this.channel?.nack(msg, false, false);
          }
        })();
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize RabbitMQ OrderEventConsumer');
      setTimeout(() => this.initialize(), 5000);
    }
  }
}