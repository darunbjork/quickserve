// @ts-nocheck
import { defineConfig } from '@prisma/config';

const databaseUrl =
  process.env.MENU_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5435/menu_db';

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
