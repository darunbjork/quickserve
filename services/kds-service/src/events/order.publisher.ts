import amqp from 'amqplib';
import { config } from '../config';
import { logger } from '@quickserve/shared-utils';

export class KitchenEventPublisher {
  private static connection: any = null;
  private static channel: any = null;
  private static readonly EXCHANGE_NAME = 'quickserve.events';

  public static async initialize(): Promise<void> {
    try {
      this.connection = await amqp.connect(config.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.EXCHANGE_NAME, 'topic', { durable: true });
      logger.info('KitchenEventPublisher connected to RabbitMQ exchange');
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize KitchenEventPublisher');
      this.connection = null;
      this.channel = null;
    }
  }

  public static async publishOrderPreparing(orderId: string, customerId: string): Promise<void> {
    await this.publish('order.preparing', {
      orderId,
      customerId,
      timestamp: new Date().toISOString(),
    });
  }

  public static async publishOrderReady(orderId: string, customerId: string): Promise<void> {
    await this.publish('order.ready', {
      orderId,
      customerId,
      timestamp: new Date().toISOString(),
    });
  }

  private static async publish(routingKey: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.channel) {
      logger.warn({ routingKey }, 'RabbitMQ channel not ready; skipping kitchen event publish');
      return;
    }

    const messageBuffer = Buffer.from(JSON.stringify(payload));
    this.channel.publish(this.EXCHANGE_NAME, routingKey, messageBuffer, {
      persistent: true,
      contentType: 'application/json',
    });

    logger.info({ routingKey, orderId: payload.orderId }, 'Published kitchen domain event');
  }
}
