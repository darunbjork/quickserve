import { z } from 'zod';
import { validateEnv } from '@quickserve/shared-utils';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3002'),
  MENU_DATABASE_URL: z.string().url(),
});

export const config = validateEnv(envSchema, process.env);
