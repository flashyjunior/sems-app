/**
 * Analytics API: Dispensing Summary Endpoint
 * 
 * GET /api/analytics/dispensing/summary
 * 
 * Queries aggregated dispensing metrics for a date range.
 * Returns KPIs: total prescriptions, OTC count, avg dispensing time, trends
 * 
 * Query Parameters:
 *   - startDate (required): ISO date string (YYYY-MM-DD)
 *   - endDate (required): ISO date string (YYYY-MM-DD)
 *   - pharmacyId (optional): Filter by specific pharmacy
 *   - interval (optional): 'day' or 'hour' grouping
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDashboardSummary } from '@/services/analytics/aggregationEngine';
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
    const interval = searchParams.get('interval') || 'day';

    // Determine which pharmacy to query
    let pharmacyId: string | undefined;
    if (requestedPharmacyId) {
      // Validate access to requested pharmacy
      validatePharmacyAccess(user.pharmacyId, requestedPharmacyId);
      pharmacyId = requestedPharmacyId;
    } else if (scope.isPharmacyUser) {
      // Pharmacy user defaults to their own pharmacy
      pharmacyId = user.pharmacyId!;
    } else {
      // HQ user without specified pharmacy - shows all pharmacies
      pharmacyId = undefined;
    }

    // Validate date parameters
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

    // Treat endDate as inclusive (user expects events on endDate to be included)
    const queryEndDate = new Date(endDate);
    queryEndDate.setDate(queryEndDate.getDate() + 1);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          error: 'Invalid date format',
          message: 'Use ISO 8601 format: YYYY-MM-DD (e.g., 2026-02-01)',
        },
        { status: 400 }
      );
    }

    // Validate interval
    if (!['day', 'hour'].includes(interval)) {
      return NextResponse.json(
        {
          error: 'Invalid interval',
          message: 'interval must be "day" or "hour"',
        },
        { status: 400 }
      );
    }

    // ============================================
    // 3. Query analytics data
    // ============================================
    const summary = await getDashboardSummary(startDate, queryEndDate, pharmacyId || 'ALL_PHARMACIES');

    // ============================================
    // 4. Format response
    // ============================================
    const response = {
      data: {
        totalPrescriptions: summary.totalPrescriptions,
        totalOTC: summary.totalOTC,
        totalDispensingS: summary.totalDispensingS,
        avgDispensingTime: Number(summary.avgDispensingTime.toFixed(2)),
        prescriptionRatio: Number(summary.prescriptionRatio.toFixed(3)),

        // Daily trend data
        trend: summary.peakHours.map((ph) => ({
          hour: ph.hour,
          count: ph.count,
          prescriptionCount: ph.prescriptionCount,
        })),

        // Risk metrics
        highRiskEvents: summary.totalHighRiskEvents,
        stgComplianceRate: Number(summary.stgComplianceRate.toFixed(2)),
      },

      metadata: {
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0],
        pharmacyId,
        interval,
        userScope: {
          isHQUser: scope.isHQUser,
          isPharmacyUser: scope.isPharmacyUser,
        },
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[DPAP] Error in /api/analytics/dispensing/summary:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to retrieve analytics data',
        code: 'ANALYTICS_ERROR',
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
