// @ts-nocheck
import { defineConfig } from '@prisma/config';

const databaseUrl =
  process.env.NOTIFICATION_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5436/notification_db';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
