/**
 * DPAP Integration Index
 * 
 * Central reference for all DPAP analytics services and how to use them
 * in the SEMS application
 */

// ============================================
// SERVICES (Business Logic)
// ============================================

// Event Processor: Captures and orchestrates event flow
export {
  captureDispensingEvent,
  shouldTriggerAlert,
  formatEventForAudit,
  type DispensingEventInput,
  type DispensingEventOutput,
  AnalyticsError,
} from './eventProcessor';

// Risk Scoring: Calculates medical risk scores
export {
  calculateRiskScores,
  hasContraindication,
  getRiskDescription,
  getRiskColor,
  type RiskScores,
  type EnrichedEvent,
} from './riskScoringEngine';

// Event Enricher: Adds master data to raw events
export {
  enrichEvent,
  checkSTGCompliance,
  getContraindicationWarnings,
  getSuggestedAlternatives,
  getDrugsByClass,
  searchDrugs,
  type DrugMaster,
} from './eventEnricher';

// Aggregation Engine: Transforms events into analytics
export {
  aggregateDailyMetrics,
  getTopMedicines,
  getPeakHours,
  getDashboardSummary,
  getSTGComplianceStats,
  getHighRiskAlerts,
  clearEventData,
  getAllEvents,
  registerEvent,
  type TopMedicine,
  type PeakHours,
  type DispensingSummary,
} from './aggregationEngine';

// Utilities: Helper functions for UI integration
export {
  calculateRiskIndicator,
  formatRiskCategory,
  getRiskClassName,
  getRiskBadgeProps,
  shouldRequireConfirmation,
  buildHighRiskAlertMessage,
  formatMetrics,
  validateDateRange,
  parseISODate,
  getDefaultDateRange,
  logAnalyticsEvent,
  truncateDrugName,
  formatPercentage,
  getTimeOfDayLabel,
  type RiskIndicator,
} from './utils';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type {
  RiskCategory,
  PatientAgeGroup,
  SubscriptionTier,
  DashboardType,
  DispensingEvent,
  AnalyticsConfig,
  DailyMetrics,
  PeakHourData,
  DashboardResponse,
  OperationsDashboardData,
  SafetyDashboardData,
  ComplianceDashboardData,
  IntelligenceDashboardData,
  AlertConfig,
  ExportFormat,
  ExportOptions,
  UserAccessControl,
  AuditLogEntry,
  APIErrorResponse,
  APISuccessResponse,
  AnalyticsQueryParams,
  DashboardFilters,
  RiskRule,
  STGGuideline,
  DrugMasterData,
  ForecastingOutput,
} from '@/types/analytics';

// ============================================
// QUICK START GUIDE
// ============================================

/**
 * INTEGRATION PATTERN 1: Capture Event in DispenseForm
 * ===================================================
 *
 * import { captureDispensingEvent, calculateRiskIndicator } from '@/services/analytics';
 *
 * // In DispenseForm on Save & Print:
 * const event = await captureDispensingEvent({
 *   dispenseRecordId: dispenseRecord.id,
 *   timestamp: new Date(),
 *   pharmacyId: currentPharmacy.id,
 *   userId: currentUser.id,
 *   drugId: form.drugId,
 *   patientAgeGroup: form.patientAgeGroup,
 *   isPrescription: form.isPrescription,
 *   isControlledDrug: drug.isControlled,
 *   stgCompliant: true,
 * });
 *
 * // Check risk and alert if needed
 * if (event.shouldAlert) {
 *   showConfirmationDialog({
 *     title: 'High-Risk Dispensing',
 *     message: buildHighRiskAlertMessage(drug.name, form.patientAgeGroup, event.riskFlags),
 *     onConfirm: () => printLabel(),
 *   });
 * }
 */

/**
 * INTEGRATION PATTERN 2: Real-time Risk Indicator in DispenseForm
 * ===============================================================
 *
 * const handleAgeChange = async (ageGroup: PatientAgeGroup) => {
 *   const indicator = await calculateRiskIndicator(
 *     form.drugId,
 *     ageGroup,
 *     drug.isControlled,
 *     form.isPregnant,
 *     true,
 *     false
 *   );
 *
 *   setRiskIndicator(indicator);
 *
 *   if (indicator.shouldAlert) {
 *     showWarning({
 *       title: indicator.description,
 *       warnings: indicator.warnings.map(w => <WarningItem key={w} text={w} />),
 *     });
 *   }
 * };
 */

/**
 * INTEGRATION PATTERN 3: Query Dashboard Data
 * ============================================
 *
 * // In dashboard component (client-side)
 * async function loadDashboard(startDate: string, endDate: string) {
 *   const response = await fetch(
 *     `/api/analytics/dispensing/summary?startDate=${startDate}&endDate=${endDate}`
 *   );
 *
 *   const { data } = await response.json();
 *
 *   setMetrics({
 *     totalPrescriptions: data.totalPrescriptions,
 *     avgTime: data.avgDispensingTime,
 *     trend: data.trend,
 *   });
 * }
 */

