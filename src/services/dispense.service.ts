'use server';

import prisma from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';
import { DispenseCreate, DispenseUpdate } from '@/lib/validations';

/**
 * Ensure user exists in database, create if not found
 */
async function ensureUserExists(userId: number, email?: string): Promise<number> {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (existingUser) {
      return existingUser.id;
    }

    // User doesn't exist, create a placeholder user
    logInfo('Creating placeholder user for dispense record', { userId });
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: email || `user-${userId}@sems.local`,
        fullName: `User ${userId}`,
        licenseNumber: `LICENSE-${userId}`,
        password: 'placeholder', // In production, this should be handled differently
      },
    });

    logInfo('Placeholder user created', { userId: newUser.id });
    return newUser.id;
  } catch (error) {
    logError('Error ensuring user exists', error, { userId });
    // If even this fails, throw the error so we know there's a problem
    throw error;
  }
}

/**
 * Create a new dispense record
 */
export const createDispenseRecord = async (userId: number, data: DispenseCreate) => {
  try {
    // Ensure the user exists in the database
    await ensureUserExists(userId);

    const dispense = await prisma.dispenseRecord.create({
      data: {
        pharmacyId: (data as any).pharmacyId || undefined,
        userId,
        externalId: data.externalId,
        patientName: data.patientName,
        patientPhoneNumber: data.patientPhoneNumber,
        patientAge: data.patientAge,
        patientWeight: data.patientWeight,
        drugId: data.drugId,
        drugName: data.drugName,
        dose: JSON.stringify(data.dose),
        safetyAcks: JSON.stringify(data.safetyAcknowledgements),
        deviceId: data.deviceId,
        printedAt: data.printedAt ? new Date(data.printedAt) : undefined,
        auditLog: data.auditLog ? JSON.stringify(data.auditLog) : undefined,
      },
    });

    logInfo('Dispense record created', { userId, dispenseId: dispense.id, externalId: data.externalId });
    return dispense;
  } catch (error) {
    logError('Error creating dispense record', error, { userId, externalId: data.externalId });
    throw error;
  }
};

/**
 * Get dispense record by ID
 */
export const getDispenseById = async (id: number) => {
  try {
    return await prisma.dispenseRecord.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });
  } catch (error) {
    logError('Error fetching dispense record', error, { dispenseId: id });
    throw error;
  }
};

/**
 * Get dispense record by external ID
 */
export const getDispenseByExternalId = async (externalId: string) => {
  try {
    return await prisma.dispenseRecord.findUnique({
      where: { externalId },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });
  } catch (error) {
    logError('Error fetching dispense record by external ID', error, { externalId });
    throw error;
  }
};

/**
 * List dispense records with pagination and filtering
 */
export const listDispenseRecords = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    userId?: number;
    drugId?: string;
    startDate?: Date;
    endDate?: Date;
  }
) => {
  try {
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.drugId) where.drugId = filters.drugId;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [records, total] = await Promise.all([
      prisma.dispenseRecord.findMany({
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
      prisma.dispenseRecord.count({ where }),
    ]);

    return {
      data: records.map((record: any) => ({
        ...record,
        dose: record.dose ? JSON.parse(record.dose) : null,
        safetyAcks: record.safetyAcks ? JSON.parse(record.safetyAcks) : [],
        auditLog: record.auditLog ? JSON.parse(record.auditLog) : [],
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logError('Error listing dispense records', error);
    throw error;
  }
};

/**
 * Get dispense records by pharmacist with pagination
 */
export const getPharmacistDispenses = async (
  userId: number,
  page: number = 1,
  limit: number = 20
) => {
  try {
    return listDispenseRecords(page, limit, { userId });
  } catch (error) {
    logError('Error fetching pharmacist dispenses', error, { userId });
    throw error;
  }
};

/**
 * Get dispense statistics
 */
export const getDispenseStats = async (filters?: { startDate?: Date; endDate?: Date }) => {
  try {
    const where: any = { isActive: true };
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const records = await prisma.dispenseRecord.findMany({
      where,
      select: { userId: true, drugId: true, id: true },
    });

    return {
      totalDispenses: records.length,
      uniquePharmacists: new Set(records.map((r: any) => r.userId)).size,
      uniqueDrugs: new Set(records.map((r: any) => r.drugId)).size,
    };
  } catch (error) {
    logError('Error fetching dispense statistics', error);
    throw error;
  }
};

/**
 * Update dispense record
 */
export const updateDispenseRecord = async (id: number, data: DispenseUpdate) => {
  try {
    const dispense = await prisma.dispenseRecord.update({
      where: { id },
      data: {
        patientName: data.patientName,
        patientPhoneNumber: data.patientPhoneNumber,
        patientAge: data.patientAge,
        patientWeight: data.patientWeight,
        printedAt: data.printedAt ? new Date(data.printedAt) : undefined,
        isActive: data.isActive,
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    logInfo('Dispense record updated', { dispenseId: id });
    return dispense;
  } catch (error) {
    logError('Error updating dispense record', error, { dispenseId: id });
    throw error;
  }
};

/**
 * Delete dispense record (soft delete)
 */
export const deleteDispenseRecord = async (id: number) => {
  try {
    const dispense = await prisma.dispenseRecord.update({
      where: { id },
      data: { isActive: false },
    });

    logInfo('Dispense record deleted', { dispenseId: id });
    return dispense;
  } catch (error) {
    logError('Error deleting dispense record', error, { dispenseId: id });
    throw error;
  }
};
