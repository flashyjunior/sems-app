import { NextRequest } from 'next/server';
import analyticsSSE from '@/lib/analytics-sse';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    analyticsSSE.broadcast({ type: 'alert', payload: body });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('analytics debug emit-alert', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}
