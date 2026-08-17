import { OrderStatus } from '../generated/prisma-client';
import { AppError } from '@quickserve/shared-utils';
import { ErrorCode } from '@quickserve/shared-types';

export class OrderStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
    [OrderStatus.READY]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    [OrderStatus.COMPLETED]: [], 
    [OrderStatus.CANCELLED]: [], 
  };

  public static validateTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    if (currentStatus === newStatus) return; 

    const allowed = this.ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new AppError(
        `Invalid order status transition from '${currentStatus}' to '${newStatus}'`,
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }
  }
}