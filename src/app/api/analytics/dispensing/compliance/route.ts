/**
 * Analytics API: STG Compliance Statistics Endpoint
 * 
 * GET /api/analytics/dispensing/compliance
 * 
 * Returns STG compliance metrics: compliant count, deviations, compliance rate, top deviations
 * 
 * Query Parameters:
 *   - startDate (required): ISO date string (YYYY-MM-DD)
 *   - endDate (required): ISO date string (YYYY-MM-DD)
 *   - pharmacyId (optional): Filter by specific pharmacy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSTGComplianceStats } from '@/services/analytics/aggregationEngine';

export async function GET(request: NextRequest) {
  try {
    // ============================================
    // 1. Parse and validate query parameters
    // ============================================
    const { searchParams } = new URL(request.url);

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const pharmacyId = searchParams.get('pharmacyId') ?? undefined;

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

    // Use inclusive endDate (include events on the endDate)
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

    // ============================================
    // 2. Query compliance statistics
    // ============================================
    const complianceStats = await getSTGComplianceStats(startDate, queryEndDate, pharmacyId);

    // ============================================
    // 3. Format response
    // ============================================
    const response = {
      data: {
        compliantCount: complianceStats.compliantCount,
        deviationCount: complianceStats.deviationCount,
        complianceRate: Number(complianceStats.complianceRate.toFixed(2)),
        topDeviations: complianceStats.topDeviations,
        
        // Additional calculated metrics
        totalEvents: complianceStats.compliantCount + complianceStats.deviationCount,
        deviationPercentage: Number(
          ((complianceStats.deviationCount / (complianceStats.compliantCount + complianceStats.deviationCount)) * 100).toFixed(2)
        ),
      },

      metadata: {
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0],
        pharmacyId: pharmacyId || 'ALL',
        timestamp: new Date().toISOString(),
      },

      insights: {
        status: complianceStats.complianceRate >= 95 ? 'EXCELLENT' : 
                complianceStats.complianceRate >= 85 ? 'GOOD' : 
                complianceStats.complianceRate >= 75 ? 'FAIR' : 'NEEDS_IMPROVEMENT',
        recommendation: complianceStats.deviationCount > 0 
          ? `Review ${complianceStats.topDeviations[0]} - most common deviation` 
          : 'Keep up excellent compliance!',
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[DPAP] Error in /api/analytics/dispensing/compliance:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to retrieve compliance statistics',
        code: 'COMPLIANCE_STATS_ERROR',
      },
      { status: 500 }
    );
  }
}
