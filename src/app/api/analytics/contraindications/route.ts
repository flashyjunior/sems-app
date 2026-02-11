import { NextRequest, NextResponse } from 'next/server';
import { getContraindicationWarnings } from '@/services/analytics/eventEnricher';
import { setCORSHeaders } from '@/lib/cors';
import { logError } from '@/lib/logger';

async function handler(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const drugId = url.searchParams.get('drugId') || '';
    const ageGroup = (url.searchParams.get('ageGroup') as any) || 'adult';
    const isPregnant = url.searchParams.get('isPregnant') === 'true';

    if (!drugId) {
      return setCORSHeaders(NextResponse.json({ error: 'drugId required' }, { status: 400 }), req.headers.get('origin') || undefined);
    }

    const warnings = await getContraindicationWarnings(drugId, ageGroup, isPregnant);
    return setCORSHeaders(NextResponse.json({ success: true, data: warnings }, { status: 200 }), req.headers.get('origin') || undefined);
  } catch (error) {
    logError('Analytics/contraindications error', error);
    return setCORSHeaders(NextResponse.json({ error: 'Internal server error' }, { status: 500 }), req.headers.get('origin') || undefined);
  }
}

export const GET = handler;
export const OPTIONS = (req: NextRequest) => new NextResponse(null, { status: 204 });
