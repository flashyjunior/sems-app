import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { setCORSHeaders, handleCORS } from '@/lib/cors';
import { AuthenticatedRequest } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma';
import { logInfo, logError } from '@/lib/logger';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'POST') {
      // Fetch all users from PostgreSQL with their roles
      const pgUsers = await prisma.user.findMany({
        include: {
          role: true,
        },
      });

      logInfo('Fetched users from PostgreSQL', { count: pgUsers.length });

      // Convert to client format
      const users = pgUsers.map((user: any) => ({
        id: user.id.toString(),
        username: user.email,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        licenseNumber: user.licenseNumber,
        specialization: user.specialization,
        isActive: user.isActive,
        role: (user.role?.name || 'pharmacist') as any,
        createdAt: Date.now(),
      }));

      logInfo('Prepared users for client', { count: users.length });

      const response = NextResponse.json(
        {
          success: true,
          message: 'Users fetched successfully',
          count: users.length,
          users: users,
        },
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
    logError('Error in pull-users endpoint', error);
    const response = NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
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
