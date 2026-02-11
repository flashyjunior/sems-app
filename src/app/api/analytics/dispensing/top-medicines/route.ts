/**
 * Analytics API: Top Medicines Endpoint
 * 
 * GET /api/analytics/dispensing/top-medicines
 * 
 * Returns the most frequently dispensed medicines for a date range
 * 
 * Query Parameters:
 *   - startDate (required): ISO date string (YYYY-MM-DD)
 *   - endDate (required): ISO date string (YYYY-MM-DD)
 *   - pharmacyId (optional): Filter by specific pharmacy
 *   - limit (optional): Number of results (default: 10, max: 50)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTopMedicines } from '@/services/analytics/aggregationEngine';
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
    const limitStr = searchParams.get('limit') || '10';

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

    // Make endDate inclusive for queries
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

    // Validate limit
    let limit = parseInt(limitStr, 10);
    if (isNaN(limit) || limit < 1) {
      limit = 10;
    }
    if (limit > 50) {
      limit = 50; // Cap at 50
    }

    // ============================================
    // 3. Query top medicines
    // ============================================
    const topMedicines = await getTopMedicines(startDate, queryEndDate, pharmacyId || 'ALL_PHARMACIES', limit);

    // ============================================
    // 4. Format response
    // ============================================
    const response = {
      data: topMedicines.map((medicine) => ({
        drugId: medicine.drugId,
        drugCode: medicine.drugCode,
        genericName: medicine.drugGenericName,
        count: medicine.count,
        prescriptions: medicine.prescriptionCount,
        otc: medicine.otcCount,
        mostCommonRiskLevel: medicine.riskCategory,
      })),

      metadata: {
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0],
        pharmacyId,
        limit,
        resultCount: topMedicines.length,
        userScope: {
          isHQUser: scope.isHQUser,
          isPharmacyUser: scope.isPharmacyUser,
        },
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[DPAP] Error in /api/analytics/dispensing/top-medicines:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to retrieve top medicines data',
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
