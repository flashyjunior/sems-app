import prisma from '@/lib/prisma.server';
import { logError, logInfo } from '@/lib/logger';

/**
 * Get all roles
 */
export const listRoles = async () => {
  try {
    return await prisma.role.findMany({
      include: {
        permissions: true,
        users: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    logError('Error listing roles', error);
    throw error;
  }
};

/**
 * Get role by ID
 */
export const getRoleById = async (id: number) => {
  try {
    return await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        users: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });
  } catch (error) {
    logError('Error fetching role', error, { roleId: id });
    throw error;
  }
};

/**
 * Create a new role
 */
export const createRole = async (name: string, description?: string, permissionIds?: number[]) => {
  try {
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissionIds
          ? {
              connect: permissionIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: { permissions: true },
    });

    logInfo('Role created successfully', { roleId: role.id, name });
    return role;
  } catch (error) {
    logError('Error creating role', error, { name });
    throw error;
  }
};

/**
 * Update role
 */
export const updateRole = async (id: number, name?: string, description?: string, permissionIds?: number[]) => {
  try {
    const role = await prisma.role.update({
      where: { id },
      data: {
        name,
        description,
        permissions: permissionIds
          ? {
              set: [],
              connect: permissionIds.map((pid) => ({ id: pid })),
            }
          : undefined,
      },
      include: { permissions: true },
    });

    logInfo('Role updated successfully', { roleId: id });
    return role;
  } catch (error) {
    logError('Error updating role', error, { roleId: id });
    throw error;
  }
};

/**
 * Delete role
 */
export const deleteRole = async (id: number) => {
  try {
    await prisma.role.delete({
      where: { id },
    });

    logInfo('Role deleted successfully', { roleId: id });
  } catch (error) {
    logError('Error deleting role', error, { roleId: id });
    throw error;
  }
};

/**
 * Get all permissions
 */
export const listPermissions = async () => {
  try {
    return await prisma.permission.findMany({
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    logError('Error listing permissions', error);
    throw error;
  }
};

/**
 * Get permission by ID
 */
export const getPermissionById = async (id: number) => {
  try {
    return await prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          select: { id: true, name: true },
        },
      },
    });
  } catch (error) {
    logError('Error fetching permission', error, { permissionId: id });
    throw error;
  }
};

/**
 * Create permission
 */
export const createPermission = async (name: string, description?: string) => {
  try {
    const permission = await prisma.permission.create({
      data: {
        name,
        description,
      },
    });

    logInfo('Permission created successfully', { permissionId: permission.id, name });
    return permission;
  } catch (error) {
    logError('Error creating permission', error, { name });
    throw error;
  }
};

/**
 * Delete permission
 */
export const deletePermission = async (id: number) => {
  try {
    await prisma.permission.delete({
      where: { id },
    });

    logInfo('Permission deleted successfully', { permissionId: id });
  } catch (error) {
    logError('Error deleting permission', error, { permissionId: id });
    throw error;
  }
};

/**
 * Check if user has permission
 */
export const userHasPermission = async (userId: number, permissionName: string): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) return false;

    return user.role.permissions.some((p: any) => p.name === permissionName);
  } catch (error) {
    logError('Error checking user permission', error, { userId, permissionName });
    return false;
  }
};
