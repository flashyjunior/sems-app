import { NextRequest } from 'next/server';
import bus from '@/lib/alert-bus';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = body || { id: `dbg-${Date.now()}`, timestamp: new Date().toISOString(), message: 'debug alert' };
    bus.emit(payload);
    return new Response(JSON.stringify({ data: true }));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400 });
  }
}
