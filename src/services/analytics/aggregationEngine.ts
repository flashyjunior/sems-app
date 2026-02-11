/**
 * DPAP Aggregation Engine
 * 
 * Transforms individual dispensing events into aggregated analytics:
 * - Daily summaries (total dispensings, prescriptions, OTC, etc.)
 * - Top medicines by volume
 * - Peak hours analysis
 * - Risk distribution
 * 
 * These aggregates are stored in PostgreSQL (DailySummaryCache) for fast dashboard queries
 */

import prisma from '@/lib/prisma';

export interface DailyMetrics {
  date: Date;
  pharmacyId?: string;
  totalDispensingS: number;
  totalPrescriptions: number;
  totalOTC: number;
  avgDispensingTimeSec: number;
  highRiskCount: number;
  mediumRiskCount: number;
  stgCompliantCount: number;
  stgComplianceRate: number; // percentage
  controlledMedicinesCount: number;
  antibioticCount: number;
  uniqueDrugCount: number;
}

export interface TopMedicine {
  drugId: string;
  drugCode: string;
  drugGenericName: string;
  count: number;
  prescriptionCount: number;
  otcCount: number;
  riskCategory: string; // most common risk level
}

export interface PeakHours {
  hour: number; // 0-23
  count: number;
  prescriptionCount: number;
  avgRiskScore: number;
}

export interface DispensingSummary {
  periodStart: Date;
  periodEnd: Date;
  pharmacyId?: string;
  totalDispensingS: number;
  totalPrescriptions: number;
  totalOTC: number;
  prescriptionRatio: number;
  avgDispensingTime: number;
  totalHighRiskEvents: number;
  topMedicines: TopMedicine[];
  peakHours: PeakHours[];
  stgComplianceRate: number;
}

/**
 * Mock event data store - in production this would query PostgreSQL
 * Format matches dispensing_events table
 */
let dispensingEvents: any[] = [];

/**
 * Register a new dispensing event in PostgreSQL
 * Called from eventProcessor after risk scoring
 */
export async function registerEvent(event: any): Promise<void> {
  try {
    await prisma.dispensingEvent.create({
      data: {
        dispenseRecordId: event.dispenseRecordId,
        timestamp: new Date(event.timestamp),
        pharmacyId: event.pharmacyId,
        userId: event.userId,
        drugId: event.drugId,
        drugName: event.drugName,
        genericName: event.genericName,
        patientAgeGroup: event.patientAgeGroup,
        isPrescription: event.isPrescription,
        isControlledDrug: event.isControlledDrug,
        isAntibiotic: event.isAntibiotic,
        stgCompliant: event.stgCompliant,
        overrideFlag: event.overrideFlag,
        patientIsPregnant: event.patientIsPregnant,
        riskScore: event.riskScore,
        riskCategory: event.riskCategory,
        riskFlags: JSON.stringify(event.riskFlags),
        highRiskFlag: event.highRiskFlag,
      },
    });
  } catch (error) {
    console.error('Failed to register event:', error);
    throw error;
  }
}

/**
 * Calculate daily metrics for a specific date
 */
