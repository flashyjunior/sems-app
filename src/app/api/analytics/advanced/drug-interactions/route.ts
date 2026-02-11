/**
 * Drug Interactions API
 * GET /api/analytics/advanced/drug-interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeDrugInteractions } from '@/services/analytics/advancedAnalytics';

export async function GET(request: NextRequest) {
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
        period: `${daysStr} days`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in drug interactions:', error);
    return NextResponse.json(
      { error: 'Failed to analyze drug interactions' },
      { status: 500 }
    );
  }
}
