import { z } from 'zod';
import { validateEnv } from '@quickserve/shared-utils';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3007'),
  NOTIFICATION_DATABASE_URL: z.string().url(),
  RABBITMQ_URL: z.string().default('amqp://localhost:5672'),
});

export const config = validateEnv(envSchema, process.env);
