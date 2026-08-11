import { z } from 'zod';
import { validateEnv } from '@quickserve/shared-utils';

// * WHY: Validates required secrets and URLs at boot time before launching the auth service.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  AUTH_DATABASE_URL: z.string().url(),
  ISSUER_URL: z.string().url().default('http://localhost:3001/oauth'),
});

export const config = validateEnv(envSchema, process.env);