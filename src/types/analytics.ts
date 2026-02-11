/**
 * DPAP Type Definitions
 * 
 * Comprehensive TypeScript interfaces for analytics data structures
 */

/**
 * Risk categories
 */
export type RiskCategory = 'none' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Patient age groups
 */
export type PatientAgeGroup = 'paediatric' | 'adult' | 'geriatric';

/**
 * Subscription/access tiers
 */
export type SubscriptionTier =
  | 'free'
  | 'pro'
  | 'compliance'
  | 'intelligence'
  | 'enterprise';

/**
 * Dashboard types
 */
export type DashboardType =
  | 'operations'
  | 'safety'
  | 'compliance'
  | 'intelligence';

/**
 * Dispensing event (raw from DispenseForm)
 */
export interface DispensingEvent {
  id: string;
  eventId: string;
  timestamp: Date;
  pharmacyId: string;
  userId: string;

  // Drug information
  drugId: string;
  drugCode?: string;
  drugGenericName?: string;
  drugClass?: string;
  drugIsControlled: boolean;
  drugIsAntibiotic: boolean;

  // Patient information
  patientAgeGroup: PatientAgeGroup;
  patientAgeYears?: number;
  patientWeightKg?: number;
  patientIsPregnant?: boolean;

  // Dispensing details
  isPrescription: boolean;
  isOTC: boolean;
  dosageInstructions?: string;
  doseQuantity?: number;
  doseUnit?: string;

  // Compliance
  stgCompliant: boolean;
  overrideFlag: boolean;
  overrideReason?: string;

  // Risk assessment
  riskScore: number;
  riskCategory: RiskCategory;
  riskFlags: string[];
  highRiskFlag: boolean;

  // Operational
  printDurationSec?: number;

