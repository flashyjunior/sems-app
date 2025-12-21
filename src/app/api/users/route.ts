import { NextRequest, NextResponse } from 'next/server';
import { listUsers, createUser } from '@/services/user.service';
import { userCreateSchema, paginationSchema } from '@/lib/validations';
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
      // List users with pagination
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');

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

      const result = await listUsers(page, limit);
      const response = NextResponse.json(result, { status: 200 });
      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    } else if (req.method === 'POST') {
      // Create new user
      const body = await req.json();

      const validation = userCreateSchema.safeParse(body);
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

      const user = await createUser(validation.data);

      await createActivityLog(
        req.user!.userId,
        'CREATE_USER',
        'user',
        user.id.toString(),
        { email: user.email, fullName: user.fullName },
        getClientIP(req),
        req.headers.get('user-agent') || undefined
      );

      logInfo('User created via API', { createdBy: req.user!.userId, userId: user.id });

      const response = NextResponse.json(
        { success: true, user },
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
    logError('Error in users endpoint', error);
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
