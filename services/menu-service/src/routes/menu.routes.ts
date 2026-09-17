import { Router, Request, Response } from 'express';
import { asyncHandler } from '@quickserve/shared-utils';
import { MenuService } from '../services/menu.service';

const menuService = new MenuService();
export const menuRouter = Router();

menuRouter.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const items = await menuService.listMenu();
    res.status(200).json({
      success: true,
      data: items,
    });
  })
);

menuRouter.get(
  '/:sku',
  asyncHandler(async (req: Request, res: Response) => {
    const item = await menuService.getBySku(req.params.sku);

    if (!item) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Menu item '${req.params.sku}' not found`,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  })
);
