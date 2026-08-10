import { z } from 'zod';

// * WHY: Failing fast at boot time is infinitely better than crashing at runtime because of a missing env var.
// By centralizing env validation, a container will refuse to start in CI/CD or production 
// if misconfigured, rather than waiting for a user to trigger the code path that uses the secret.
export const validateEnv = <T extends z.ZodTypeAny>(schema: T, envData: Record<string, string | undefined>): z.infer<T> => {
  const parsed = schema.safeParse(envData);

  if (!parsed.success) {
    // We cannot use our logger here if the logger itself depends on env vars. 
    // Console error is acceptable exclusively for fatal boot-time misconfigurations.
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
};