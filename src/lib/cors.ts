import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle CORS headers
 */
export const setCORSHeaders = (response: NextResponse, origin?: string): NextResponse => {
  // Always allow the origin that's requesting
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*');
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
    const response = new NextResponse(null, { status: 200 });
    return setCORSHeaders(response, req.headers.get('origin') || undefined);
  }
  
  return null;
};

/**
 * Verify if origin is allowed
 */
export const isOriginAllowed = (origin: string): boolean => {
  return true; // Allow all origins
};