/**
 * INTEGRATION PATTERN 4: Custom Risk Rules
 * =========================================
 *
 * // Create custom rule for specific pharmacy context
 * const customRule: RiskRule = {
 *   id: 'custom-high-antibiotic-usage',
 *   name: 'Antibiotic Overuse Detection',
 *   description: 'Flag if antibiotic > 5x/day',
 *   condition: (event) => event.drugIsAntibiotic && event.count > 5,
 *   scoreAdjustment: 15,
 *   flag: 'HIGH_ANTIBIOTIC_USAGE',
 *   enabled: true,
 * };
 */

// ============================================
// API ROUTES (Available Endpoints)
// ============================================

/*
 * OPERATIONS DASHBOARD
 * ====================
 * GET /api/analytics/dispensing/summary
 *   Query: startDate, endDate, pharmacyId?, interval?
 *   Returns: KPIs, daily trend, risk metrics
 *
 * GET /api/analytics/dispensing/top-medicines
 *   Query: startDate, endDate, pharmacyId?, limit?
 *   Returns: Top 10 medicines by volume
 *
 * GET /api/analytics/dispensing/peak-hours
 *   Query: startDate, endDate, pharmacyId?
 *   Returns: Hour-by-hour distribution for heatmap
 *
 * SAFETY DASHBOARD (FUTURE)
 * ==========================
 * GET /api/analytics/safety/alerts
 *   Query: severity?, limit?
 *   Returns: High-risk alerts for clinical review
 *
 * GET /api/analytics/safety/risk-scores
 *   Returns: Risk score distribution
 *
 * COMPLIANCE DASHBOARD (FUTURE)
 * =============================
 * GET /api/analytics/compliance/stg-score
 *   Returns: STG adherence score and trend
 *
 * INTELLIGENCE DASHBOARD (FUTURE)
 * ================================
 * GET /api/analytics/intelligence/demand-forecast
 *   Query: days?, medicine_id?
 *   Returns: 30/60/90-day demand forecast
 */

// ============================================
// DATABASE SCHEMA (Prisma Models)
// ============================================

/*
 * Add to prisma/schema.prisma:
 *
 * model DispensingEvent {
 *   id            String    @id @default(cuid())
 *   eventId       String    @unique @default(cuid())
 *   pharmacyId    String
 *   userId        String
 *   user          User      @relation(fields: [userId], references: [id])
 *
 *   drugId        String
 *   drugCode      String?
 *   drugGenericName String?
 *   drugClass     String?
 *
 *   patientAgeGroup String? // "paediatric" | "adult" | "geriatric"
 *   timestamp     DateTime  @default(now())
 *
 *   isPrescription Boolean @default(false)
 *   isOTC         Boolean @default(false)
 *
 *   stgCompliant  Boolean @default(false)
 *   riskCategory  String?
 *   riskScore     Int?
 *
 *   createdAt     DateTime  @default(now())
 *   updatedAt     DateTime  @updatedAt
 *
 *   @@index([pharmacyId, timestamp])
 *   @@index([riskCategory, timestamp])
 * }
 *
 * model AnalyticsConfig {
 *   id            String    @id @default(cuid())
 *   pharmacyId    String    @unique
 *   subscriptionTier String
 *   createdAt     DateTime  @default(now())
 *   updatedAt     DateTime  @updatedAt
 * }
 */

// ============================================
// DEVELOPMENT CHECKLIST
// ============================================

/*
 * Phase 1 Implementation Checklist:
 * 
 * [OK] [DONE] Event Processor Service
 * [OK] [DONE] Risk Scoring Engine
 * [OK] [DONE] Event Enricher Service
 * [OK] [DONE] Aggregation Engine
 * [OK] [DONE] Analytics APIs (dispensing endpoints)
 * [OK] [DONE] Type Definitions
 * [OK] [DONE] Utility Functions
 * 
 * TODO:
 * [ ] Update DispenseForm to call captureDispensingEvent()
 * [ ] Add patient age group field to DispenseForm
 * [ ] Create Operations Dashboard component
 * [ ] Create API middleware for RBAC
 * [ ] Implement alert system for high-risk events
 * [ ] Create admin config page (/admin/dpap-config)
 * [ ] Add unit tests for risk scoring
 * [ ] Add integration tests for e2e flow
 * [ ] Set up TimescaleDB for production
 * [ ] Create Prisma migration for dispensing_events
 * [ ] Document API endpoints in README
 * [ ] Team training + go-live
 */

export const PHASE_1_CHECKLIST = {
  services: ['eventProcessor', 'riskScoringEngine', 'eventEnricher', 'aggregationEngine'],
  apis: ['dispensing/summary', 'dispensing/top-medicines', 'dispensing/peak-hours'],
  types: ['DispensingEvent', 'RiskScores', 'DailyMetrics', 'AnalyticsConfig'],
  components: ['TODO: OperationsDashboard', 'TODO: AlertSystem', 'TODO: AdminConfig'],
};
