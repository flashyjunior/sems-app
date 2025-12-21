import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

/**
 * Handle CORS headers
 */
export const setCORSHeaders = (response: NextResponse, origin?: string): NextResponse => {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
};

/**
 * Middleware to handle CORS preflight requests
 */
export const handleCORS = (req: NextRequest): NextResponse | null => {
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return setCORSHeaders(response, req.headers.get('origin') || undefined);
  }
  
  return null;
};

/**
 * Verify if origin is allowed
 */
export const isOriginAllowed = (origin: string): boolean => {
  return ALLOWED_ORIGINS.includes(origin);
};
