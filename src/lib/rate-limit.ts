import { NextRequest, NextResponse } from 'next/server';
import { logWarn } from './logger';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

// Simple in-memory rate limit store (use Redis in production)
const rateLimitStore: RateLimitStore = {};

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

/**
 * Get client IP address
 */
export const getClientIP = (req: NextRequest): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
};

/**
 * Check rate limit for a client
 */
export const checkRateLimit = (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
  const now = Date.now();
  const key = `rate-limit:${identifier}`;

  if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
    // Reset
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetTime: rateLimitStore[key].resetTime,
    };
  }

  const record = rateLimitStore[key];
  if (record.count < MAX_REQUESTS) {
    record.count++;
    return {
      allowed: true,
      remaining: MAX_REQUESTS - record.count,
      resetTime: record.resetTime,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetTime: record.resetTime,
  };
};

/**
 * Middleware to enforce rate limiting
 */
export const withRateLimit = (handler: (req: NextRequest) => Promise<NextResponse>) => {
  return async (req: NextRequest) => {
    const clientIP = getClientIP(req);
    const { allowed, remaining, resetTime } = checkRateLimit(clientIP);

    if (!allowed) {
      logWarn('Rate limit exceeded', { clientIP, resetTime });
      const response = NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
      response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());
      response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', resetTime.toString());
      return response;
    }

    const response = await handler(req);
    response.headers.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toString());
    return response;
  };
};
