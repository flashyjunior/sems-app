/**
 * Advanced Analytics Engine
 * Compliance trends, drug interactions, performance metrics, and fraud detection
 */

import prisma from '@/lib/prisma';

// ============================================
// COMPLIANCE TRENDS ANALYSIS
// ============================================

export interface ComplianceTrendPoint {
  date: string;
  complianceRate: number;
  compliantCount: number;
  deviationCount: number;
  totalEvents: number;
}

/**
 * Get compliance rate trends over time
 */
export async function getComplianceTrends(
  startDate: Date,
  endDate: Date,
  pharmacyId: string,
  intervalDays: number = 7
): Promise<ComplianceTrendPoint[]> {
  const events = await prisma.dispensingEvent.findMany({
    where: {
      pharmacyId,
      timestamp: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      timestamp: true,
      stgCompliant: true,
    },
  });

  const trends: Map<string, { compliant: number; total: number }> = new Map();

  events.forEach((event: any) => {
    const dateKey = new Date(event.timestamp).toISOString().split('T')[0];
    
    if (!trends.has(dateKey)) {
      trends.set(dateKey, { compliant: 0, total: 0 });
    }

    const data = trends.get(dateKey)!;
    data.total += 1;
    if (event.stgCompliant) data.compliant += 1;
  });

  return Array.from(trends.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, data]) => ({
      date,
      complianceRate: (data.compliant / data.total) * 100,
      compliantCount: data.compliant,
      deviationCount: data.total - data.compliant,
      totalEvents: data.total,
    }));
}

// ============================================
// DRUG INTERACTION DETECTION
// ============================================

export interface DrugInteractionRisk {
  drugId: string;
  drugName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  commonInteractions: string[];
  frequencyInDataset: number;
  averageRiskScore: number;
}

// Common drug interaction rules (simplified)
const DRUG_INTERACTIONS: Record<string, string[]> = {
  'DRUG001': ['DRUG002', 'DRUG003'],      // Aspirin interactions
  'DRUG002': ['DRUG001', 'DRUG007'],      // Amoxicillin interactions
  'DRUG003': ['DRUG001', 'DRUG006'],      // Lisinopril interactions
  'DRUG006': ['DRUG003', 'DRUG004'],      // Atorvastatin interactions
};

const DRUG_DETAILS: Record<string, { name: string; baseRisk: number }> = {
  'DRUG001': { name: 'Aspirin', baseRisk: 15 },
  'DRUG002': { name: 'Amoxicillin', baseRisk: 20 },
  'DRUG003': { name: 'Lisinopril', baseRisk: 18 },
  'DRUG004': { name: 'Metformin', baseRisk: 12 },
  'DRUG005': { name: 'Omeprazole', baseRisk: 10 },
  'DRUG006': { name: 'Atorvastatin', baseRisk: 22 },
  'DRUG007': { name: 'Ibuprofen', baseRisk: 25 },
  'DRUG008': { name: 'Acetaminophen', baseRisk: 8 },
};

/**
 * Analyze drug interaction risks
 */
export async function analyzeDrugInteractions(
  pharmacyId: string,
  days: number = 30
): Promise<DrugInteractionRisk[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const events = await prisma.dispensingEvent.findMany({
    where: {
      pharmacyId,
      timestamp: { gte: startDate },
    },
    select: {
      drugId: true,
      riskScore: true,
    },
  });

  const drugStats: Map<string, { count: number; riskSum: number }> = new Map();

  events.forEach((event: any) => {
    if (!drugStats.has(event.drugId)) {
      drugStats.set(event.drugId, { count: 0, riskSum: 0 });
    }
    const stat = drugStats.get(event.drugId)!;
    stat.count += 1;
    stat.riskSum += event.riskScore;
  });

  return Array.from(drugStats.entries())
    .map(([drugId, stat]) => {
      const details = DRUG_DETAILS[drugId] || { name: drugId, baseRisk: 15 };
      const avgRisk = stat.riskSum / stat.count;
      const interactions = DRUG_INTERACTIONS[drugId] || [];

      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (avgRisk >= 75) riskLevel = 'critical';
      else if (avgRisk >= 60) riskLevel = 'high';
      else if (avgRisk >= 40) riskLevel = 'medium';

      return {
        drugId,
        drugName: details.name,
        riskLevel,
        commonInteractions: interactions,
        frequencyInDataset: stat.count,
        averageRiskScore: avgRisk,
      };
    })
    .sort((a, b) => b.averageRiskScore - a.averageRiskScore);
}

// ============================================
// PHARMACIST PERFORMANCE METRICS
// ============================================

