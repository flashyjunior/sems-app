// This file is server-only - ensure it's never imported on the client
if (typeof window !== 'undefined') {
  throw new Error(
    'prisma.server.ts was imported on the client. ' +
    'This file can only be used on the server side. ' +
    'Make sure you are not importing it from client components.'
  );
}

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create a database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Prevent multiple Prisma Client instances in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Only instantiate if DATABASE_URL is set
const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'Missing DATABASE_URL environment variable. Please check your .env file.',
    );
  }

  const adapter = new PrismaPg(pool);

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
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
