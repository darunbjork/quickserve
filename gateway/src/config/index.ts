import { z } from 'zod';
import { validateEnv } from '@quickserve/shared-utils';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  REDIS_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'), // ? e.g. "https://quickserve.com,https://admin.quickserve.com"
});

export const config = validateEnv(envSchema, process.env);