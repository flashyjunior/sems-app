import { NextRequest, NextResponse } from 'next/server';
import { listRoles, createRole } from '@/services/role.service';
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
    if (req.method === 'GET') {
      // List all roles
      const roles = await listRoles();
      const response = NextResponse.json({ success: true, data: roles }, { status: 200 });
      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    } else if (req.method === 'POST') {
      // Create role
      const body = await req.json();
      const { name, description, permissionIds } = body;

      if (!name) {
        return setCORSHeaders(
          NextResponse.json({ error: 'Role name is required' }, { status: 400 }),
          req.headers.get('origin') || undefined
        );
      }

      const role = await createRole(name, description, permissionIds);

      await createActivityLog(
        req.user!.userId,
        'CREATE_ROLE',
        'role',
        role.id.toString(),
        { name, description },
        getClientIP(req),
        req.headers.get('user-agent') || undefined
      );

      logInfo('Role created via API', { createdBy: req.user!.userId, roleId: role.id });

      const response = NextResponse.json(
        { success: true, role },
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
    logError('Error in roles endpoint', error);
    const response = NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
    return setCORSHeaders(response, req.headers.get('origin') || undefined);
  }
}

export const GET = withRateLimit(withAuth(handler));
export const POST = withRateLimit(withAuth(handler));
export const OPTIONS = (req: NextRequest) => {
  const corsResponse = handleCORS(req);
  return corsResponse || new NextResponse(null, { status: 204 });
};
