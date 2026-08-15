import { Router, Request, Response } from 'express';
import { asyncHandler } from '@quickserve/shared-utils';
import { OrderService } from '../services/order.service';
import { OrderStatus } from '@prisma/client';

const orderService = new OrderService();
export const orderRouter = Router();

orderRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.headers['x-user-id'] as string;
    const { items } = req.body;

    const order = await orderService.createOrder({ customerId, items });

    res.status(201).json({
      success: true,
      data: order,
    });
  })
);

orderRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const customerId = req.headers['x-user-id'] as string;
    const orders = await orderService.getCustomerOrders(customerId);

    res.json({
      success: true,
      data: orders,
    });
  })
);

orderRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;

    const order = await orderService.getOrderById(req.params.id, userId, userRole);

    res.json({
      success: true,
      data: order,
    });
  })
);

orderRouter.patch(
  '/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body as { status: OrderStatus };

    const order = await orderService.updateOrderStatus(req.params.id, status);

    res.json({
      success: true,
      data: order,
    });
  })
);