export interface PharmacistPerformance {
  userId: number;
  complianceRate: number;
  averageRiskScore: number;
  totalDispensings: number;
  highRiskCount: number;
  deviationCount: number;
  performanceRating: 'excellent' | 'good' | 'fair' | 'needs-improvement';
}

/**
 * Calculate pharmacist performance metrics
 */
export async function getPharmacistPerformance(
  pharmacyId: string,
  days: number = 30
): Promise<PharmacistPerformance[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const events = await prisma.dispensingEvent.findMany({
    where: {
      pharmacyId,
      timestamp: { gte: startDate },
    },
    select: {
      userId: true,
      riskScore: true,
      riskCategory: true,
      stgCompliant: true,
    },
  });

  const userStats: Map<number, {
    total: number;
    compliant: number;
    highRisk: number;
    riskSum: number;
  }> = new Map();

  events.forEach((event: any) => {
    if (!userStats.has(event.userId)) {
      userStats.set(event.userId, { total: 0, compliant: 0, highRisk: 0, riskSum: 0 });
    }

    const stat = userStats.get(event.userId)!;
    stat.total += 1;
    if (event.stgCompliant) stat.compliant += 1;
    if (['high', 'critical'].includes(event.riskCategory)) stat.highRisk += 1;
    stat.riskSum += event.riskScore;
  });

  return Array.from(userStats.entries()).map(([userId, stat]) => {
    const complianceRate = (stat.compliant / stat.total) * 100;
    const avgRisk = stat.riskSum / stat.total;

    let performanceRating: 'excellent' | 'good' | 'fair' | 'needs-improvement' = 'good';
    if (complianceRate >= 95 && avgRisk < 30) performanceRating = 'excellent';
    else if (complianceRate < 80 || avgRisk > 50) performanceRating = 'needs-improvement';
    else if (complianceRate < 88 || avgRisk > 40) performanceRating = 'fair';

    return {
      userId,
      complianceRate,
      averageRiskScore: avgRisk,
      totalDispensings: stat.total,
      highRiskCount: stat.highRisk,
      deviationCount: stat.total - stat.compliant,
      performanceRating,
    };
  });
}

// ============================================
// FRAUD DETECTION PATTERNS
// ============================================

export interface FraudAlert {
  type: 'unusual-volume' | 'high-risk-cluster' | 'pattern-deviation' | 'compliance-breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  dataPoints: number;
  recommendedAction: string;
}

/**
 * Detect potential fraud patterns
 */
export async function detectFraudPatterns(
  pharmacyId: string,
  days: number = 30
): Promise<FraudAlert[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const events = await prisma.dispensingEvent.findMany({
    where: {
      pharmacyId,
      timestamp: { gte: startDate },
    },
    select: {
      timestamp: true,
      riskCategory: true,
      stgCompliant: true,
      quantity: true,
    },
  });

  const alerts: FraudAlert[] = [];

  // Pattern 1: Unusual volume spikes
  const dailyVolume: Map<string, number> = new Map();
  events.forEach((e: any) => {
    const date = new Date(e.timestamp).toISOString().split('T')[0];
    dailyVolume.set(date, (dailyVolume.get(date) || 0) + 1);
  });

  const avgVolume = Array.from(dailyVolume.values()).reduce((a, b) => a + b, 0) / dailyVolume.size;
  const volumeStdDev = Math.sqrt(
    Array.from(dailyVolume.values()).reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) /
      dailyVolume.size
  );

  for (const [date, volume] of dailyVolume) {
    if (volume > avgVolume + 2 * volumeStdDev) {
      alerts.push({
        type: 'unusual-volume',
        severity: volume > avgVolume + 3 * volumeStdDev ? 'critical' : 'high',
        description: `Unusual dispensing volume on ${date}: ${volume} events (average: ${avgVolume.toFixed(0)})`,
        dataPoints: volume,
        recommendedAction: 'Review daily dispensing logs and check for data entry errors',
      });
    }
  }

  // Pattern 2: High-risk event clusters
  const highRiskEvents = events.filter((e: any) => ['high', 'critical'].includes(e.riskCategory));
  if (highRiskEvents.length > events.length * 0.2) {
    alerts.push({
      type: 'high-risk-cluster',
      severity: highRiskEvents.length > events.length * 0.3 ? 'critical' : 'high',
      description: `High concentration of risk events: ${highRiskEvents.length} out of ${events.length} (${((highRiskEvents.length / events.length) * 100).toFixed(1)}%)`,
      dataPoints: highRiskEvents.length,
      recommendedAction: 'Investigate potential drug interactions or data quality issues',
    });
  }

  // Pattern 3: Compliance breaches
  const nonCompliant = events.filter((e: any) => !e.stgCompliant);
  if (nonCompliant.length > events.length * 0.15) {
    alerts.push({
      type: 'compliance-breach',
      severity: nonCompliant.length > events.length * 0.25 ? 'critical' : 'high',
      description: `Elevated compliance deviations: ${nonCompliant.length} out of ${events.length} (${((nonCompliant.length / events.length) * 100).toFixed(1)}%)`,
      dataPoints: nonCompliant.length,
      recommendedAction: 'Review STG guidelines and provide staff training',
    });
  }

  // Pattern 4: Unusual quantity patterns
  const quantityStats = {
    avg: events.reduce((sum: number, e: any) => sum + e.quantity, 0) / events.length,
    max: Math.max(...events.map((e: any) => e.quantity)),
    min: Math.min(...events.map((e: any) => e.quantity)),
  };

  const unusualQuantities = events.filter((e: any) => e.quantity > quantityStats.avg * 2);
  if (unusualQuantities.length > events.length * 0.05) {
    alerts.push({
      type: 'pattern-deviation',
      severity: 'medium',
      description: `${unusualQuantities.length} dispensings with abnormally high quantities detected`,
      dataPoints: unusualQuantities.length,
      recommendedAction: 'Verify large quantity dispensings for legitimacy',
    });
  }

  return alerts;
}

