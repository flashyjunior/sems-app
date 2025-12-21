// Stub for browser environment - only used on backend server
// For frontend/Tauri app, use the SyncService and API calls instead

export const prisma = {} as any;
export type PrismaClient = any;
export type Prisma = any;

export const getPrismaClient = () => {
  throw new Error('Prisma client not available in browser. Use API endpoints instead.');
};

export const getPrisma = () => prisma;

export default prisma;

