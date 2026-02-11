/**
 * Advanced Analytics API Endpoints
 * 
 * GET /api/analytics/advanced/compliance-trends
 * GET /api/analytics/advanced/drug-interactions
 * GET /api/analytics/advanced/pharmacist-performance
 * GET /api/analytics/advanced/fraud-detection
 * GET /api/analytics/advanced/prescription-abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getComplianceTrends,
  analyzeDrugInteractions,
  getPharmacistPerformance,
  detectFraudPatterns,
  detectPrescriptionAbuse,
} from '@/services/analytics/advancedAnalytics';

// ============================================
// Compliance Trends Endpoint
// ============================================
export async function GET_compliance_trends(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const pharmacyId = searchParams.get('pharmacyId') || 'PHA001';

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Missing startDate or endDate' },
        { status: 400 }
      );
    }

    const trends = await getComplianceTrends(
      new Date(startDateStr),
      new Date(endDateStr),
      pharmacyId
    );

    return NextResponse.json({
      data: { trends },
      metadata: {
        startDate: startDateStr,
        endDate: endDateStr,
        pharmacyId,
        pointCount: trends.length,
      },
    });
  } catch (error) {
    console.error('Error in compliance trends:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve compliance trends' },
      { status: 500 }
    );
  }
}

// ============================================
// Drug Interactions Endpoint
// ============================================
export async function GET_drug_interactions(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get('pharmacyId') || 'PHA001';
    const daysStr = searchParams.get('days') || '30';

    const interactions = await analyzeDrugInteractions(
      pharmacyId,
      parseInt(daysStr, 10)
    );

    const highRiskInteractions = interactions.filter(i =>
      ['high', 'critical'].includes(i.riskLevel)
    );

    return NextResponse.json({
      data: { interactions },
      summary: {
        totalDrugs: interactions.length,
        highRiskDrugs: highRiskInteractions.length,
        criticalRiskDrugs: interactions.filter(i => i.riskLevel === 'critical').length,
      },
    });
  } catch (error) {
    console.error('Error in drug interactions:', error);
    return NextResponse.json(
      { error: 'Failed to analyze drug interactions' },
      { status: 500 }
    );
  }
}

// ============================================
// Pharmacist Performance Endpoint
// ============================================
export async function GET_pharmacist_performance(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get('pharmacyId') || 'PHA001';
    const daysStr = searchParams.get('days') || '30';

    const performance = await getPharmacistPerformance(
      pharmacyId,
      parseInt(daysStr, 10)
    );

    const ratingCounts = {
      excellent: performance.filter(p => p.performanceRating === 'excellent').length,
      good: performance.filter(p => p.performanceRating === 'good').length,
      fair: performance.filter(p => p.performanceRating === 'fair').length,
      'needs-improvement': performance.filter(
        p => p.performanceRating === 'needs-improvement'
      ).length,
    };

    return NextResponse.json({
      data: { performance },
      summary: {
        totalPharmacists: performance.length,
        averageCompliance: (
          performance.reduce((sum, p) => sum + p.complianceRate, 0) /
          performance.length
        ).toFixed(2),
        ratingCounts,
      },
    });
  } catch (error) {
    console.error('Error in pharmacist performance:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve pharmacist performance' },
      { status: 500 }
    );
  }
}

// ============================================
// Fraud Detection Endpoint
// ============================================
export async function GET_fraud_detection(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get('pharmacyId') || 'PHA001';
    const daysStr = searchParams.get('days') || '30';

    const alerts = await detectFraudPatterns(
      pharmacyId,
      parseInt(daysStr, 10)
    );

    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const highAlerts = alerts.filter(a => a.severity === 'high');

    return NextResponse.json({
      data: { alerts },
      summary: {
        totalAlerts: alerts.length,
        criticalCount: criticalAlerts.length,
        highCount: highAlerts.length,
        requiresAction: criticalAlerts.length > 0,
      },
      recommendations: criticalAlerts.length > 0
        ? 'URGENT: Critical fraud indicators detected. Immediate review recommended.'
        : 'No critical issues detected.',
    });
  } catch (error) {
    console.error('Error in fraud detection:', error);
    return NextResponse.json(
      { error: 'Failed to detect fraud patterns' },
      { status: 500 }
    );
  }
}

// ============================================
// Prescription Abuse Detection Endpoint
// ============================================
export async function GET_prescription_abuse(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pharmacyId = searchParams.get('pharmacyId') || 'PHA001';
    const daysStr = searchParams.get('days') || '90';

    const abuses = await detectPrescriptionAbuse(
      pharmacyId,
      parseInt(daysStr, 10)
    );

    const criticalDrugs = abuses.filter(a => a.suspicionLevel === 'critical');
    const highDrugs = abuses.filter(a => a.suspicionLevel === 'high');

    return NextResponse.json({
      data: { indicators: abuses },
      summary: {
        totalDrugsAnalyzed: abuses.length,
        criticalRiskDrugs: criticalDrugs.length,
        highRiskDrugs: highDrugs.length,
        drugsRequiringReview: abuses.filter(a => a.recommendedReview).length,
      },
      recommendations:
        criticalDrugs.length > 0
          ? 'URGENT: Critical abuse indicators detected for controlled substances.'
          : highDrugs.length > 0
            ? 'Review high-risk prescription patterns for potential abuse.'
            : 'No immediate concerns detected.',
    });
  } catch (error) {
    console.error('Error in prescription abuse detection:', error);
    return NextResponse.json(
      { error: 'Failed to detect prescription abuse' },
      { status: 500 }
    );
  }
}

// Export handlers for individual routes
export const handlers = {
  complianceTrends: GET_compliance_trends,
  drugInteractions: GET_drug_interactions,
  pharmacistPerformance: GET_pharmacist_performance,
  fraudDetection: GET_fraud_detection,
  prescriptionAbuse: GET_prescription_abuse,
};
