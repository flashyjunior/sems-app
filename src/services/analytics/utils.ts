/**
 * DPAP Utilities
 * 
 * Helper functions for integrating analytics into SEMS components
 * Particularly for DispenseForm and existing pharmacy workflows
 */

import {
  calculateRiskScores,
  getRiskDescription,
  getRiskColor,
  type RiskScores,
} from './riskScoringEngine';

/**
 * Risk level indicator for UI display
 */
export interface RiskIndicator {
  category: RiskScores['category'];
  score: number;
  color: string;
  description: string;
  icon: string;
  shouldAlert: boolean;
  warnings: string[];
}

/**
 * Calculate and format risk indicator for UI
 */
export async function calculateRiskIndicator(
  drugId: string,
  ageGroup: 'paediatric' | 'adult' | 'geriatric',
  isControlled: boolean,
  isPregnant: boolean = false,
  stgCompliant: boolean = true,
  overrideFlag: boolean = false
): Promise<RiskIndicator> {
  // Build enriched event for scoring
  const event = {
    drugId,
    drugIsControlled: isControlled,
    drugIsAntibiotic: false, // Would be set from drug master
    patientAgeGroup: ageGroup,
    patientIsPregnant: isPregnant,
    isPrescription: true,
    stgCompliant,
    overrideFlag,
  };

  const riskScores = calculateRiskScores(event);
  // Fetch contraindication warnings from server-side enricher
  let warnings: string[] = [];
  try {
    const q = new URLSearchParams({ drugId, ageGroup, isPregnant: String(isPregnant) });
    const res = await fetch(`/api/analytics/contraindications?${q.toString()}`);
    if (res.ok) {
      const json = await res.json();
      warnings = json.data || [];
    }
  } catch (e) {
    // ignore and fall back to empty warnings
  }

  const iconMap: Record<string, string> = {
    none: '[OK]',
    low: '',
    medium: '[WARN]',
    high: '[WARN][WARN]',
    critical: '[ALERT]',
  };

  return {
    category: riskScores.category,
    score: riskScores.score,
    color: getRiskColor(riskScores.category),
    description: getRiskDescription(riskScores.category),
    icon: iconMap[riskScores.category],
    shouldAlert: riskScores.category in ['high', 'critical'],
    warnings,
  };
}

/**
 * Format risk category for display in UI
 */
export function formatRiskCategory(category: string): string {
  const labels: Record<string, string> = {
    none: 'No Risk',
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'CRITICAL',
  };

  return labels[category] || 'Unknown';
}

/**
 * Get CSS class for risk styling
 */
export function getRiskClassName(category: string): string {
  const classMap: Record<string, string> = {
    none: 'risk-none',
    low: 'risk-low',
    medium: 'risk-medium',
    high: 'risk-high',
    critical: 'risk-critical',
  };

  return classMap[category] || 'risk-unknown';
}

/**
 * Get badge component props for risk display
 */
export function getRiskBadgeProps(category: string): {
  text: string;
  color: string;
  bgColor: string;
} {
  const badgeConfig: Record<
    string,
    {
      text: string;
      color: string;
      bgColor: string;
    }
  > = {
    none: {
      text: 'Safe',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    },
    low: {
      text: 'Low Risk',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
    },
    medium: {
      text: 'Medium Risk',
      color: 'text-amber-700',
      bgColor: 'bg-amber-100',
    },
    high: {
      text: 'High Risk',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
    },
    critical: {
      text: 'CRITICAL',
      color: 'text-white',
      bgColor: 'bg-red-900',
    },
  };

  return badgeConfig[category] || badgeConfig['none'];
}

/**
 * Determine if dispensing should be allowed or require confirmation
 */
export function shouldRequireConfirmation(category: string): boolean {
  return category in ['high', 'critical'];
}

/**
 * Build alert message for high-risk dispensing
 */
export function buildHighRiskAlertMessage(
  drugName: string,
  ageGroup: string,
  riskFlags: string[]
): string {
  return `[WARN] HIGH-RISK DISPENSING DETECTED

Drug: ${drugName}
Patient: ${ageGroup}

Risk Factors:
${riskFlags.map((f) => `- ${f}`).join('\n')}

Please review with pharmacist before proceeding.`;
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: {
  totalPrescriptions?: number;
  totalOTC?: number;
  avgDispensingTime?: number;
  prescriptionRatio?: number;
}): {
  label: string;
  value: string;
  unit?: string;
}[] {
  return [
    {
      label: 'Total Prescriptions',
      value: (metrics.totalPrescriptions || 0).toLocaleString(),
    },
    {
      label: 'Total OTC',
      value: (metrics.totalOTC || 0).toLocaleString(),
    },
    {
      label: 'Avg Dispensing Time',
      value: Number(metrics.avgDispensingTime || 0).toFixed(1),
      unit: 'seconds',
    },
    {
      label: 'Prescription Ratio',
      value: (((metrics.prescriptionRatio || 0) * 100).toFixed(1)),
      unit: '%',
    },
  ];
}

/**
 * Validate date range for analytics query
 */
export function validateDateRange(
  startDate: Date,
  endDate: Date,
  maxDays: number = 365
): {
  valid: boolean;
  error?: string;
} {
  if (startDate > endDate) {
    return {
      valid: false,
      error: 'Start date must be before end date',
    };
  }

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > maxDays) {
    return {
      valid: false,
      error: `Date range cannot exceed ${maxDays} days`,
    };
  }

  return { valid: true };
}

/**
 * Parse ISO date string safely
 */
export function parseISODate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

/**
 * Get default date range (last 30 days)
 */
export function getDefaultDateRange(): {
  startDate: string;
  endDate: string;
} {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

/**
 * Log analytics event for audit trail
 */
export async function logAnalyticsEvent(
  eventType: string,
  data: Record<string, any>,
  userId: string
): Promise<void> {
  // In production, this would send to audit log service
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    userId,
    data,
  };

  console.log('[DPAP AUDIT]', logEntry);
  // TODO: Send to audit log service
}

/**
 * Truncate long drug names for display
 */
export function truncateDrugName(name: string, maxLength: number = 30): string {
  if (name.length <= maxLength) {
    return name;
  }
  return name.substring(0, maxLength - 3) + '...';
}

/**
 * Format percentage with proper precision
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return Number((value * 100).toFixed(decimals)) + '%';
}

/**
 * Get time-of-day label for hour
 */
export function getTimeOfDayLabel(hour: number): string {
  if (hour < 5) return 'Night';
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  if (hour < 21) return 'Evening';
  return 'Late Night';
}
