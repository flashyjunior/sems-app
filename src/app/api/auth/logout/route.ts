import { NextRequest, NextResponse } from 'next/server';
import { setCORSHeaders, handleCORS } from '@/lib/cors';

async function handler(req: NextRequest) {
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return setCORSHeaders(NextResponse.json({ error: 'Method not allowed' }, { status: 405 }), req.headers.get('origin') || undefined);
  }

  const response = NextResponse.json({ success: true }, { status: 200 });

  try {
    response.cookies.set('authToken', '', { httpOnly: true, path: '/', maxAge: 0 });
  } catch (e) {
    // fallback
    response.headers.set('Set-Cookie', 'authToken=; Path=/; HttpOnly; Max-Age=0');
  }

  return setCORSHeaders(response, req.headers.get('origin') || undefined);
}

export const POST = handler;
export const OPTIONS = (req: NextRequest) => {
  const corsResponse = handleCORS(req);
  return corsResponse || new NextResponse(null, { status: 204 });
};
