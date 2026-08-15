import amqp from 'amqplib';
import { config } from '../config';
import { logger } from '@quickserve/shared-utils';
import { KdsSocketServer } from '../websocket/kds.socket';

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

      await this.channel.bindQueue(this.QUEUE_NAME, this.EXCHANGE_NAME, 'order.*');

      await this.channel.prefetch(10);

      logger.info(`KDS OrderConsumer bound to queue '${this.QUEUE_NAME}' on exchange '${this.EXCHANGE_NAME}'`);

      this.channel.consume(this.QUEUE_NAME, (msg: any) => {
        if (!msg) return;

        try {
          const routingKey = msg.fields.routingKey;
          const payload = JSON.parse(msg.content.toString());

          logger.info({ routingKey, orderId: payload.orderId }, 'KDS received domain event from RabbitMQ');

          KdsSocketServer.broadcast(routingKey, payload);

          this.channel?.ack(msg);
        } catch (error) {
          logger.error({ err: error }, 'Error parsing or broadcasting domain event');
          this.channel?.nack(msg, false, false);
        }
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize RabbitMQ OrderEventConsumer');
      setTimeout(() => this.initialize(), 5000);
    }
  }
}