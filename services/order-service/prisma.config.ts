// @ts-nocheck
import { defineConfig } from '@prisma/config';

const databaseUrl = process.env.ORDER_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5434/order_db';

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