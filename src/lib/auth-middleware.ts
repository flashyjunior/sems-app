import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';
import { logWarn } from './logger';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: number;
    email: string;
    roleId: number;
  };
}

/**
 * Middleware to check JWT authentication
 */
export const withAuth = (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
  return async (req: AuthenticatedRequest) => {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      logWarn('Invalid or expired token', { token: token.substring(0, 10) + '...' });
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
      roleId: payload.roleId,
    };

    return handler(req);
  };
};

/**
 * Middleware to check specific role
 */
export const withRole = (allowedRoles: number[]) => {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return withAuth(async (req: AuthenticatedRequest) => {
      if (!req.user || !allowedRoles.includes(req.user.roleId)) {
        logWarn('Unauthorized access attempt', { userId: req.user?.userId, allowedRoles });
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      return handler(req);
    });
  };
};
