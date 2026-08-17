// @ts-nocheck
import { defineConfig } from '@prisma/config';

const databaseUrl = process.env.AUTH_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:15432/auth_db';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});