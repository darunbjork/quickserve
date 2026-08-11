import { PrismaClient } from '@prisma/client';

// WHY: Single PrismaClient instance per service to prevent connection pool exhaustion.
// Node.js module caching ensures this singleton is shared across all repositories.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});