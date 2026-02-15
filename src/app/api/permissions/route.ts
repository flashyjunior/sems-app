import { NextRequest, NextResponse } from 'next/server';
import { listPermissions } from '@/services/role.service';
import { withAuth } from '@/lib/auth-middleware';
import { setCORSHeaders, handleCORS } from '@/lib/cors';
import { AuthenticatedRequest } from '@/lib/auth-middleware';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'GET') {
      // List all permissions
      const permissions = await listPermissions();
      const response = NextResponse.json({ success: true, data: permissions }, { status: 200 });
      return setCORSHeaders(response, req.headers.get('origin') || undefined);
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Error in permissions API:', error);
    return setCORSHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      ),
      req.headers.get('origin') || undefined
    );
  }
}

export const GET = withAuth(handler);
export const OPTIONS = handleCORS;
