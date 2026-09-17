import { PrismaPg } from '@prisma/adapter-pg';

const { PrismaClient } = require('../generated/prisma-client/index.js') as typeof import('../generated/prisma-client/index.js');

const databaseUrl =
  process.env.NOTIFICATION_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5436/notification_db?schema=public';

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
