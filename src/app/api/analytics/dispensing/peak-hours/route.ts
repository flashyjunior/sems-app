/**
 * Analytics API: Peak Hours Endpoint
 * 
 * GET /api/analytics/dispensing/peak-hours
 * 
 * Returns hour-by-hour dispensing distribution for heatmap visualization
 * 
 * Query Parameters:
 *   - startDate (required): ISO date string (YYYY-MM-DD)
 *   - endDate (required): ISO date string (YYYY-MM-DD)
 *   - pharmacyId (optional): Filter by specific pharmacy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPeakHours } from '@/services/analytics/aggregationEngine';
import { withAuth } from '@/lib/auth-middleware';
import { AuthenticatedRequest } from '@/lib/auth-middleware';
import { getUserScope, validatePharmacyAccess } from '@/lib/user-scope';
import prisma from '@/lib/prisma';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  try {
    // ============================================
    // 1. Get user and determine pharmacy scope
    // ============================================
    const userId = req.user?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's assigned pharmacy
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pharmacyId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const scope = getUserScope(user.pharmacyId);

    // ============================================
    // 2. Parse and validate query parameters
    // ============================================
    const { searchParams } = new URL(req.url);

    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const requestedPharmacyId = searchParams.get('pharmacyId');

    // Determine which pharmacy to query
    let pharmacyId: string | undefined;
    if (requestedPharmacyId) {
      validatePharmacyAccess(user.pharmacyId, requestedPharmacyId);
      pharmacyId = requestedPharmacyId;
    } else if (scope.isPharmacyUser) {
      pharmacyId = user.pharmacyId!;
    } else {
      // HQ user without specified pharmacy - shows all pharmacies
      pharmacyId = undefined;
    }

    // Validate dates
    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          message: 'startDate and endDate are required',
        },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Treat endDate as inclusive for user-facing queries
    const queryEndDate = new Date(endDate);
    queryEndDate.setDate(queryEndDate.getDate() + 1);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Invalid date format',
          message: 'Use format: YYYY-MM-DD',
        },
        { status: 400 }
      );
    }

    // ============================================
    // 3. Query peak hours data
    // ============================================
    const peakHours = await getPeakHours(startDate, queryEndDate, pharmacyId || 'ALL_PHARMACIES');

    // Find peak hour
    const peakHour = peakHours.reduce((max, current) =>
      current.count > max.count ? current : max
    );

    // ============================================
    // 4. Format response
    // ============================================
    const response = {
      data: {
        hours: peakHours.map((ph) => ({
          hour: ph.hour,
          count: ph.count,
          prescriptions: ph.prescriptionCount,
          avgRiskScore: Number(ph.avgRiskScore.toFixed(2)),
        })),

        peakHour: {
          hour: peakHour.hour,
          count: peakHour.count,
          timeRange: `${peakHour.hour}:00 - ${peakHour.hour + 1}:00`,
        },

        statistics: {
          totalTransactions: peakHours.reduce((sum, ph) => sum + ph.count, 0),
          busyHours: peakHours.filter((ph) => ph.count > 0).length,
          avgPerHour: Number(
            (peakHours.reduce((sum, ph) => sum + ph.count, 0) / 24).toFixed(2)
          ),
        },
      },

      metadata: {
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0],
        pharmacyId,
        userScope: {
          isHQUser: scope.isHQUser,
          isPharmacyUser: scope.isPharmacyUser,
        },
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[DPAP] Error in /api/analytics/dispensing/peak-hours:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to retrieve peak hours data',
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