export async function aggregateDailyMetrics(
  date: Date,
  pharmacyId?: string
): Promise<DailyMetrics> {
  // Query events from PostgreSQL for this date and pharmacy
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const dayEvents = await prisma.dispensingEvent.findMany({
    where: {
      ...(pharmacyId ? { pharmacyId } : {}),
      timestamp: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  if (dayEvents.length === 0) {
    return {
      date,
      pharmacyId,
      totalDispensingS: 0,
      totalPrescriptions: 0,
      totalOTC: 0,
      avgDispensingTimeSec: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      stgCompliantCount: 0,
      stgComplianceRate: 0,
      controlledMedicinesCount: 0,
      antibioticCount: 0,
      uniqueDrugCount: 0,
    };
  }

  // Calculate metrics
  const prescriptions = dayEvents.filter((e: any) => e.isPrescription);
  const highRisk = dayEvents.filter((e: any) => ['high', 'critical'].includes(e.riskCategory));
  const mediumRisk = dayEvents.filter((e: any) => e.riskCategory === 'medium');
  const compliant = dayEvents.filter((e: any) => e.stgCompliant);
  const controlled = dayEvents.filter((e: any) => e.isControlledDrug);
  const antibiotics = dayEvents.filter((e: any) => e.isAntibiotic);
  const uniqueDrugs = new Set(dayEvents.map((e: any) => e.drugId)).size;

  return {
    date,
    pharmacyId,
    totalDispensingS: dayEvents.length,
    totalPrescriptions: prescriptions.length,
    totalOTC: dayEvents.length - prescriptions.length,
    avgDispensingTimeSec: 0, // Not tracked in event model currently
    highRiskCount: highRisk.length,
    mediumRiskCount: mediumRisk.length,
    stgCompliantCount: compliant.length,
    stgComplianceRate: (compliant.length / dayEvents.length) * 100,
    controlledMedicinesCount: controlled.length,
    antibioticCount: antibiotics.length,
    uniqueDrugCount: uniqueDrugs,
  };
}

/**
 * Get top medicines for a date range
 */
export async function getTopMedicines(
  startDate: Date,
  endDate: Date,
  pharmacyId?: string,
  limit: number = 10
): Promise<TopMedicine[]> {
  const whereClause: any = {
    timestamp: {
      gte: startDate,
      lt: endDate,
    },
  };

  if (pharmacyId && pharmacyId !== 'ALL_PHARMACIES') {
    whereClause.pharmacyId = pharmacyId;
  }

  const rangeEvents = await prisma.dispensingEvent.findMany({
    where: whereClause,
    orderBy: { timestamp: 'asc' },
  });

  if (rangeEvents.length === 0) {
    return [];
  }

  // Group by a stable drug key. Prefer drugId, fallback to genericName, then drugName, then 'unknown'.
  const drugGroups = new Map<string, any[]>();

  rangeEvents.forEach((event: any) => {
    const key = event.drugId || event.genericName || event.drugName || 'unknown';
    if (!drugGroups.has(key)) {
      drugGroups.set(key, []);
    }
    drugGroups.get(key)!.push(event);
  });

  // Calculate metrics per drug
  const medicines: TopMedicine[] = Array.from(drugGroups.entries())
    .map(([drugId, events]) => {
      const prescriptions = events.filter((e: any) => e.isPrescription);
      const riskCounts = events.reduce((acc: Record<string, number>, e: any) => {
        acc[e.riskCategory] = (acc[e.riskCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommonRisk = Object.entries(riskCounts).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0] || 'none';

      // Prefer a human-friendly generic name for display (genericName, then drugName, else use the group key)
      const displayName = events[0].genericName || events[0].drugName || events[0].drugId || 'Unknown Drug';
      const drugIdVal = events[0].drugId || displayName;
      return {
        drugId: drugIdVal,
        drugCode: String(drugIdVal).split('-')[0] || 'UNKNOWN',
        drugGenericName: displayName,
        count: events.length,
        prescriptionCount: prescriptions.length,
        otcCount: events.length - prescriptions.length,
        riskCategory: mostCommonRisk,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return medicines;
}

/**
 * Get peak hours distribution
 */
export async function getPeakHours(
  startDate: Date,
  endDate: Date,
  pharmacyId?: string
): Promise<PeakHours[]> {
  const whereClause: any = {
    timestamp: {
      gte: startDate,
      lt: endDate,
    },
  };

  if (pharmacyId && pharmacyId !== 'ALL_PHARMACIES') {
    whereClause.pharmacyId = pharmacyId;
  }

  const rangeEvents = await prisma.dispensingEvent.findMany({
    where: whereClause,
  });

  // Group by hour
  const hourGroups: PeakHours[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
    prescriptionCount: 0,
    avgRiskScore: 0,
  }));

  const hourData = new Map<number, { count: number; prescr: number; riskSum: number }>();

  rangeEvents.forEach((event: any) => {
    const hour = new Date(event.timestamp).getHours();
    if (!hourData.has(hour)) {
      hourData.set(hour, { count: 0, prescr: 0, riskSum: 0 });
    }

    const data = hourData.get(hour)!;
    data.count += 1;
    data.prescr += event.isPrescription ? 1 : 0;
    data.riskSum += event.riskScore || 0;
  });

  // Populate results
  hourData.forEach((data: any, hour: number) => {
    hourGroups[hour] = {
      hour,
      count: data.count,
      prescriptionCount: data.prescr,
      avgRiskScore: data.riskSum / data.count,
    };
  });

  return hourGroups;
}

/**
 * Get comprehensive dashboard summary
 */
export async function getDashboardSummary(
  startDate: Date,
  endDate: Date,
  pharmacyId?: string
): Promise<DispensingSummary> {
  // Support a special sentinel 'ALL_PHARMACIES' or undefined to indicate no pharmacy filter.
  const whereClause: any = {
    timestamp: {
      gte: startDate,
      lt: endDate,
    },
  };

  if (pharmacyId && pharmacyId !== 'ALL_PHARMACIES') {
    whereClause.pharmacyId = pharmacyId;
  }

  const rangeEvents = await prisma.dispensingEvent.findMany({
    where: whereClause,
  });

  if (rangeEvents.length === 0) {
    return {
      periodStart: startDate,
      periodEnd: endDate,
      pharmacyId,
      totalDispensingS: 0,
      totalPrescriptions: 0,
      totalOTC: 0,
      prescriptionRatio: 0,
      avgDispensingTime: 0,
      totalHighRiskEvents: 0,
      topMedicines: [],
      peakHours: [],
      stgComplianceRate: 0,
    };
  }

  const prescriptions = rangeEvents.filter((e: any) => e.isPrescription);
  const highRiskEvents = rangeEvents.filter((e: any) => e.riskCategory in ['high', 'critical']);
  const compliantEvents = rangeEvents.filter((e: any) => e.stgCompliant);

  const avgTime =
    rangeEvents.reduce((sum: number, e: any) => sum + (e.printDurationSec || 0), 0) /
    rangeEvents.length;

  const topMedicines = await getTopMedicines(startDate, endDate, pharmacyId, 10);
  const peakHours = await getPeakHours(startDate, endDate, pharmacyId);

  return {
    periodStart: startDate,
    periodEnd: endDate,
    pharmacyId: pharmacyId === 'ALL_PHARMACIES' ? undefined : pharmacyId,
    totalDispensingS: rangeEvents.length,
    totalPrescriptions: prescriptions.length,
    totalOTC: rangeEvents.length - prescriptions.length,
    prescriptionRatio: prescriptions.length / rangeEvents.length,
    avgDispensingTime: avgTime,
    totalHighRiskEvents: highRiskEvents.length,
    topMedicines,
    peakHours,
    stgComplianceRate: (compliantEvents.length / rangeEvents.length) * 100,
  };
}

/**
 * Get STG compliance statistics
 */
export async function getSTGComplianceStats(
  startDate: Date,
  endDate: Date,
  pharmacyId?: string
): Promise<{
  compliantCount: number;
  deviationCount: number;
  complianceRate: number;
  topDeviations: string[];
}> {
  const whereClause: any = {
    timestamp: {
      gte: startDate,
      lt: endDate,
    },
  };

  if (pharmacyId && pharmacyId !== 'ALL_PHARMACIES') {
    whereClause.pharmacyId = pharmacyId;
  }

  const rangeEvents = await prisma.dispensingEvent.findMany({
    where: whereClause,
  });

  const compliant = rangeEvents.filter((e: any) => e.stgCompliant);
  const deviations = rangeEvents.filter((e: any) => !e.stgCompliant);

  // Get top deviation reasons
  const reasonCounts: Map<string, number> = new Map();
  deviations.forEach((e: any) => {
    const reason = e.overrideReason || 'No reason specified';
    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
  });

  const topDeviations = Array.from(reasonCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([reason]) => reason);

  return {
    compliantCount: compliant.length,
    deviationCount: deviations.length,
    complianceRate:
      rangeEvents.length > 0
        ? (compliant.length / rangeEvents.length) * 100
        : 0,
    topDeviations,
  };
}

/**
 * Get high-risk alerts for safety dashboard
 */
export async function getHighRiskAlerts(
  startDate: Date,
  endDate: Date,
  pharmacyId?: string,
  severity: 'high' | 'critical' | 'both' = 'both'
): Promise<any[]> {
  const riskCategories = severity === 'both' ? ['high', 'critical'] : [severity];

  const whereClause: any = {
    timestamp: {
      gte: startDate,
      lt: endDate,
    },
    riskCategory: {
      in: riskCategories,
    },
  };

  if (pharmacyId && pharmacyId !== 'ALL_PHARMACIES') {
    whereClause.pharmacyId = pharmacyId;
  }

  const rangeEvents = await prisma.dispensingEvent.findMany({
    where: whereClause,
    orderBy: { timestamp: 'desc' },
  });

  return rangeEvents;
}

/**
 * Clear mock data (for testing)
 */
export function clearEventData(): void {
  dispensingEvents = [];
}

/**
 * Get all events (for debugging)
 */
export function getAllEvents(): any[] {
  return [...dispensingEvents];
}
