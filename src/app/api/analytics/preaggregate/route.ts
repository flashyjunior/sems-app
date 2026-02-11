import { NextRequest } from 'next/server';
import { preaggregateRange } from '@/services/analytics/preaggregationWorker';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { startDate, endDate, pharmacyId } = body;
    if (!startDate || !endDate) return new Response(JSON.stringify({ error: 'startDate and endDate required' }), { status: 400 });

    const res = await preaggregateRange(startDate, endDate, pharmacyId);
    return new Response(JSON.stringify({ data: res }));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });
  }
}
