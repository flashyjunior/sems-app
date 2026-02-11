/**
 * Prescription Abuse Detection API
 * GET /api/analytics/advanced/prescription-abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { detectPrescriptionAbuse } from '@/services/analytics/advancedAnalytics';

export async function GET(request: NextRequest) {
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
    const mediumDrugs = abuses.filter(a => a.suspicionLevel === 'medium');
    const lowDrugs = abuses.filter(a => a.suspicionLevel === 'low');

    return NextResponse.json({
      data: { indicators: abuses },
      summary: {
        totalDrugsAnalyzed: abuses.length,
        criticalRiskDrugs: criticalDrugs.length,
        highRiskDrugs: highDrugs.length,
        mediumRiskDrugs: mediumDrugs.length,
        lowRiskDrugs: lowDrugs.length,
        drugsRequiringReview: abuses.filter(a => a.recommendedReview).length,
        period: `${daysStr} days`,
      },
      recommendations:
        criticalDrugs.length > 0
          ? '[ALERT] URGENT: Critical abuse indicators detected for controlled substances. Immediate investigation required.'
          : highDrugs.length > 0
            ? '[WARN] WARNING: Review high-risk prescription patterns for potential abuse.'
            : '[OK] No immediate concerns detected.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in prescription abuse detection:', error);
    return NextResponse.json(
      { error: 'Failed to detect prescription abuse' },
      { status: 500 }
    );
  }
}
