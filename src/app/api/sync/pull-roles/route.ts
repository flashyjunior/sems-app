import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { setCORSHeaders, handleCORS } from '@/lib/cors';
import { AuthenticatedRequest } from '@/lib/auth-middleware';
import prisma from '@/lib/prisma.server';
import { db } from '@/lib/db';
import { logInfo, logError } from '@/lib/logger';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method === 'POST') {
      // Fetch all roles from PostgreSQL
      const pgRoles = await prisma.role.findMany({
        include: {
          permissions: true,
        },
      });

      logInfo('Fetched roles from PostgreSQL', { count: pgRoles.length });

      // Convert to IndexDB format and save locally
      const localRoles = pgRoles.map((role: any) => ({
        id: role.id.toString(),
        name: role.name,
        description: role.description || '',
        permissions: role.permissions.map((p: any) => ({
          id: p.id.toString(),
          name: p.name,
          description: p.description || '',
        })),
        createdAt: Date.now(),
      }));

      // Add/update roles in IndexDB (note: Dexie might not have roles table, we'll store in syncMetadata)
      // Or create a roles table if needed - for now just return them
      
      // Store in syncMetadata as reference
      await db.syncMetadata.put({
        key: 'roles',
        value: localRoles,
      });

      logInfo('Synced roles to IndexDB', { count: localRoles.length });

      const response = NextResponse.json(
        {
          success: true,
          message: 'Roles synced successfully',
          count: localRoles.length,
          roles: localRoles,
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
    logError('Error in pull-roles endpoint', error);
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
