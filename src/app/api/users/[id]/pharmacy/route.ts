import { NextRequest, NextResponse } from 'next/server';
import { updateUser, getUserById } from '@/services/user.service';
import { withAuth } from '@/lib/auth-middleware';
import { setCORSHeaders, handleCORS } from '@/lib/cors';
import { withRateLimit, getClientIP } from '@/lib/rate-limit';
import { createActivityLog } from '@/services/activity-log.service';
import { logInfo, logError } from '@/lib/logger';
import { AuthenticatedRequest } from '@/lib/auth-middleware';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // extract user id from url
    const url = new URL(req.url);
    const idMatch = url.pathname.match(/\/api\/users\/(\d+)\/pharmacy/);
    if (!idMatch) {
      return setCORSHeaders(
        NextResponse.json({ error: 'Invalid user ID' }, { status: 400 }),
        req.headers.get('origin') || undefined
      );
    }
    const userId = parseInt(idMatch[1]);

    if (req.method === 'PUT') {
      const body = await req.json().catch(() => null);
      // handle invalid/missing JSON body
      if (!body) {
        return setCORSHeaders(
          NextResponse.json({ error: 'Invalid or empty JSON body' }, { status: 400 }),
          req.headers.get('origin') || undefined
        );
      }

      // allow pharmacyId to be number, numeric string, or null/empty to clear assignment
      let pharmacyId: number | null | undefined = undefined;
      if (Object.prototype.hasOwnProperty.call(body, 'pharmacyId')) {
        const raw = body.pharmacyId;
        if (raw === null || raw === '' || raw === undefined) {
          pharmacyId = null;
        } else if (typeof raw === 'number') {
          pharmacyId = raw;
        } else if (typeof raw === 'string') {
          const parsed = parseInt(raw, 10);
          pharmacyId = Number.isNaN(parsed) ? null : parsed;
        } else {
          pharmacyId = null;
        }
      } else {
        return setCORSHeaders(
          NextResponse.json({ error: 'pharmacyId is required' }, { status: 400 }),
          req.headers.get('origin') || undefined
        );
      }

      // confirm user exists
      const user = await getUserById(userId);
      if (!user) {
        return setCORSHeaders(
          NextResponse.json({ error: 'User not found' }, { status: 404 }),
          req.headers.get('origin') || undefined
        );
      }

      const updated = await updateUser(userId, { pharmacyId } as any);

      await createActivityLog(
        req.user!.userId,
        'ASSIGN_PHARMACY',
        'user',
        userId.toString(),
        { pharmacyId },
        getClientIP(req),
        req.headers.get('user-agent') || undefined
      );

      logInfo('User pharmacy assignment updated', { userId, pharmacyId, updatedBy: req.user!.userId });

      const response = NextResponse.json({ success: true, user: updated }, { status: 200 });
      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    } else {
      return setCORSHeaders(
        NextResponse.json({ error: 'Method not allowed' }, { status: 405 }),
        req.headers.get('origin') || undefined
      );
    }
  } catch (error) {
    logError('Error in user pharmacy assignment endpoint', error);
    const response = NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
    return setCORSHeaders(response, req.headers.get('origin') || undefined);
  }
}

export const PUT = withRateLimit(withAuth(handler));
export const OPTIONS = (req: NextRequest) => {
  const corsResponse = handleCORS(req);
  return corsResponse || new NextResponse(null, { status: 204 });
};
