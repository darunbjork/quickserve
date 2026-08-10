import { ErrorCode } from '../errors/error.types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    correlationId: string;
  };
}