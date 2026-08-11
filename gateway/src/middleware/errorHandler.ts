import { Request, Response, NextFunction } from 'express';
import { AppError, logger } from '@quickserve/shared-utils';
import { ApiResponse, ErrorCode } from '@quickserve/shared-types';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response<ApiResponse<null>>,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
      meta: { timestamp: new Date().toISOString(), correlationId: req.correlationId },
    });
    return;
  }

  logger.error({ err, correlationId: req.correlationId }, 'Unhandled exception caught by gateway');

  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
    },
    meta: { timestamp: new Date().toISOString(), correlationId: req.correlationId },
  });
};