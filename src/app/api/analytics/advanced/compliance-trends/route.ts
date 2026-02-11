/**
 * Compliance Trends API
 * GET /api/analytics/advanced/compliance-trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { getComplianceTrends } from '@/services/analytics/advancedAnalytics';

export async function GET(request: NextRequest) {
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
        timestamp: new Date().toISOString(),
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
