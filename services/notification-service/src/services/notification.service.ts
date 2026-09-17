import { logger } from '@quickserve/shared-utils';
import { NotificationRepository, type NotificationDto } from '../repositories/notification.repository';

export class NotificationService {
  private readonly repository = new NotificationRepository();

  async handleOrderReady(orderId: string, customerId: string): Promise<void> {
    const notification = await this.repository.upsert({
      orderId,
      customerId,
      type: 'ORDER_READY',
      message: 'Your order is ready for pickup.',
    });

    logger.info(
      { notificationId: notification.id, orderId, customerId },
      'Notification recorded for order.ready',
    );
  }

  async listForOrder(orderId: string): Promise<NotificationDto[]> {
    return this.repository.findByOrderId(orderId);
  }
}
