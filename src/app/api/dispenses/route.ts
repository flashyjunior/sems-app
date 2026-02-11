import { NextRequest, NextResponse } from 'next/server';
import {
  createDispenseRecord,
  listDispenseRecords,
  getDispenseByExternalId,
  getDispenseStats,
  updateDispenseRecord,
} from '@/services/dispense.service';
import { dispenseCreateSchema, paginationSchema } from '@/lib/validations';
import { withAuth } from '@/lib/auth-middleware';
import { setCORSHeaders, handleCORS } from '@/lib/cors';
import { getClientIP } from '@/lib/rate-limit';
import { createActivityLog } from '@/services/activity-log.service';
import { logInfo, logError } from '@/lib/logger';
import { writeLog } from '@/lib/file-logger';
import { AuthenticatedRequest } from '@/lib/auth-middleware';
import { getUserScope } from '@/lib/user-scope';
import prisma from '@/lib/prisma';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'GET') {
      // Get user's pharmacy assignment
      let userPharmacyId: string | null = null;
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.userId },
          select: { pharmacyId: true },
        });
        userPharmacyId = user?.pharmacyId || null;
      } catch (error) {
        logError('Error fetching user pharmacy information', error);
      }

      // List dispense records with pagination and filtering
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const since = searchParams.get('since');
      const pharmacistId = searchParams.get('pharmacistId');

      // Validate pagination
      const paginationValidation = paginationSchema.safeParse({ page, limit });
      if (!paginationValidation.success) {
        return setCORSHeaders(
          NextResponse.json(
            { error: 'Invalid pagination parameters' },
            { status: 400 }
          ),
          req.headers.get('origin') || undefined
        );
      }

      const filters: any = {};
      if (since) {
        const sinceDate = new Date(parseInt(since));
        if (!isNaN(sinceDate.getTime())) {
          filters.startDate = sinceDate;
        }
      }
      if (pharmacistId) {
        filters.userId = parseInt(pharmacistId);
      }

      // Pharmacy-specific users can only see their own pharmacy's records
      if (userPharmacyId) {
        filters.pharmacyId = userPharmacyId;
      }

      const result = await listDispenseRecords(page, limit, filters);

      const response = NextResponse.json(result, { status: 200 });
      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    } else if (req.method === 'POST') {
      // Get user's pharmacy assignment
      let userPharmacyId: string | null = null;
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.userId },
          select: { pharmacyId: true },
        });
        userPharmacyId = user?.pharmacyId || null;
      } catch (error) {
        logError('Error fetching user pharmacy information', error);
        // Continue without pharmacy info, it will be set to null
      }

      // Create new dispense record - parse body early so we can allow payloads that include pharmacyId
      const body = await req.json();

      // If neither the user nor the request body supplies a pharmacyId, reject
      if (!userPharmacyId && !body?.pharmacyId) {
        return setCORSHeaders(
          NextResponse.json(
            {
              error: 'Unauthorized',
              message: 'You must be assigned to a pharmacy to create transactions. Please contact the administrator.',
            },
            { status: 403 }
          ),
          req.headers.get('origin') || undefined
        );
      }

      const validation = dispenseCreateSchema.safeParse(body);
      if (!validation.success) {
        return setCORSHeaders(
          NextResponse.json(
            {
              error: 'Invalid request data',
              details: validation.error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message,
              })),
            },
            { status: 400 }
          ),
          req.headers.get('origin') || undefined
        );
      }

      // Ensure pharmacyId is set from the user's assignment when missing
      if (!validation.data.pharmacyId && userPharmacyId) {
        (validation.data as any).pharmacyId = userPharmacyId;
      }

      // Validate pharmacy access - ensure they can only create for their assigned pharmacy when userPharmacyId exists
      if (body.pharmacyId && userPharmacyId && body.pharmacyId !== userPharmacyId) {
        return setCORSHeaders(
          NextResponse.json(
            {
              error: 'Access denied',
              message: `You can only create dispenses for your assigned pharmacy`,
            },
            { status: 403 }
          ),
          req.headers.get('origin') || undefined
        );
      }

      // Check for duplicate (idempotency)
      let existing = null;
      try {
        existing = await getDispenseByExternalId(validation.data.externalId);
      } catch (dbError) {
        logError('Error checking for duplicate dispense', dbError);
        // Continue anyway - it might be a DB connection issue
      }

      if (existing) {
        // Check if isActive status has changed (record was canceled/activated)
        const hasStatusChange = existing.isActive !== (validation.data.isActive !== false);
        
        if (hasStatusChange && validation.data.isActive !== undefined) {
          // Update the isActive status
          try {
            const updated = await updateDispenseRecord(existing.id, { isActive: validation.data.isActive });
            const response = NextResponse.json(
              {
                success: true,
                message: 'Dispense record updated',
                record: updated,
              },
              { status: 200 }
            );
            return setCORSHeaders(response, req.headers.get('origin') || undefined);
          } catch (updateError) {
            logError('Error updating dispense status', updateError);
          }
        }

        const response = NextResponse.json(
          {
            success: true,
            message: 'Dispense record already exists',
            record: existing,
          },
          { status: 200 }
        );
        return setCORSHeaders(response, req.headers.get('origin') || undefined);
      }

      let dispense = null;
      let dbError = null;
      
      try {
        dispense = await createDispenseRecord(req.user!.userId, validation.data);
      } catch (error) {
        dbError = error;
        const dbErrorMessage = error instanceof Error ? error.message : String(error);
        logError('Error creating dispense record in database', error);
        console.error('Detailed DB Error:', {
          userId: req.user!.userId,
          externalId: validation.data.externalId,
          error: dbErrorMessage,
          errorStack: error instanceof Error ? error.stack : undefined,
        });
        
        // Write detailed database error to file log
        await writeLog({
          timestamp: Date.now(),
          level: 'error',
          category: 'api',
          message: `Database error when creating dispense: ${dbErrorMessage}`,
          data: {
            error: dbErrorMessage,
            externalId: validation.data.externalId,
            patientName: validation.data.patientName,
            userId: req.user!.userId,
          },
          stackTrace: error instanceof Error ? error.stack : undefined,
        });
        
        // Fallback: accept the record anyway so sync can continue
        // In production, this might queue for later retry
        dispense = {
          id: Math.floor(Math.random() * 1000000),
          externalId: validation.data.externalId,
          drugName: validation.data.drugName,
          patientName: validation.data.patientName,
          createdAt: new Date(),
        };
      }

      // Capture analytics event (convert dispense to analytics record)
      if (dispense && !dbError) {
        try {
          const dose = validation.data.dose
            ? typeof validation.data.dose === 'string'
              ? JSON.parse(validation.data.dose)
              : validation.data.dose
            : null;

          // Use server-side processor to record analytics (avoids client-only dependencies)
          const { processDispensingEvent } = await import('@/services/analytics/serverProcessor');
          await processDispensingEvent({
            dispenseRecordId: String(dispense.id),
            timestamp: new Date(),
            pharmacyId: (validation.data.pharmacyId ?? userPharmacyId ?? '') as string,
            userId: req.user!.userId,
            drugId: validation.data.drugId || '',
            drugName: validation.data.drugName || '',
            genericName: validation.data.drugName || null,
            patientAgeGroup: validation.data.patientAge ? (validation.data.patientAge < 12 ? 'paediatric' : validation.data.patientAge > 65 ? 'geriatric' : 'adult') : 'adult',
            isPrescription: true,
            isControlledDrug: false,
            isAntibiotic: false,
            stgCompliant: true,
            patientIsPregnant: false,
            overrideFlag: false,
          });
        } catch (analyticsError) {
          // Log but don't fail if analytics capture fails
          console.warn('Failed to capture analytics event from dispense:', analyticsError);
          logError('Failed to capture analytics event', analyticsError, { dispenseId: dispense.id });
        }
      }

      try {
        await createActivityLog(
          req.user!.userId,
          'CREATE_DISPENSE',
          'dispense',
          dispense.id.toString(),
          { externalId: dispense.externalId, drugName: dispense.drugName },
          getClientIP(req),
          req.headers.get('user-agent') || undefined
        );
      } catch (logError) {
        // Activity log failure should not block the response
        console.error('Failed to create activity log:', logError);
      }

      logInfo('Dispense record created via API', { createdBy: req.user!.userId, dispenseId: dispense.id });

      // If there was a database error, return 500 so sync-manager knows it failed
      if (dbError) {
        const response = NextResponse.json(
          { 
            success: false,
            error: 'Failed to save dispense to database',
            message: dbError instanceof Error ? dbError.message : String(dbError),
          },
          { status: 500 }
        );
        return setCORSHeaders(response, req.headers.get('origin') || undefined);
      }

      const response = NextResponse.json(
        { 
          success: true, 
          dispense,
        },
        { status: 201 }
      );
      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    } else if (req.method === 'PUT') {
      // Update existing dispense record
      const body = await req.json();
      const { id, isActive } = body;

      logInfo('PUT request received', { id, isActive, bodyKeys: Object.keys(body) });

      if (!id) {
        logError('PUT request missing ID', { body });
        return setCORSHeaders(
          NextResponse.json(
            { error: 'Dispense record ID is required' },
            { status: 400 }
          ),
          req.headers.get('origin') || undefined
        );
      }

      try {
        const prisma = (await import('@/lib/prisma')).default;
        // Convert id to number since it comes from sync manager as numeric ID
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        
        logInfo('PUT numericId conversion', { originalId: id, numericId, isNaN: isNaN(numericId) });

        if (isNaN(numericId)) {
          logError('PUT received invalid ID', { originalId: id, numericId });
          return setCORSHeaders(
            NextResponse.json(
              { error: 'Dispense record ID must be a valid number' },
              { status: 400 }
            ),
            req.headers.get('origin') || undefined
          );
        }

        const record = await prisma.dispenseRecord.findFirst({
          where: { id: numericId },
        });

        if (!record) {
          logInfo('PUT record not found', { numericId });
          return setCORSHeaders(
            NextResponse.json(
              { error: 'Dispense record not found' },
              { status: 404 }
            ),
            req.headers.get('origin') || undefined
          );
        }

        const updated = await updateDispenseRecord(numericId, { isActive });

        const response = NextResponse.json(
          {
            success: true,
            message: 'Dispense record updated',
            record: updated,
          },
          { status: 200 }
        );
        return setCORSHeaders(response, req.headers.get('origin') || undefined);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logError('Error updating dispense record', error);
        return setCORSHeaders(
          NextResponse.json(
            { error: 'Failed to update dispense record', details: errorMessage },
            { status: 500 }
          ),
          req.headers.get('origin') || undefined
        );
      }
    } else {
      return setCORSHeaders(
        NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        ),
        req.headers.get('origin') || undefined
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logError('Error in dispenses endpoint', error);
    
    // Write to file log for easier troubleshooting
    await writeLog({
      timestamp: Date.now(),
      level: 'error',
      category: 'api',
      message: `Dispense API error: ${errorMessage}`,
      data: {
        error: errorMessage,
        method: req.method,
        path: req.url,
      },
      stackTrace: errorStack,
    });

    return setCORSHeaders(
      NextResponse.json(
        { 
          error: 'Internal server error',
          message: errorMessage, // Include error message for debugging
          details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        },
        { status: 500 }
      ),
      req.headers.get('origin') || undefined
    );
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
export const PUT = withAuth(handler);
export const OPTIONS = (req: NextRequest) => {
  const corsResponse = handleCORS(req);
  return corsResponse || new NextResponse(null, { status: 204 });
};

