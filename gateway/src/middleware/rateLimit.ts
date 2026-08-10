import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { config } from '../config';

// * WHY: Gateway instances are meant to be ephemeral and scale horizontally.
// If rate limit counters were stored in Node's memory, users could bypass limits by 
// hitting different gateway replicas. Centralizing this state in Redis enforces global limits.
const redisClient = new Redis(config.REDIS_URL);

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    // Use apply to avoid TypeScript spread-tuple errors when forwarding args
    // Cast the returned promise to any to satisfy the expected SendCommandFn signature
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