import { z } from 'zod';
import { validateEnv } from '@quickserve/shared-utils';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  REDIS_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'), // ? e.g. "https://quickserve.com,https://admin.quickserve.com"
  AUTH_SERVICE_URL: z.string().url().default('http://auth-service:3001'),
  MENU_SERVICE_URL: z.string().url().default('http://menu-service:3002'),
  ORDER_SERVICE_URL: z.string().url().default('http://order-service:3003'),
  KITCHEN_SERVICE_URL: z.string().url().default('http://kitchen-service:3004'),
  LOYALTY_SERVICE_URL: z.string().url().default('http://loyalty-service:3005'),
  PAYMENT_SERVICE_URL: z.string().url().default('http://payment-service:3006'),
  JWKS_URI: z.string().url().default('http://auth-service:3001/oauth/jwks'),
  JWT_ISSUER: z.string().default('http://localhost:3001/oauth'),
});

export const config = validateEnv(envSchema, process.env);