import { Router, Request, Response } from 'express';
import { asyncHandler } from '@quickserve/shared-utils';
import { UserService } from '../services/user.service.js';
import { ApiResponse } from '@quickserve/shared-types';

const userService = new UserService();
export const userRouter = Router();

// REST route for direct account creation
userRouter.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, role } = req.body;
    const user = await userService.registerUser({ email, password, firstName, lastName, role });

    const response: ApiResponse<{ id: string; email: string; role: string }> = {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    res.status(201).json(response);
  })
);