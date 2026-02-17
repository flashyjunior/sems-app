'use server';

import prisma from '@/lib/prisma';
import { hashPassword, comparePassword } from '@/lib/password';
import { logError, logInfo } from '@/lib/logger';
import { UserCreate, UserUpdate } from '@/lib/validations';

/**
 * Get user by ID
 */
export const getUserById = async (id: number) => {
  try {
    return await prisma.user.findUnique({
      where: { id },
      include: { role: true, pharmacy: true },
    });
  } catch (error) {
    logError('Error fetching user by ID', error, { userId: id });
    throw error;
  }
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string) => {
  try {
    return await prisma.user.findUnique({
      where: { email },
      include: { role: true, pharmacy: true },
    });
  } catch (error) {
    logError('Error fetching user by email', error, { email });
    throw error;
  }
};

/**
 * Create a new user
 */
export const createUser = async (data: UserCreate) => {
  try {
    const hashedPassword = await hashPassword(data.password);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        password: hashedPassword,
        licenseNumber: data.licenseNumber,
        specialization: data.specialization,
        roleId: data.roleId,
      },
      include: { role: true },
    });

    logInfo('User created successfully', { userId: user.id, email: user.email });
    return user;
  } catch (error) {
    logError('Error creating user', error, { email: data.email });
    throw error;
  }
};

/**
 * Update user
 */
export const updateUser = async (id: number, data: UserUpdate) => {
  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });

    logInfo('User updated successfully', { userId: id });
    return user;
  } catch (error) {
    logError('Error updating user', error, { userId: id });
    throw error;
  }
};

/**
 * Change user password
 */
export const changeUserPassword = async (id: number, oldPassword: string, newPassword: string) => {
  try {
    const user = await getUserById(id);
    
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await comparePassword(oldPassword, user.password);
    if (!isValid) {
      throw new Error('Invalid current password');
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    logInfo('User password changed successfully', { userId: id });
  } catch (error) {
    logError('Error changing password', error, { userId: id });
    throw error;
  }
};

/**
 * Authenticate user (verify email and password)
 */
export const authenticateUser = async (email: string, password: string) => {
  try {
    logInfo('Authenticating user', { email });
    const user = await getUserByEmail(email);
    
    if (!user) {
      logInfo('User not found', { email });
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      logInfo('User is not active', { email, userId: user.id });
      throw new Error('Invalid credentials');
    }

    logInfo('User found, comparing passwords', { email, userId: user.id });
    const isValid = await comparePassword(password, user.password);
    logInfo('Password comparison result', { email, isValid });
    
    if (!isValid) {
      logInfo('Password does not match', { email });
      throw new Error('Invalid credentials');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    logInfo('User authenticated successfully', { userId: user.id, email });
    return user;
  } catch (error) {
    logError('Error authenticating user', error, { email });
    throw error;
  }
};

/**
 * Get all users with pagination
 */
export const listUsers = async (page: number = 1, limit: number = 20) => {
  try {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: { role: true, pharmacy: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return {
      data: users,
      pagination: {
        page,
        include: { role: true, pharmacy: true },
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logError('Error listing users', error);
    throw error;
  }
};

/**
 * Delete user
 */
export const deleteUser = async (id: number) => {
  try {
    await prisma.user.delete({
      where: { id },
    });

    logInfo('User deleted successfully', { userId: id });
  } catch (error) {
    logError('Error deleting user', error, { userId: id });
    throw error;
  }
};

/**
 * Deactivate user
 */
export const deactivateUser = async (id: number) => {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: { role: true },
    });

    logInfo('User deactivated successfully', { userId: id });
    return user;
  } catch (error) {
    logError('Error deactivating user', error, { userId: id });
    throw error;
  }
};
