import prisma from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';

/**
 * Create activity log entry
 */
export const createActivityLog = async (
  userId: number,
  action: string,
  resource: string,
  resourceId?: string,
  changes?: any,
  ipAddress?: string,
  userAgent?: string,
  status: string = 'success',
  errorMsg?: string
) => {
  try {
    return await prisma.activityLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        changes: changes ? JSON.stringify(changes) : undefined,
        ipAddress,
        userAgent,
        status,
        errorMsg,
      },
    });
  } catch (error) {
    logError('Error creating activity log', error, { userId, action, resource });
    // Don't throw - activity logging shouldn't fail the main operation
  }
};

/**
 * Get activity logs with pagination and filtering
 */
export const getActivityLogs = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    userId?: number;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }
) => {
  try {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters?.resource) where.resource = { contains: filters.resource, mode: 'insensitive' };
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, fullName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logError('Error fetching activity logs', error);
    throw error;
  }
};

/**
 * Get user activity history
 */
export const getUserActivityHistory = async (userId: number, limit: number = 50) => {
  try {
    return await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    logError('Error fetching user activity history', error, { userId });
    throw error;
  }
};

/**
 * Get audit trail for resource
 */
export const getResourceAuditTrail = async (resource: string, resourceId: string) => {
  try {
    return await prisma.activityLog.findMany({
      where: {
        resource,
        resourceId,
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    logError('Error fetching audit trail', error, { resource, resourceId });
    throw error;
  }
};

/**
 * Clear old activity logs (data retention policy)
 */
export const clearOldActivityLogs = async (daysToKeep: number = 365) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logInfo('Old activity logs cleared', { daysToKeep, deletedCount: result.count });
    return result;
  } catch (error) {
    logError('Error clearing old activity logs', error);
    throw error;
  }
};
