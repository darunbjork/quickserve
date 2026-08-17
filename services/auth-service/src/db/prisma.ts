import { PrismaClient } from '../generated/prisma-client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl = process.env.AUTH_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:15432/auth_db';

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});