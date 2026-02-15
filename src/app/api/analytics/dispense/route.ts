import { NextRequest } from 'next/server';
import { processDispensingEvent } from '@/services/analytics/serverProcessor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await processDispensingEvent(body);
    return new Response(JSON.stringify({ success: true, data: result }), { status: 200 });
  } catch (err) {
    console.error('api/analytics/dispense error', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}
