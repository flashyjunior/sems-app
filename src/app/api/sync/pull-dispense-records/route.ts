import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { setCORSHeaders, handleCORS } from '@/lib/cors';
import { AuthenticatedRequest } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';
import { logInfo, logError } from '@/lib/logger';

/**
 * GET /api/sync/pull-dispense-records
 * Pull all dispense records from cloud to client
 */
async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'POST') {
      // Fetch all dispense records from PostgreSQL
      const pgRecords = await prisma.dispenseRecord.findMany({
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      logInfo('Fetched dispense records from PostgreSQL', { count: pgRecords.length });

      // Convert to client format
      const records = pgRecords.map((record: any) => {
        let doseCalculation: any = null;
        let safetyAcknowledgements: string[] = [];

        try {
          if (record.dose) {
            doseCalculation = typeof record.dose === 'string' ? JSON.parse(record.dose) : record.dose;
          }
        } catch (e) {
          console.error('Error parsing dose:', e);
          doseCalculation = { dose: record.dose, unit: 'mg' };
        }

        try {
          if (record.safetyAcks) {
            safetyAcknowledgements = typeof record.safetyAcks === 'string' ? JSON.parse(record.safetyAcks) : record.safetyAcks;
          }
        } catch (e) {
          console.error('Error parsing safety acks:', e);
          safetyAcknowledgements = [];
        }

        return {
          id: record.externalId || record.id.toString(),
          timestamp: record.createdAt.getTime(),
          pharmacistId: record.userId?.toString() || '',
          pharmacistName: record.user?.fullName || record.user?.email || 'Unknown',
          patientName: record.patientName || '',
          patientPhoneNumber: record.patientPhoneNumber || '',
          patientAge: record.patientAge,
          patientWeight: record.patientWeight,
          drugId: record.drugId,
          drugName: record.drugName,
          dose: doseCalculation || { dose: 0, unit: 'mg' },
          safetyAcknowledgements: safetyAcknowledgements,
          printedAt: record.printedAt?.getTime(),
          syncedAt: record.createdAt.getTime(),
          synced: true,
          isActive: record.isActive,
          deviceId: record.deviceId,
          createdAt: record.createdAt.getTime(),
        };
      });

      logInfo('Prepared dispense records for client', { count: records.length });

      const response = NextResponse.json(
        {
          success: true,
          message: 'Dispense records fetched successfully',
          count: records.length,
          records: records,
        },
        { status: 200 }
      );

      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    } else {
      return new NextResponse('Method not allowed', { status: 405 });
    }
  } catch (error) {
    logError('Error in pull-dispense-records endpoint', error);
    const response = NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch dispense records',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
    return setCORSHeaders(response, req.headers.get('origin') || undefined);
  }
}

export const POST = withAuth(handler);
export const OPTIONS = (req: NextRequest) => {
  const corsResponse = handleCORS(req);
  return corsResponse || new NextResponse(null, { status: 204 });
};
