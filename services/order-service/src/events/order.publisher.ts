import amqp from 'amqplib';
import { config } from '../config';
import { logger } from '@quickserve/shared-utils';
import { OrderStatus } from '../generated/prisma-client';

export class OrderEventPublisher {
  // ! Use `any` to avoid TypeScript type mismatches with amqplib
  private static connection: any = null;
  private static channel: any = null;
  private static readonly EXCHANGE_NAME = 'quickserve.events';

  public static async initialize(): Promise<void> {
    try {
      this.connection = await amqp.connect(config.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.EXCHANGE_NAME, 'topic', { durable: true });
      logger.info('OrderEventPublisher connected to RabbitMQ exchange');
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize RabbitMQ OrderEventPublisher');
      this.connection = null;
      this.channel = null;
    }
  }

  public static async publishOrderCreated(orderId: string, customerId: string, totalAmount: number): Promise<void> {
    await this.publish('order.created', {
      orderId,
      customerId,
      totalAmount,
      timestamp: new Date().toISOString(),
    });
  }

  public static async publishStatusChanged(orderId: string, previousStatus: OrderStatus, newStatus: OrderStatus): Promise<void> {
    await this.publish('order.status_changed', {
      orderId,
      previousStatus,
      newStatus,
      timestamp: new Date().toISOString(),
    });
  }

  private static async publish(routingKey: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.channel) {
      logger.warn({ routingKey }, 'RabbitMQ channel not ready; skipping domain event publish');
      return;
    }

    const messageBuffer = Buffer.from(JSON.stringify(payload));
    this.channel.publish(this.EXCHANGE_NAME, routingKey, messageBuffer, {
      persistent: true,
      contentType: 'application/json',
    });

    logger.info({ routingKey, payload }, 'Published domain event');
  }
}