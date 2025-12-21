import { NextRequest, NextResponse } from 'next/server';
import { getDispenseStats } from '@/services/dispense.service';
import { withAuth } from '@/lib/auth-middleware';
import { setCORSHeaders, handleCORS } from '@/lib/cors';
import { logError } from '@/lib/logger';
import { AuthenticatedRequest } from '@/lib/auth-middleware';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      const filters: any = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          filters.startDate = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          filters.endDate = end;
        }
      }

      const stats = await getDispenseStats(filters);

      const response = NextResponse.json(stats, { status: 200 });
      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    } else {
      return setCORSHeaders(
        NextResponse.json({ error: 'Method not allowed' }, { status: 405 }),
        req.headers.get('origin') || undefined
      );
    }
  } catch (error) {
    logError('Error in dispense stats endpoint', error);
    return setCORSHeaders(
      NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
      req.headers.get('origin') || undefined
    );
  }
}

export const GET = withAuth(handler);
export const OPTIONS = (req: NextRequest) => {
  const corsResponse = handleCORS(req);
  return corsResponse || new NextResponse(null, { status: 204 });
};
