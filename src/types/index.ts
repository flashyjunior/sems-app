// User & Auth Types
export type UserRole = 'pharmacist' | 'admin' | 'assistant';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  email?: string;
  createdAt: number;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  description: string | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  lastLogin: number | null;
}

// Drug & Dosing Types
export interface DrugCategory {
  id: string;
  name: string;
  stgReference: string;
}

export interface Drug {
  id: string;
  genericName: string;
  tradeName: string[];
  strength: string;
  route: 'oral' | 'iv' | 'im' | 'subcutaneous' | 'topical' | 'inhalation';
  category: string;
  stgReference: string;
  contraindications: string[];
  pregnancyCategory?: 'A' | 'B' | 'C' | 'D' | 'X';
  warnings?: string[];
}

export interface DoseRegimen {
  id: string;
  drugId: string;
  ageMin?: number;
  ageMax?: number;
  weightMin?: number;
  weightMax?: number;
  ageGroup: 'adult' | 'pediatric' | 'neonatal';
  doseMg: string;
  frequency: string;
  duration: string;
  maxDoseMgDay?: string;
  route: string;
  instructions?: string;
}

export interface DoseCalculation {
  drugId: string;
  drugName: string;
  strength: string;
  doseMg: number;
  volumeMl?: number;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
  stgCitation: string;
  warnings: string[];
  requiresPinConfirm: boolean;
}

// Patient Input Types
export interface PatientInput {
  name?: string;
  age: number;
  weight: number;
  pregnancyStatus?: 'yes' | 'no' | 'unknown';
  allergies: string[];
}

// Dispense Record Types
export interface DispenseRecord {
  id: string;
  timestamp: number;
  pharmacistId: string;
  pharmacistName?: string;
  patientName?: string;
  patientAge: number;
  patientWeight: number;
  drugId: string;
  drugName: string;
  dose: DoseCalculation;
  safetyAcknowledgements: string[];
  printedAt?: number;
  syncedAt?: number;
  synced: boolean;
  deviceId: string;
  auditLog: AuditLogEntry[];
}

export interface AuditLogEntry {
  timestamp: number;
  action: string;
  actor: string;
  details?: Record<string, unknown>;
}

// Sync Types
export interface SyncQueueItem {
  id: string;
  record: DispenseRecord;
  retries: number;
  lastAttempt?: number;
  error?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt?: number;
  pendingCount: number;
  errorCount: number;
}

// Inventory Types (Optional)
export interface InventoryItem {
  id: string;
  drugId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: number;
  location?: string;
  warehouseId?: string;
}

// Alert Types
export interface AlertMessage {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  dismissible: boolean;
  timestamp: number;
}

// Print Template Types
export interface PrintTemplate {
  id: string;
  name: string;
  description?: string;
  htmlTemplate: string; // Template with placeholders like {{drugName}}, {{dose}}, etc.
  escposTemplate?: string; // Optional ESC/POS template for thermal printers
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export type TemplatePlaceholder = 
  | 'drugName'
  | 'strength'
  | 'dose'
  | 'frequency'
  | 'duration'
  | 'route'
  | 'patientName'
  | 'patientAge'
  | 'patientWeight'
  | 'pharmacistName'
  | 'date'
  | 'time'
  | 'instructions'
  | 'warnings'
  | 'contraindications';

// User Profile Settings
export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  specialization?: string;
  facility?: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'fr' | 'es';
  defaultDoseUnit: 'mg' | 'mcg' | 'mmol' | 'ml';
  autoLock: boolean;
  autoLockMinutes: number;
  createdAt: number;
  updatedAt: number;
}

// Printer Settings
export interface PrinterSettings {
  id: string;
  name: string;
  type: 'thermal' | 'inkjet' | 'laser' | 'browser';
  portName?: string; // e.g., "COM1", "/dev/ttyUSB0"
  baudRate?: number; // e.g., 9600, 19200
  paperWidth?: 'standard' | 'narrow'; // 80mm or 58mm
  autoReprint: boolean;
  repruntOnError: boolean;
  copies: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  isDefault: boolean;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

// System Settings
export interface SystemSettings {
  id: string;
  facilityName: string;
  facilityLogo?: string;
  address?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  autoSyncEnabled: boolean;
  autoSyncInterval: number; // minutes
  offlineMode: boolean;
  dataRetention: number; // days
  auditLogging: boolean;
  createdAt: number;
  updatedAt: number;
}
