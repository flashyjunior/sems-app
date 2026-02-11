import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { processDispensingEvent } from '@/services/analytics/serverProcessor';
import { setCORSHeaders } from '@/lib/cors';
import { withAuth } from '@/lib/auth-middleware';
import { logError, logInfo } from '@/lib/logger';

async function handler(req: NextRequest) {
  try {
    if (req.method !== 'POST') {
      return setCORSHeaders(NextResponse.json({ error: 'Method not allowed' }, { status: 405 }), req.headers.get('origin') || undefined);
    }

    const body = await req.json();

    // Basic validation
    if (!body || !body.pharmacyId || !body.userId || !body.drugId || !body.timestamp) {
      return setCORSHeaders(NextResponse.json({ error: 'Invalid event payload' }, { status: 400 }), req.headers.get('origin') || undefined);
    }

    const result = await processDispensingEvent(body as any);
    return setCORSHeaders(NextResponse.json({ success: true, data: result }, { status: 201 }), req.headers.get('origin') || undefined);
  } catch (error) {
    logError('Analytics/dispense error', error);
    return setCORSHeaders(NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 }), req.headers.get('origin') || undefined);
  }
}

export const POST = withAuth(handler);
export const OPTIONS = (req: NextRequest) => new NextResponse(null, { status: 204 });
