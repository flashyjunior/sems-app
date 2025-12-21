import { NextRequest, NextResponse } from 'next/server';
import { getActivityLogs } from '@/services/activity-log.service';
import { paginationSchema } from '@/lib/validations';
import { withAuth } from '@/lib/auth-middleware';
import { setCORSHeaders, handleCORS } from '@/lib/cors';
import { withRateLimit } from '@/lib/rate-limit';
import { logError } from '@/lib/logger';
import { AuthenticatedRequest } from '@/lib/auth-middleware';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'GET') {
      // Get activity logs with filtering and pagination
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const userId = searchParams.get('userId');
      const action = searchParams.get('action');
      const resource = searchParams.get('resource');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

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

      const filters = {
        userId: userId ? parseInt(userId) : undefined,
        action: action || undefined,
        resource: resource || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };

      const result = await getActivityLogs(page, limit, filters);

      const response = NextResponse.json(
        { success: true, ...result },
        { status: 200 }
      );
      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    } else {
      return setCORSHeaders(
        NextResponse.json({ error: 'Method not allowed' }, { status: 405 }),
        req.headers.get('origin') || undefined
      );
    }
  } catch (error) {
    logError('Error in activity logs endpoint', error);
    const response = NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
    return setCORSHeaders(response, req.headers.get('origin') || undefined);
  }
}

export const GET = withRateLimit(withAuth(handler));
export const OPTIONS = (req: NextRequest) => {
  const corsResponse = handleCORS(req);
  return corsResponse || new NextResponse(null, { status: 204 });
};
