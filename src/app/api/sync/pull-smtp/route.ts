import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { setCORSHeaders, handleCORS } from '@/lib/cors';
import { logInfo, logError } from '@/lib/logger';

/**
 * GET /api/sync/pull-smtp
 * Fetch SMTP settings from PostgreSQL (admin only)
 * 
 * This endpoint syncs SMTP configuration from cloud to client
 * clients can cache this locally and use for email sending
 */
async function handleGET(req: AuthenticatedRequest): Promise<NextResponse> {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    if (!req.user?.userId) {
      return setCORSHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        req.headers.get('origin') || undefined
      );
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { role: true },
    });

    if (!user || user.role?.name !== 'admin') {
      return setCORSHeaders(
        NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 }),
        req.headers.get('origin') || undefined
      );
    }

    // Fetch SMTP settings from PostgreSQL
    const smtpSettings = await prisma.sMTPSettings.findFirst();

    logInfo('Fetched SMTP settings for sync', { 
      found: !!smtpSettings,
      enabled: smtpSettings?.enabled,
    });

    if (!smtpSettings) {
      // Return empty/default SMTP settings
      return setCORSHeaders(
        NextResponse.json(
          {
            success: true,
            message: 'No SMTP settings configured',
            data: null,
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        ),
        req.headers.get('origin') || undefined
      );
    }

    // Prepare response without exposing password
    const smtpData = {
      id: smtpSettings.id,
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      username: smtpSettings.username,
      password: '***HIDDEN***', // Never send actual password to client
      fromEmail: smtpSettings.fromEmail,
      fromName: smtpSettings.fromName,
      adminEmail: smtpSettings.adminEmail,
      replyToEmail: smtpSettings.replyToEmail,
      enabled: smtpSettings.enabled,
      testStatus: smtpSettings.testStatus,
      lastTestedAt: smtpSettings.lastTestedAt?.getTime(),
      createdAt: smtpSettings.createdAt.getTime(),
      updatedAt: smtpSettings.updatedAt.getTime(),
    };

    const response = NextResponse.json(
      {
        success: true,
        message: 'SMTP settings fetched successfully',
        data: smtpData,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    return setCORSHeaders(response, req.headers.get('origin') || undefined);
  } catch (error) {
    logError('Error in pull-smtp endpoint', error);
    const response = NextResponse.json(
      {
        error: 'Failed to fetch SMTP settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
    return setCORSHeaders(response, req.headers.get('origin') || undefined);
  }
}

export const GET = withAuth(handleGET);