  // Metadata
  isSynced: boolean;
  syncTimestamp?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Analytics Configuration
 */
export interface AnalyticsConfig {
  id: string;
  pharmacyId: string;
  subscriptionTier: SubscriptionTier;
  stgReferenceVersion?: string;
  enableAntibioticStewardship: boolean;
  enableControlledDrugTracking: boolean;
  forecastingDays: number;
  confidenceLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Daily aggregated metrics
 */
export interface DailyMetrics {
  date: Date;
  pharmacyId: string;
  totalDispensingS: number;
  totalPrescriptions: number;
  totalOTC: number;
  prescriptionRatio: number;
  avgDispensingTimeSec: number;
  highRiskCount: number;
  mediumRiskCount: number;
  stgCompliantCount: number;
  stgComplianceRate: number;
  controlledMedicinesCount: number;
  antibioticCount: number;
  uniqueDrugCount: number;
}

/**
 * Top medicine statistics
 */
export interface TopMedicine {
  drugId: string;
  drugCode: string;
  drugGenericName: string;
  count: number;
  prescriptionCount: number;
  otcCount: number;
  prescriptionRatio: number;
  riskCategoryDistribution: {
    category: RiskCategory;
    count: number;
  }[];
}

/**
 * Hourly peak distribution
 */
export interface PeakHourData {
  hour: number;
  count: number;
  prescriptionCount: number;
  otcCount: number;
  avgRiskScore: number;
}

/**
 * Dashboard API Response
 */
export interface DashboardResponse<T> {
  data: T;
  metadata: {
    periodStart: string;
    periodEnd: string;
    pharmacyId: string;
    timestamp: string;
  };
}

/**
 * Operations Dashboard Data
 */
export interface OperationsDashboardData {
  totalPrescriptions: number;
  totalOTC: number;
  totalDispensingS: number;
  avgDispensingTime: number;
  prescriptionRatio: number;
  highRiskEvents: number;
  stgComplianceRate: number;
  trend: {
    hour: number;
    count: number;
    prescriptionCount: number;
  }[];
}

/**
 * Safety Dashboard Data
 */
export interface SafetyDashboardData {
  highRiskAlerts: DispensingEvent[];
  riskDistribution: {
    none: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  stgDeviationRate: number;
  topFlags: {
    flag: string;
    count: number;
  }[];
}

/**
 * Compliance Dashboard Data
 */
export interface ComplianceDashboardData {
  stgComplianceScore: number;
  compliantEvents: number;
  deviationCount: number;
  antibioticStewardshipScore: number;
  controlledMedicineTracking: {
    medicine: string;
    dispensedCount: number;
    documentedIndications: number;
  }[];
}

/**
 * Intelligence Dashboard Data
 */
export interface IntelligenceDashboardData {
  demandForecast: {
    date: string;
    predictedDemand: number;
    confidenceRange: [number, number];
  }[];
  regionalAnalysis: {
    region: string;
    totalDispensingS: number;
    topMedicines: TopMedicine[];
  }[];
  benchmarkingMetrics: {
    metric: string;
    yourValue: number;
    networkAverage: number;
    bestPractice: number;
    percentile: number;
  }[];
}

/**
 * Alert Configuration
 */
export interface AlertConfig {
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: ('email' | 'sms' | 'in-app' | 'webhook')[];
  recipients?: string[];
  webhookUrl?: string;
}

/**
 * Export Format
 */
export type ExportFormat = 'pdf' | 'csv' | 'json' | 'excel';

/**
 * Export Options
 */
export interface ExportOptions {
  format: ExportFormat;
  startDate: Date;
  endDate: Date;
  pharmacyId?: string;
  includeCharts: boolean;
  includeRawData: boolean;
}

/**
 * User Access Control
 */
export interface UserAccessControl {
  userId: string;
  role: 'pharmacist' | 'manager' | 'admin' | 'regulator' | 'executive';
  subscriptionTier: SubscriptionTier;
  allowedDashboards: DashboardType[];
  allowedPharmacies: string[];
}

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  eventType: string;
  eventId: string;
  action: 'created' | 'updated' | 'deleted' | 'viewed' | 'exported';
  details: Record<string, any>;
  ipAddress?: string;
}

/**
 * API Error Response
 */
export interface APIErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * API Success Response
 */
export interface APISuccessResponse<T> {
  data: T;
  metadata: Record<string, any>;
}

/**
 * Query Parameters for Analytics
 */
export interface AnalyticsQueryParams {
  startDate: string; // ISO format: YYYY-MM-DD
  endDate: string; // ISO format: YYYY-MM-DD
  pharmacyId?: string;
  interval?: 'hour' | 'day' | 'week' | 'month';
  groupBy?: string;
  limit?: number;
  offset?: number;
}

/**
 * Dashboard Filter Configuration
 */
export interface DashboardFilters {
  startDate: string;
  endDate: string;
  pharmacyId?: string;
  ageGroup?: PatientAgeGroup;
  riskCategory?: RiskCategory;
  rxOnly?: boolean;
  otcOnly?: boolean;
}

/**
 * Risk Rule Definition
 */
export interface RiskRule {
  id: string;
  name: string;
  description: string;
  condition: (event: DispensingEvent) => boolean;
  scoreAdjustment: number;
  flag: string;
  enabled: boolean;
}

/**
 * STG Guideline Definition
 */
export interface STGGuideline {
  id: string;
  drugId: string;
  ageGroup: PatientAgeGroup;
  recommendedDose: string;
  maxDailyDose: string;
  contraindications: string[];
  requiredIndications?: string[];
  notes: string;
}

/**
 * Drug Master Data
 */
export interface DrugMasterData {
  id: string;
  code: string;
  genericName: string;
  brandNames: string[];
  class: string;
  isControlled: boolean;
  isAntibiotic: boolean;
  contraindications: {
    paediatric: boolean;
    geriatric: boolean;
    pregnancy: boolean;
  };
  atcCode?: string;
  stgReference?: string;
}

/**
 * Forecasting Model Output
 */
export interface ForecastingOutput {
  metric: string;
  predictions: {
    date: string;
    predicted: number;
    lowerBound: number;
    upperBound: number;
    confidence: number;
  }[];
  accuracy: number;
  modelType: string;
  lastUpdated: Date;
}
