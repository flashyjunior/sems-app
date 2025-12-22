// This file is server-only - ensure it's never imported on the client
if (typeof window !== 'undefined') {
  throw new Error(
    'prisma.server.ts was imported on the client. ' +
    'This file can only be used on the server side. ' +
    'Make sure you are not importing it from client components.'
  );
}

// Import types for TypeScript (these are safe at type-check time)
import type { PrismaClient as PrismaClientType } from '@prisma/client';

// Dynamically require the actual modules at runtime
let PrismaClient: any;
let PrismaPg: any;

try {
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
} catch (e) {
  console.error('Failed to import PrismaClient:', e);
  throw new Error('Prisma client is required but not available');
}

try {
  const adapterModule = require('@prisma/adapter-pg');
  PrismaPg = adapterModule.PrismaPg;
} catch (e) {
  console.error('Failed to import PrismaPg adapter:', e);
  throw new Error('Prisma adapter is required but not available');
}

import { Pool } from 'pg';

// Create a database connection pool
let pool: any = null;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
};

// Prevent multiple Prisma Client instances in development
declare global {
  var prisma: PrismaClientType | undefined;
}

// Only instantiate if DATABASE_URL is set
const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    // During build time, return a null proxy to avoid errors
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return null as any;
    }
    
    throw new Error(
      'Missing DATABASE_URL environment variable. Please check your .env file.',
    );
  }

  const adapter = new PrismaPg(getPool());

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

export const prisma = (globalForPrisma.prisma ??
  prismaClientSingleton()) as PrismaClientType;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
