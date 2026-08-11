import { Router, Request, Response } from 'express';
import Provider from 'oidc-provider';
import { asyncHandler } from '@quickserve/shared-utils';
import { UserService } from '../services/user.service.js';

const userService = new UserService();

export const createInteractionRouter = (provider: Provider): Router => {
  const router = Router();

  router.get(
    '/:uid',
    asyncHandler(async (req: Request, res: Response) => {
      const details = await provider.interactionDetails(req, res);
      res.json({
        success: true,
        data: {
          uid: details.uid,
          prompt: details.prompt,
          params: details.params,
        },
      });
    })
  );

  router.post(
    '/:uid/login',
    asyncHandler(async (req: Request, res: Response) => {
      const { email, password } = req.body;
      const user = await userService.authenticateUser(email, password);

      const result = {
        login: {
          accountId: user.id,
        },
      };

      const redirectTo = await provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
      });

      res.json({ success: true, data: { redirectTo } });
    })
  );

  return router;
};