/**
 * Analytics API: High-Risk Alerts Endpoint
 * 
 * GET /api/analytics/dispensing/risk-alerts
 * 
 * Returns high and critical risk dispensing events for safety dashboard
 * 
 * Query Parameters:
 *   - startDate (required): ISO date string (YYYY-MM-DD)
 *   - endDate (required): ISO date string (YYYY-MM-DD)
 *   - pharmacyId (optional): Filter by specific pharmacy
 *   - severity (optional): 'high', 'critical', or 'both' (default: 'both')
 *   - limit (optional): Maximum number of alerts to return (default: 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHighRiskAlerts } from '@/services/analytics/aggregationEngine';

export async function GET(request: NextRequest) {
  try {
    // ============================================
    // 1. Parse and validate query parameters
    // ============================================
    const { searchParams } = new URL(request.url);

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const pharmacyId = searchParams.get('pharmacyId') ?? undefined;
    const severity = (searchParams.get('severity') || 'both') as 'high' | 'critical' | 'both';
    const limitStr = searchParams.get('limit') || '50';

    // Validate dates
    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          message: 'startDate and endDate are required (format: YYYY-MM-DD)',
        },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Treat endDate as inclusive for alert queries
    const queryEndDate = new Date(endDate);
    queryEndDate.setDate(queryEndDate.getDate() + 1);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Invalid date format',
          message: 'Use ISO 8601 format: YYYY-MM-DD',
        },
        { status: 400 }
      );
    }

    // Validate severity
    if (!['high', 'critical', 'both'].includes(severity)) {
      return NextResponse.json(
        {
          error: 'Invalid severity',
          message: 'severity must be "high", "critical", or "both"',
        },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(limitStr, 10) || 50, 500);

    // ============================================
    // 2. Query risk alerts
    // ============================================
    const alerts = await getHighRiskAlerts(startDate, queryEndDate, pharmacyId, severity);
    const limitedAlerts = alerts.slice(0, limit);

    // ============================================
    // 3. Format response
    // ============================================
    const criticalCount = limitedAlerts.filter(a => a.riskCategory === 'critical').length;
    const highCount = limitedAlerts.filter(a => a.riskCategory === 'high').length;

    const response = {
      data: {
        alerts: limitedAlerts.map(alert => ({
          id: alert.id,
          timestamp: alert.timestamp.toISOString(),
          pharmacyId: alert.pharmacyId,
          drugId: alert.drugId,
          riskCategory: alert.riskCategory,
          riskScore: alert.riskScore,
          riskReason: alert.riskReason || 'N/A',
          isPrescription: alert.isPrescription,
          isControlledDrug: alert.isControlledDrug,
          isAntibiotic: alert.isAntibiotic,
        })),
      },

      summary: {
        totalAlerts: limitedAlerts.length,
        criticalCount,
        highCount,
        severity,
      },

      metadata: {
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0],
        pharmacyId: pharmacyId || 'ALL',
        limitApplied: limit < alerts.length,
        totalAvailable: alerts.length,
        timestamp: new Date().toISOString(),
      },

      insights: {
        riskLevel: criticalCount > 0 ? 'CRITICAL' : highCount > 5 ? 'HIGH' : highCount > 0 ? 'MODERATE' : 'LOW',
        recommendation: 
          criticalCount > 0 ? 'URGENT: Review critical risk alerts immediately' :
          highCount > 10 ? 'Review high-risk patterns for potential issues' :
          highCount > 0 ? 'Monitor high-risk dispensing events' :
          'No significant risk alerts detected',
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[DPAP] Error in /api/analytics/dispensing/risk-alerts:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to retrieve risk alerts',
        code: 'RISK_ALERTS_ERROR',
      },
      { status: 500 }
    );
  }
}
