import { z } from 'zod';

export const validateEnv = <T extends z.ZodTypeAny>(schema: T, envData: Record<string, string | undefined>): z.infer<T> => {
  const parsed = schema.safeParse(envData);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
};