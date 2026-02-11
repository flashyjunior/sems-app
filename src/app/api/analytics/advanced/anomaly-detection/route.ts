import { NextRequest } from 'next/server';
import { detectAnomalies } from '@/services/analytics/anomalyDetection';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const pharmacyId = url.searchParams.get('pharmacyId') || undefined;
    if (!startDate || !endDate) return new Response(JSON.stringify({ error: 'startDate and endDate required' }), { status: 400 });
    const res = await detectAnomalies(startDate, endDate, pharmacyId);
    return new Response(JSON.stringify({ data: res }));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });
  }
}
