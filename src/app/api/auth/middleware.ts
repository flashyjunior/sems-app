import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple in-memory auth token store
 * In production, replace with JWT verification or database lookup
 */
const validTokens = new Set<string>();

export function validateAuthToken(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  
  // For demo: accept any token starting with 'token_'
  // In production, verify JWT signature or lookup in database
  return token.startsWith('token_');
}

export function generateToken(): string {
  const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  validTokens.add(token);
  return token;
}

export function invalidateToken(token: string): void {
  validTokens.delete(token);
}

/**
 * Middleware to check authentication
 * Used by API routes
 */
export function withAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    if (!validateAuthToken(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return handler(req);
  };
}
