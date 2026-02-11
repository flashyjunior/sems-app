import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { setCORSHeaders, handleCORS } from '@/lib/cors';
import { AuthenticatedRequest } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';
import { logInfo, logError } from '@/lib/logger';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'POST') {
      // Fetch all pharmacies from PostgreSQL
      const pgPharmacies = await prisma.pharmacy.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      logInfo('Fetched pharmacies from PostgreSQL', { count: pgPharmacies.length });

      // Convert to client format
      const pharmacies = pgPharmacies.map((pharmacy: any) => ({
        id: pharmacy.id,
        name: pharmacy.name,
        location: pharmacy.location || undefined,
        address: pharmacy.address || undefined,
        phone: pharmacy.phone || undefined,
        email: pharmacy.email || undefined,
        licenseNumber: pharmacy.licenseNumber || undefined,
        manager: pharmacy.manager || undefined,
        isActive: pharmacy.isActive,
        createdAt: Date.now(),
      }));

      logInfo('Prepared pharmacies for client', { count: pharmacies.length });

      const response = NextResponse.json(
        {
          success: true,
          message: 'Pharmacies fetched successfully',
          count: pharmacies.length,
          pharmacies: pharmacies,
        },
        { status: 200 }
      );

      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    } else {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }
  } catch (error: any) {
    logError('Error in pull-pharmacies', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to fetch pharmacies', details: error.message },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);

export function OPTIONS(request: NextRequest) {
  return handleCORS(request) || new NextResponse(null, { status: 200 });
}