// ============================================
// PRESCRIPTION ABUSE DETECTION
// ============================================

export interface PrescriptionAbuseIndicator {
  drugId: string;
  drugName: string;
  suspicionLevel: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  recommendedReview: boolean;
}

/**
 * Detect potential prescription abuse patterns
 */
export async function detectPrescriptionAbuse(
  pharmacyId: string,
  days: number = 90
): Promise<PrescriptionAbuseIndicator[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const prescriptions = await prisma.dispensingEvent.findMany({
    where: {
      pharmacyId,
      isPrescription: true,
      timestamp: { gte: startDate },
    },
    select: {
      drugId: true,
      genericName: true,
      riskCategory: true,
      quantity: true,
      isControlledDrug: true,
    },
  });

  const drugAnalysis: Map<string, {
    name: string;
    count: number;
    highRiskCount: number;
    totalQuantity: number;
    avgQuantity: number;
    isControlled: boolean;
  }> = new Map();

  prescriptions.forEach((p: any) => {
    if (!drugAnalysis.has(p.drugId)) {
      drugAnalysis.set(p.drugId, {
        name: p.genericName,
        count: 0,
        highRiskCount: 0,
        totalQuantity: 0,
        avgQuantity: 0,
        isControlled: p.isControlledDrug,
      });
    }

    const analysis = drugAnalysis.get(p.drugId)!;
    analysis.count += 1;
    analysis.totalQuantity += p.quantity;
    analysis.avgQuantity = analysis.totalQuantity / analysis.count;
    if (['high', 'critical'].includes(p.riskCategory)) {
      analysis.highRiskCount += 1;
    }
  });

  const indicators: PrescriptionAbuseIndicator[] = [];

  drugAnalysis.forEach((analysis: any, drugId: string) => {
    const signs: string[] = [];
    let suspicionLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // High-risk drug with frequent prescriptions
    if (analysis.isControlled && analysis.count > 20) {
      signs.push('Frequent controlled substance prescriptions');
      suspicionLevel = 'high';
    }

    // Unusually high average quantities
    if (analysis.avgQuantity > 50) {
      signs.push(`High average quantity per prescription: ${analysis.avgQuantity.toFixed(0)}`);
      suspicionLevel = suspicionLevel === 'low' ? 'medium' : suspicionLevel;
    }

    // High proportion of high-risk events
    const highRiskRatio = analysis.highRiskCount / analysis.count;
    if (highRiskRatio > 0.3) {
      signs.push(`High-risk rate: ${(highRiskRatio * 100).toFixed(1)}%`);
      suspicionLevel = 'high';
    }

    if (signs.length > 0) {
      indicators.push({
        drugId,
        drugName: analysis.name,
        suspicionLevel,
        indicators: signs,
        recommendedReview: suspicionLevel !== 'low',
      });
    }
  });

  return indicators.sort((a, b) => {
    const severityMap = { low: 0, medium: 1, high: 2, critical: 3 };
    return severityMap[b.suspicionLevel] - severityMap[a.suspicionLevel];
  });
}

export default {
  getComplianceTrends,
  analyzeDrugInteractions,
  getPharmacistPerformance,
  detectFraudPatterns,
  detectPrescriptionAbuse,
};
