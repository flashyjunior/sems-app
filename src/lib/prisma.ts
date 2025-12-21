import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { logInfo, logError } from './logger';

let prisma: PrismaClient | null = null;

const getPrismaClient = () => {
  if (prisma) return prisma;

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    const errorMsg = 'DATABASE_URL environment variable is not set';
    logError(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    // Use PrismaPg adapter for Prisma v7 PostgreSQL connection
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    const prismaOptions: Prisma.PrismaClientOptions = {
      adapter,
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    };
    if (process.env.NODE_ENV === 'production') {
      prisma = new PrismaClient(prismaOptions);
    } else {
      // Use a global variable in development to prevent creating multiple instances
      const globalWithPrisma = global as typeof globalThis & {
        prisma?: PrismaClient;
      };

      if (!globalWithPrisma.prisma) {
        globalWithPrisma.prisma = new PrismaClient(prismaOptions);
      }

      prisma = globalWithPrisma.prisma;
    }

    logInfo('Prisma client initialized successfully');
    return prisma;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logError(`Failed to initialize Prisma client: ${errorMsg}`);
    throw error;
  }
};
export const getPrisma = () => getPrismaClient();

// Create a proxy that lazy-loads the prisma client for backward compatibility
const prismaProxy = new Proxy({} as any, {
  get(target, prop) {
    const client = getPrismaClient();
    return (client as any)[prop];
  },
});

// Default export for backward compatibility
export default prismaProxy;

// Handle disconnection gracefully
process.on('SIGINT', async () => {
  const client = getPrismaClient();
  if (client) {
    await client.$disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  const client = getPrismaClient();
  if (client) {
    await client.$disconnect();
  }
  process.exit(0);
});
