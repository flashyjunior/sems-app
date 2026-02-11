/**
 * Fraud Detection API
 * GET /api/analytics/advanced/fraud-detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { detectFraudPatterns } from '@/services/analytics/advancedAnalytics';

export async function GET(request: NextRequest) {
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
    const mediumAlerts = alerts.filter(a => a.severity === 'medium');
    const lowAlerts = alerts.filter(a => a.severity === 'low');

    return NextResponse.json({
      data: { alerts },
      summary: {
        totalAlerts: alerts.length,
        criticalCount: criticalAlerts.length,
        highCount: highAlerts.length,
        mediumCount: mediumAlerts.length,
        lowCount: lowAlerts.length,
        requiresAction: criticalAlerts.length > 0,
        period: `${daysStr} days`,
      },
      recommendations:
        criticalAlerts.length > 0
          ? '[ALERT] URGENT: Critical fraud indicators detected. Immediate review recommended.'
          : highAlerts.length > 0
            ? '[WARN] WARNING: High-risk patterns detected. Review recommended within 24 hours.'
            : '[OK] No critical issues detected.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in fraud detection:', error);
    return NextResponse.json(
      { error: 'Failed to detect fraud patterns' },
      { status: 500 }
    );
  }
}
