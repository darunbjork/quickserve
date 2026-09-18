import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '@quickserve/shared-utils';
import { KitchenService } from '../services/kitchen.service';

export const kitchenRouter = Router();

kitchenRouter.get(
  '/orders',
  asyncHandler(async (_req: Request, res: Response) => {
    const orders = KitchenService.listActive();
    res.status(200).json({ success: true, data: orders });
  }),
);

kitchenRouter.post(
  '/orders/:orderId/ready',
  asyncHandler(async (req: Request, res: Response) => {
    await KitchenService.markReady(req.params.orderId);
    res.status(200).json({
      success: true,
      data: { orderId: req.params.orderId, status: 'READY' },
    });
  }),
);

kitchenRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const orders = KitchenService.listActive();
    res.status(200).json({ success: true, data: orders });
  }),
);
