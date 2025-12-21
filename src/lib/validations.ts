import { z } from 'zod';

// User validation schemas
export const userCreateSchema = z.object({
  email: z.string().email('Invalid email format'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  licenseNumber: z.string().min(3, 'License number must be at least 3 characters'),
  specialization: z.string().optional(),
  roleId: z.number().positive('Role ID must be positive'),
});

export const userUpdateSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  theme: z.enum(['auto', 'light', 'dark']).optional(),
  language: z.enum(['en', 'fr', 'es']).optional(),
  defaultDoseUnit: z.enum(['mg', 'mcg', 'g', 'ml', 'units']).optional(),
  autoLock: z.boolean().optional(),
  autoLockMinutes: z.number().min(1).max(120).optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const userPasswordChangeSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Printer validation schemas
export const printerCreateSchema = z.object({
  name: z.string().min(2, 'Printer name must be at least 2 characters'),
  location: z.string().optional(),
  ipAddress: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Invalid IP address').optional(),
  modelNumber: z.string().optional(),
  serialNumber: z.string().optional(),
});

export const printerUpdateSchema = z.object({
  name: z.string().min(2, 'Printer name must be at least 2 characters').optional(),
  location: z.string().optional(),
  ipAddress: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Invalid IP address').optional(),
  modelNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const printerSettingsSchema = z.object({
  paperSize: z.enum(['A3', 'A4', 'A5', 'Letter']).optional(),
  orientation: z.enum(['portrait', 'landscape']).optional(),
  colorMode: z.enum(['bw', 'color']).optional(),
  quality: z.enum(['draft', 'normal', 'high']).optional(),
  copies: z.number().min(1).max(999).optional(),
  autoSync: z.boolean().optional(),
  syncInterval: z.number().min(60).max(3600).optional(),
});

// System Settings validation
export const systemSettingsSchema = z.object({
  facilityName: z.string().min(2, 'Facility name must be at least 2 characters'),
  facilityLogo: z.string().url().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  autoSyncEnabled: z.boolean().optional(),
  syncInterval: z.number().min(60).max(3600).optional(),
  dataRetention: z.number().min(1).max(3650).optional(),
  dataRetentionUnit: z.enum(['days', 'months', 'years']).optional(),
  auditLogging: z.boolean().optional(),
});

// Activity Log validation
export const activityLogSchema = z.object({
  userId: z.number().positive(),
  action: z.string().min(1, 'Action is required'),
  resource: z.string().min(1, 'Resource is required'),
  resourceId: z.string().optional(),
  changes: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Dispense Record validation
export const dispenseCreateSchema = z.object({
  externalId: z.string().min(1, 'Dispense ID is required'),
  patientName: z.string().optional(),
  patientAge: z.number().positive().optional(),
  patientWeight: z.number().positive().optional(),
  drugId: z.string().min(1, 'Drug ID is required'),
  drugName: z.string().min(1, 'Drug name is required'),
  dose: z.record(z.string(), z.any()),
  safetyAcknowledgements: z.array(z.string()).default([]),
  deviceId: z.string().min(1, 'Device ID is required'),
  printedAt: z.number().optional(),
  auditLog: z.array(z.record(z.string(), z.any())).optional(),
});

export const dispenseUpdateSchema = z.object({
  patientName: z.string().optional(),
  patientAge: z.number().positive().optional(),
  patientWeight: z.number().positive().optional(),
  printedAt: z.number().optional(),
  isActive: z.boolean().optional(),
});

// Type exports
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserLogin = z.infer<typeof userLoginSchema>;
export type PrinterCreate = z.infer<typeof printerCreateSchema>;
export type PrinterUpdate = z.infer<typeof printerUpdateSchema>;
export type SystemSettings = z.infer<typeof systemSettingsSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type DispenseCreate = z.infer<typeof dispenseCreateSchema>;
export type DispenseUpdate = z.infer<typeof dispenseUpdateSchema>;
