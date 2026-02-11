/**
 * Pharmacist Performance API
 * GET /api/analytics/advanced/pharmacist-performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPharmacistPerformance } from '@/services/analytics/advancedAnalytics';

export async function GET(request: NextRequest) {
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

    const avgCompliance =
      performance.reduce((sum, p) => sum + p.complianceRate, 0) / performance.length;

    return NextResponse.json({
      data: { performance },
      summary: {
        totalPharmacists: performance.length,
        averageCompliance: parseFloat(avgCompliance.toFixed(2)),
        averageRiskScore: parseFloat(
          (performance.reduce((sum, p) => sum + p.averageRiskScore, 0) / performance.length).toFixed(2)
        ),
        ratingCounts,
        period: `${daysStr} days`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in pharmacist performance:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve pharmacist performance' },
      { status: 500 }
    );
  }
}
