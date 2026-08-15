import { OrderRepository, CreateOrderInput } from '../repositories/order.repository';
import { OrderStateMachine } from '../domain/order.state-machine';
import { OrderEventPublisher } from '../events/order.publisher';
import { AppError } from '@quickserve/shared-utils';
import { ErrorCode } from '@quickserve/shared-types';
import { OrderStatus } from '@prisma/client';

export class OrderService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  public async createOrder(input: CreateOrderInput) {
    if (!input.items || input.items.length === 0) {
      throw new AppError('Order must contain at least one item', 400, ErrorCode.VALIDATION_ERROR);
    }

    const totalAmount = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    const order = await this.orderRepository.create(input, totalAmount);

    await OrderEventPublisher.publishOrderCreated(
      order.id,
      order.customerId,
      Number(order.totalAmount)
    );

    return order;
  }

  public async getOrderById(id: string, requestingUserId: string, requestingUserRole: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404, ErrorCode.NOT_FOUND);
    }

    if (requestingUserRole === 'CUSTOMER' && order.customerId !== requestingUserId) {
      throw new AppError('Forbidden: Access denied to this order', 403, ErrorCode.FORBIDDEN);
    }

    return order;
  }

  public async getCustomerOrders(customerId: string) {
    return this.orderRepository.findByCustomerId(customerId);
  }

  public async updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404, ErrorCode.NOT_FOUND);
    }

    OrderStateMachine.validateTransition(order.status, newStatus);

    const updatedOrder = await this.orderRepository.updateStatus(orderId, newStatus);

    await OrderEventPublisher.publishStatusChanged(orderId, order.status, newStatus);

    return updatedOrder;
  }
}