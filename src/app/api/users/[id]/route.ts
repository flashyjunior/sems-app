import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser, deleteUser, deactivateUser } from '@/services/user.service';
import { userUpdateSchema } from '@/lib/validations';
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
    // Extract ID from URL
    const url = new URL(req.url);
    const idMatch = url.pathname.match(/\/api\/users\/(\d+)/);
    if (!idMatch) {
      return setCORSHeaders(
        NextResponse.json({ error: 'Invalid user ID' }, { status: 400 }),
        req.headers.get('origin') || undefined
      );
    }
    const userId = parseInt(idMatch[1]);

    if (req.method === 'GET') {
      // Get user details
      const user = await getUserById(userId);
      
      if (!user) {
        return setCORSHeaders(
          NextResponse.json({ error: 'User not found' }, { status: 404 }),
          req.headers.get('origin') || undefined
        );
      }

      const response = NextResponse.json({ success: true, user }, { status: 200 });
      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    } else if (req.method === 'PUT') {
      // Update user
      const body = await req.json();

      const validation = userUpdateSchema.safeParse(body);
      if (!validation.success) {
        return setCORSHeaders(
          NextResponse.json(
            { 
              error: 'Invalid request data',
              details: validation.error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message
              }))
            },
            { status: 400 }
          ),
          req.headers.get('origin') || undefined
        );
      }

      const user = await updateUser(userId, validation.data);

      await createActivityLog(
        req.user!.userId,
        'UPDATE_USER',
        'user',
        userId.toString(),
        validation.data,
        getClientIP(req),
        req.headers.get('user-agent') || undefined
      );

      logInfo('User updated via API', { updatedBy: req.user!.userId, userId });

      const response = NextResponse.json(
        { success: true, user },
        { status: 200 }
      );
      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    } else if (req.method === 'DELETE') {
      // Delete user
      const body = await req.json();
      const action = body?.deactivate ? 'deactivateUser' : 'deleteUser';

      if (body?.deactivate) {
        await deactivateUser(userId);
      } else {
        await deleteUser(userId);
      }

      await createActivityLog(
        req.user!.userId,
        action.toUpperCase(),
        'user',
        userId.toString(),
        undefined,
        getClientIP(req),
        req.headers.get('user-agent') || undefined
      );

      logInfo(`User ${action}d via API`, { userId, deletedBy: req.user!.userId });

      const response = NextResponse.json(
        { success: true, message: `User ${action === 'deleteUser' ? 'deleted' : 'deactivated'}` },
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
    logError('Error in user detail endpoint', error);
    const response = NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
    return setCORSHeaders(response, req.headers.get('origin') || undefined);
  }
}

export const GET = withRateLimit(withAuth(handler));
export const PUT = withRateLimit(withAuth(handler));
export const DELETE = withRateLimit(withAuth(handler));
export const OPTIONS = (req: NextRequest) => {
  const corsResponse = handleCORS(req);
  return corsResponse || new NextResponse(null, { status: 204 });
};
