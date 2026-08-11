import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { config } from '../config';

const redisClient = new Redis(config.REDIS_URL);

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false, 
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call.apply(redisClient, args as any) as Promise<any>,
  }),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again after 15 minutes',
    }
  }
});