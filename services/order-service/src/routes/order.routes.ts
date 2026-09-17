import { randomUUID } from 'crypto';
import { Router, Request, Response } from 'express';
import { asyncHandler } from '@quickserve/shared-utils';
import { OrderService } from '../services/order.service';
import { MenuClient } from '../clients/menu.client';
import { OrderStatus } from '../generated/prisma-client';

const orderService = new OrderService();
export const orderRouter = Router();

orderRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const headerUserId = req.headers['x-user-id'] as string | undefined;
    const correlationId = req.headers['x-correlation-id'] as string | undefined;
    const customerId = headerUserId ?? `guest-${correlationId ?? randomUUID()}`;
    const rawItems = req.body.items as Array<{ productId: string; quantity: number }>;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'items must be a non-empty array' },
      });
      return;
    }

    const enriched = await Promise.all(
      rawItems.map(async (item) => {
        const menu = await MenuClient.lookupBySku(item.productId);
        if (!menu) return null;
        return {
          productId: menu.sku,
          name: menu.name,
          quantity: item.quantity,
          unitPrice: menu.unitPrice,
        };
      })
    );

    const missing = rawItems.filter((_, index) => enriched[index] === null);
    if (missing.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Unknown menu item(s): ${missing.map((item) => item.productId).join(', ')}`,
        },
      });
      return;
    }

    const items = enriched.filter((item): item is NonNullable<typeof item> => item !== null);

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