import { Router, Request, Response } from 'express';
import { asyncHandler } from '@quickserve/shared-utils';
import { NotificationService } from '../services/notification.service';

const notificationService = new NotificationService();
export const notificationRouter = Router();

notificationRouter.get(
  '/:orderId',
  asyncHandler(async (req: Request, res: Response) => {
    const rows = await notificationService.listForOrder(req.params.orderId);
    res.status(200).json({ success: true, data: rows });
  }),
);
