import { logger } from '@quickserve/shared-utils';
import { KitchenEventPublisher } from '../events/order.publisher';
import { KdsSocketServer } from '../websocket/kds.socket';

interface ActiveOrder {
  orderId: string;
  customerId: string;
  timer: NodeJS.Timeout;
}

const COOK_TIME_MS = Number(process.env.KITCHEN_COOK_TIME_MS ?? 8000);

export class KitchenService {
  private static readonly activeOrders: Map<string, ActiveOrder> = new Map();

  public static async handleOrderCreated(orderId: string, customerId: string): Promise<void> {
    if (this.activeOrders.has(orderId)) {
      logger.info({ orderId }, 'Order already in kitchen; skipping duplicate order.created');
      return;
    }

    await KitchenEventPublisher.publishOrderPreparing(orderId, customerId);
    KdsSocketServer.broadcast('order.preparing', { orderId, customerId });

    const timer = setTimeout(() => {
      void this.markReady(orderId);
    }, COOK_TIME_MS);

    this.activeOrders.set(orderId, { orderId, customerId, timer });
    logger.info({ orderId, cookTimeMs: COOK_TIME_MS }, 'Order entered kitchen; ready timer scheduled');
  }

  public static async markReady(orderId: string): Promise<void> {
    const active = this.activeOrders.get(orderId);
    if (!active) {
      logger.warn({ orderId }, 'Cannot mark ready: order not tracked in this process');
      return;
    }

    clearTimeout(active.timer);
    this.activeOrders.delete(orderId);

    await KitchenEventPublisher.publishOrderReady(orderId, active.customerId);
    KdsSocketServer.broadcast('order.ready', {
      orderId,
      customerId: active.customerId,
    });

    logger.info({ orderId }, 'Order marked READY');
  }

  public static listActive(): Array<{ orderId: string; customerId: string }> {
    return Array.from(this.activeOrders.values()).map((order) => ({
      orderId: order.orderId,
      customerId: order.customerId,
    }));
  }
}
