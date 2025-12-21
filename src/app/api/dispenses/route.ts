import { NextRequest, NextResponse } from 'next/server';
import {
  createDispenseRecord,
  listDispenseRecords,
  getDispenseByExternalId,
  getDispenseStats,
} from '@/services/dispense.service';
import { dispenseCreateSchema, paginationSchema } from '@/lib/validations';
import { withAuth } from '@/lib/auth-middleware';
import { setCORSHeaders, handleCORS } from '@/lib/cors';
import { getClientIP } from '@/lib/rate-limit';
import { createActivityLog } from '@/services/activity-log.service';
import { logInfo, logError } from '@/lib/logger';
import { writeLog } from '@/lib/file-logger';
import { AuthenticatedRequest } from '@/lib/auth-middleware';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'GET') {
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

      const result = await listDispenseRecords(page, limit, filters);

      const response = NextResponse.json(result, { status: 200 });
      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    } else if (req.method === 'POST') {
      // Create new dispense record
      const body = await req.json();

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

      // Check for duplicate (idempotency)
      let existing = null;
      try {
        existing = await getDispenseByExternalId(validation.data.externalId);
      } catch (dbError) {
        logError('Error checking for duplicate dispense', dbError);
        // Continue anyway - it might be a DB connection issue
      }

      if (existing) {
        const response = NextResponse.json(
          {
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
    } else {
      return setCORSHeaders(
        NextResponse.json({ error: 'Method not allowed' }, { status: 405 }),
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
export const OPTIONS = (req: NextRequest) => {
  const corsResponse = handleCORS(req);
  return corsResponse || new NextResponse(null, { status: 204 });
};

