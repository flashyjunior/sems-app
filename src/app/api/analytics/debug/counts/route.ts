/**
 * Debug: reconciliation endpoint
 * GET /api/analytics/debug/counts?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&pharmacyId=...
 * Returns raw DB count and aggregated count for quick parity checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';
import { getDashboardSummary } from '@/services/analytics/aggregationEngine';

async function handler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const pharmacyId = searchParams.get('pharmacyId') ?? undefined;

    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // inclusive endDate for user-friendly behavior
    const queryEndDate = new Date(endDate);
    queryEndDate.setDate(queryEndDate.getDate() + 1);

    const whereClause: any = {
      timestamp: {
        gte: startDate,
        lt: queryEndDate,
      },
    };
    if (pharmacyId && pharmacyId !== 'ALL') whereClause.pharmacyId = pharmacyId;

    const rawCount = await prisma.dispensingEvent.count({ where: whereClause });

    const summary = await getDashboardSummary(startDate, queryEndDate, pharmacyId || 'ALL_PHARMACIES');
    const aggregated = summary.totalDispensingS ?? 0;

    return NextResponse.json({
      data: {
        rawCount,
        aggregatedCount: aggregated,
        difference: rawCount - aggregated,
      },
      metadata: {
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0],
        pharmacyId: pharmacyId || 'ALL',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[DPAP] Error in /api/analytics/debug/counts:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
